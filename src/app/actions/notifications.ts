'use server';

import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import { sendEmail } from '@/lib/nodemailer';
import { createClient as createServerClient } from '@supabase/supabase-js';

// Setup web-push
webpush.setVapidDetails(
  'mailto:' + (process.env.GMAIL_EMAIL || 'admin@example.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function savePushSubscription(subscription: webpush.PushSubscription) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ 
        user_id: user.id, 
        subscription 
      }, { onConflict: 'user_id, subscription' });

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

// Internal helper for server actions
export async function sendWebPushToOwner(title: string, body: string, url: string = 'https://rentease.vercel.app') {
  try {
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get the owner
    const { data: owners } = await adminSupabase.from('owner_settings').select('owner_id').limit(1);
    const ownerId = owners?.[0]?.owner_id;
    if (!ownerId) return { error: 'Owner not found.' };

    const { data: subs } = await adminSupabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', ownerId);

    if (subs && subs.length > 0) {
      const payload = JSON.stringify({ title, body, url });
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub.subscription as unknown as webpush.PushSubscription, payload);
        } catch (e: unknown) {
          if ((e as { statusCode?: number }).statusCode === 410 || (e as { statusCode?: number }).statusCode === 404) {
            // Subscription has expired or is no longer valid
            await adminSupabase.from('push_subscriptions').delete().eq('subscription', sub.subscription);
          } else {
             console.error('Error sending push notification:', e);
          }
        }
      }
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to send web push:', err);
    return { error: (err as Error).message };
  }
}

export async function sendEmailAlertToOwner(subject: string, htmlMessage: string) {
  try {
    const ownerEmail = process.env.GMAIL_EMAIL; // Single-owner setup
    if (!ownerEmail) return { error: 'Owner email not configured.' };

    await sendEmail({
      to: ownerEmail,
      subject: subject,
      html: htmlMessage,
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send email alert:', err);
    return { error: (err as Error).message };
  }
}

export async function triggerOwnerAlerts(title: string, message: string, url: string) {
  // Fire both simultaneously
  await Promise.allSettled([
    sendWebPushToOwner(title, message, url),
    sendEmailAlertToOwner(title, `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #6366f1;">${title}</h2>
        <p>${message}</p>
        <a href="${url}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px;">View Dashboard</a>
      </div>
    `)
  ]);
}
