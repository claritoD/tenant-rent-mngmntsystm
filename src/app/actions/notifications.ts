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

    if (!tenants || tenants.length === 0) {
      console.warn('[Broadcast] No active tenants found for this announcement.');
      return { success: true };
    }
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
    const { data: authUsers, error: authErr } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) {
      console.error('[Broadcast] Failed to list auth users for email:', authErr);
    } else if (authUsers?.users) {
      const activeTenantEmails = authUsers.users
        .filter(u => tenantIds.includes(u.id))
        .map(u => u.email)
        .filter(Boolean) as string[];

      console.log(`[Broadcast] Sending emails to ${activeTenantEmails.length} tenant(s):`, activeTenantEmails);

      if (activeTenantEmails.length > 0) {
        const emailResults = await Promise.allSettled(
          activeTenantEmails.map(email =>
            sendEmail({
              to: email,
              subject: `[RentsEasy] ${title}`,
              // Plain-text version — critical for avoiding spam filters
              text: `${title}\n\n${message}\n\nView on portal: ${siteUrl}/tenant\n\n---\nThis message was sent by your landlord via RentsEasy. Do not reply to this email.`,
              html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);font-weight:500;letter-spacing:0.05em;text-transform:uppercase;">RentsEasy</p>
            <h1 style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Announcement</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1e293b;">${title}</h2>
            <div style="font-size:15px;color:#475569;line-height:1.7;white-space:pre-wrap;">${message}</div>
            <div style="margin-top:32px;">
              <a href="${siteUrl}/tenant" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
                View in Tenant Portal →
              </a>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">This message was sent by your landlord via <strong>RentsEasy</strong>. Please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
            })
          )
        );
        emailResults.forEach((result, i) => {
          if (result.status === 'rejected') {
            console.error(`[Broadcast] Email to ${activeTenantEmails[i]} failed:`, result.reason);
          } else {
            console.log(`[Broadcast] Email to ${activeTenantEmails[i]}:`, result.value);
          }
        });
      }
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
