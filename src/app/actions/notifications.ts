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

/** Called by the owner to register their device */
export async function savePushSubscription(subscription: object) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ user_id: user.id, subscription }, { onConflict: 'user_id' });

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
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
