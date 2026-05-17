'use server';

import { createClient as createServerClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/nodemailer';
import { passwordResetEmail } from '@/lib/emailTemplates';

// Helper to get Admin Client for bypassing RLS
function getAdminSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function checkRateLimit(email: string) {
  const adminSupabase = getAdminSupabase();
  const normalizedEmail = email.toLowerCase().trim();

  const { data, error } = await adminSupabase
    .from('login_attempts')
    .select('attempts, last_attempt')
    .eq('email', normalizedEmail)
    .single();

  if (data) {
    const lastAttemptTime = new Date(data.last_attempt).getTime();
    const currentTime = new Date().getTime();
    const diffMinutes = (currentTime - lastAttemptTime) / (1000 * 60);

    // If locked (5 or more attempts) and within 15 minutes
    if (data.attempts >= 5 && diffMinutes < 15) {
      const remainingMinutes = Math.ceil(15 - diffMinutes);
      return { locked: true, remainingMinutes };
    }

    // If lockout period expired, reset the attempts count
    if (data.attempts >= 5 && diffMinutes >= 15) {
       await adminSupabase.from('login_attempts').update({ attempts: 0 }).eq('email', normalizedEmail);
    }
  }

  return { locked: false, remainingMinutes: 0 };
}

export async function incrementLoginAttempt(email: string) {
  const adminSupabase = getAdminSupabase();
  const normalizedEmail = email.toLowerCase().trim();

  const { data } = await adminSupabase
    .from('login_attempts')
    .select('attempts')
    .eq('email', normalizedEmail)
    .single();

  if (data) {
    await adminSupabase
      .from('login_attempts')
      .update({
        attempts: data.attempts + 1,
        last_attempt: new Date().toISOString()
      })
      .eq('email', normalizedEmail);
  } else {
    await adminSupabase
      .from('login_attempts')
      .insert({
        email: normalizedEmail,
        attempts: 1,
        last_attempt: new Date().toISOString()
      });
  }
}

export async function resetLoginAttempts(email: string) {
  const adminSupabase = getAdminSupabase();
  const normalizedEmail = email.toLowerCase().trim();
  await adminSupabase.from('login_attempts').delete().eq('email', normalizedEmail);
}

export async function sendPasswordResetEmail(email: string) {
  try {
    const adminSupabase = getAdminSupabase();
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Generate Link
    const { data, error } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
      }
    });

    if (error) throw new Error(error.message);

    const actionLink = data.properties.action_link;

    // 2. Send via Nodemailer
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: '[RentsEasy] Password Reset Request',
      html: passwordResetEmail({ actionLink }),
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error);
    }

    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

/** Owner-triggered: send password reset email to a specific tenant by their user ID */
export async function sendTenantPasswordReset(tenantId: string) {
  try {
    const adminSupabase = getAdminSupabase();

    // Verify the caller is the owner
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized');

    // Look up tenant email from Auth
    const { data: authData, error: authErr } = await adminSupabase.auth.admin.getUserById(tenantId);
    if (authErr || !authData?.user?.email) throw new Error('Tenant email not found');

    // Reuse existing reset flow
    const result = await sendPasswordResetEmail(authData.user.email);
    return result;
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
