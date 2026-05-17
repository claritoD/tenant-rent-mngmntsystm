'use server';

import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import { sendEmail } from '@/lib/nodemailer';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Setup web-push VAPID details
webpush.setVapidDetails(
  'mailto:' + (process.env.GMAIL_EMAIL ?? 'admin@example.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Saves a push subscription for the current user. Supports multiple devices. */
export async function savePushSubscription(subscription: Record<string, unknown>) {
  try {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .upsert({ 
        user_id: user.id, 
        endpoint: subscription.endpoint,
        subscription 
      }, { onConflict: 'endpoint' });

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

/** 
 * Sends a broadcast message to all active tenants via Push and Email.
 * Non-blocking, runs in background via Promise.allSettled.
 */
export async function broadcastMessageToTenants(title: string, message: string, isPinned: boolean = false, propertyId: string | null = null, imageUrl: string | null = null, expiresInDays: number | null = null, attachmentUrl: string | null = null) {
  try {
    const adminSupabase = getAdminSupabase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rentseasy.vercel.app';

    // 1. Log the announcement in the DB
    const { data: { user: owner } } = await (await createClient()).auth.getUser();
    let expires_at: string | null = null;
    if (expiresInDays !== null) {
      const d = new Date();
      d.setDate(d.getDate() + expiresInDays);
      expires_at = d.toISOString();
    }

    const { error: insertErr } = await adminSupabase.from('announcements').insert({
      sender_id: owner?.id,
      title,
      content: message,
      is_pinned: isPinned,
      property_id: propertyId,
      image_url: imageUrl,
      attachment_url: attachmentUrl,
      expires_at
    });
    if (insertErr) throw insertErr;
    
    // Trigger lazy cleanup of old announcements
    (async () => {
      const { error: rpcErr } = await adminSupabase.rpc('cleanup_expired_announcements');
      if (rpcErr) console.error('Cleanup error:', rpcErr);
    })();

    // 2. Fetch targeted active tenants
    let query = adminSupabase
      .from('tenants')
      .select('id')
      .eq('is_active', true);
    
    if (propertyId) {
      // Filter tenants by unit's property_id
      const { data: unitsInProperty } = await adminSupabase
        .from('units')
        .select('id')
        .eq('property_id', propertyId);
      
      const unitIds = unitsInProperty?.map(u => u.id) || [];
      query = query.in('unit_id', unitIds);
    }

    const { data: tenants } = await query;

    if (!tenants || tenants.length === 0) return;
    const tenantIds = tenants.map(t => t.id);

    // 3. Fetch all push subscriptions for these tenants
    const { data: subs } = await adminSupabase
      .from('push_subscriptions')
      .select('id, subscription')
      .in('user_id', tenantIds);

    // 4. Send Push Notifications
    if (subs && subs.length > 0) {
      const payload = JSON.stringify({ title, body: message, url: `${siteUrl}/tenant`, icon: '/icon-192.png' });
      subs.forEach(sub => {
        webpush.sendNotification(
          sub.subscription as unknown as webpush.PushSubscription,
          payload
        ).catch(async (e) => {
          if (e.statusCode === 410 || e.statusCode === 404) {
            await adminSupabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        });
      });
    }

    // 5. Send Emails (Fetch emails from Auth)
    const { data: authUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
    const activeTenantEmails = authUsers.users
      .filter(u => tenantIds.includes(u.id))
      .map(u => u.email)
      .filter(Boolean) as string[];

    if (activeTenantEmails.length > 0) {
      await Promise.allSettled(
        activeTenantEmails.map(email => 
          sendEmail({
            to: email,
            subject: title,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #6366f1;">Important Announcement</h2>
                <p style="font-size: 16px; font-weight: 600; color: #1e293b; margin-top: 0;">${title}</p>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">${message}</p>
                <a href="${siteUrl}/tenant" style="display: inline-block; margin-top: 24px; padding: 10px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Go to Tenant Portal
                </a>
              </div>
            `
          })
        )
      );
    }

    return { success: true };
  } catch (err) {
    console.error('Broadcast failed:', err);
    return { error: (err as Error).message };
  }
}

/** Fetches the owner's user_id by finding the user with role=owner */
async function getOwnerUserId(): Promise<string | null> {
  try {
    const adminSupabase = getAdminSupabase();
    const { data } = await adminSupabase.auth.admin.listUsers({ perPage: 100 });
    const owner = data?.users?.find(u => u.user_metadata?.role === 'owner');
    return owner?.id ?? null;
  } catch {
    return null;
  }
}

/** Sends a web push notification to all of the owner's registered devices */
async function sendWebPushToOwner(title: string, body: string, url: string) {
  try {
    const ownerId = await getOwnerUserId();
    if (!ownerId) return;

    const adminSupabase = getAdminSupabase();
    const { data: subs } = await adminSupabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', ownerId);

    if (!subs || subs.length === 0) return;

    const payload = JSON.stringify({ title, body, url, icon: '/icon-192.png' });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          sub.subscription as unknown as webpush.PushSubscription,
          payload
        );
      } catch (e: unknown) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          // Subscription expired — clean it up
          await adminSupabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Push send error:', e);
        }
      }
    }
  } catch (err) {
    console.error('sendWebPushToOwner failed:', err);
  }
}

/** Sends an email alert directly to the owner's Gmail */
async function sendEmailAlertToOwner(subject: string, body: string, url: string) {
  try {
    const ownerEmail = process.env.GMAIL_EMAIL;
    if (!ownerEmail) return;

    await sendEmail({
      to: ownerEmail,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #6366f1;">${subject}</h2>
          <p style="color: #334155; font-size: 15px;">${body}</p>
          <a href="${url}" style="display: inline-block; margin-top: 24px; padding: 10px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View in Dashboard
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">This is an automated alert from RentsEasy.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('sendEmailAlertToOwner failed:', err);
  }
}

/**
 * Primary public function: fires both web push AND email alert to the owner.
 * Non-blocking — all errors are caught internally.
 */
export async function triggerOwnerAlerts(title: string, message: string, url: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rentease.vercel.app';
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;

  await Promise.allSettled([
    sendWebPushToOwner(title, message, fullUrl),
    sendEmailAlertToOwner(title, message, fullUrl),
  ]);
}

/** Sends a web push notification to a specific tenant */
async function sendWebPushToTenant(tenantId: string, title: string, body: string, url: string) {
  try {
    const adminSupabase = getAdminSupabase();
    const { data: subs } = await adminSupabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', tenantId);

    if (!subs || subs.length === 0) return;

    const payload = JSON.stringify({ title, body, url, icon: '/icon-192.png' });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          sub.subscription as unknown as webpush.PushSubscription,
          payload
        );
      } catch (e: unknown) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await adminSupabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Push send error (tenant):', e);
        }
      }
    }
  } catch (err) {
    console.error('sendWebPushToTenant failed:', err);
  }
}

/** Sends an email alert directly to a specific tenant */
async function sendEmailAlertToTenant(tenantId: string, subject: string, body: string, url: string) {
  try {
    const adminSupabase = getAdminSupabase();
    const { data: authData } = await adminSupabase.auth.admin.getUserById(tenantId);
    const tenantEmail = authData?.user?.email;
    if (!tenantEmail) return;

    await sendEmail({
      to: tenantEmail,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #6366f1;">${subject}</h2>
          <p style="color: #334155; font-size: 15px;">${body}</p>
          <a href="${url}" style="display: inline-block; margin-top: 24px; padding: 10px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Dashboard
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">This is an automated alert from your landlord via RentsEasy.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('sendEmailAlertToTenant failed:', err);
  }
}

/**
 * Sends both web push AND email alert to a specific tenant.
 * Non-blocking.
 */
export async function triggerTenantAlerts(tenantId: string, title: string, message: string, url: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rentease.vercel.app';
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;

  await Promise.allSettled([
    sendWebPushToTenant(tenantId, title, message, fullUrl),
    sendEmailAlertToTenant(tenantId, title, message, fullUrl),
  ]);
}
