'use server';

import { createClient } from '@/lib/supabase/server';
import type { Tenant } from '@/types/database.types';
import { sendEmail } from '@/lib/nodemailer';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { triggerOwnerAlerts } from './notifications';

export async function verifyPayment(paymentId: string) {
  try {
    const supabase = await createClient();

    // 1. Fetch payment
    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .select('*, tenant:tenants(*)')
      .eq('id', paymentId)
      .single();
    if (pErr || !payment) return { error: 'Payment not found.' };
    if (payment.status !== 'pending') return { error: 'Payment already processed.' };

    const tenant = (payment as { tenant: Tenant }).tenant;
    const amount = payment.amount;

    // 2. Apply amount to tenant balance
    let remaining = amount;
    const applyToArrears = Math.min(tenant.arrears, remaining);
    
    const newArrears = tenant.arrears - applyToArrears;
    remaining -= applyToArrears;
    const newCredit = tenant.credit_balance + remaining;

    // 3. Update tenant
    const { error: tErr } = await supabase.from('tenants').update({
      arrears: newArrears,
      credit_balance: newCredit
    }).eq('id', tenant.id);
    if (tErr) throw new Error(tErr.message);

    // 4. Update bills if arrears is 0
    if (newArrears <= 0) {
      await supabase.from('bills').update({ is_paid: true }).eq('tenant_id', tenant.id).eq('is_paid', false);
    }

    // 5. Mark payment verified
    const { error: upErr } = await supabase.from('payments').update({
      status: 'verified',
      verified_at: new Date().toISOString()
    }).eq('id', paymentId);
    if (upErr) throw new Error(upErr.message);

    // 6. Send Email Notification
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: authData } = await adminSupabase.auth.admin.getUserById(tenant.id);
    const email = authData?.user?.email;

    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: `Payment Verified - ₱${amount.toFixed(2)}`,
          html: `
            <h2>Hello ${tenant.name},</h2>
            <p>Your GCash payment of <strong>₱${amount.toFixed(2)}</strong> has been verified and applied to your account.</p>
            <p>Your new outstanding arrears balance is <strong>₱${newArrears.toFixed(2)}</strong>.</p>
            <p style="margin-top: 20px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rentseasy.vercel.app'}/login" style="background: #6366f1; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Go to Dashboard</a></p>
            <p>Thank you!</p>
          `
        });
      } catch (e) {
        console.error('Email notification failed:', e);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function rejectPayment(paymentId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('payments').update({
      status: 'rejected',
      verified_at: new Date().toISOString()
    }).eq('id', paymentId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function ownerRecordPayment(formData: FormData) {
  try {
    const supabase = await createClient();
    
    const tenantId = formData.get('tenantId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const method = formData.get('method') as 'cash' | 'gcash';
    const gcashRef = formData.get('gcashRef') as string || 'Manual Recording';

    if (amount <= 0) throw new Error('Amount must be positive.');

    // 1. Create the payment record (auto-verified)
    const { error: pErr } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        amount,
        payment_method: method,
        gcash_ref: gcashRef,
        status: 'verified',
        verified_at: new Date().toISOString()
      });

    if (pErr) throw new Error(pErr.message);

    // 2. Fetch tenant to update balance
    const { data: tenant, error: tFetchErr } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    if (tFetchErr || !tenant) throw new Error('Tenant not found.');

    // 3. Calculate new balances
    let remaining = amount;
    const applyToArrears = Math.min(tenant.arrears, remaining);
    const newArrears = tenant.arrears - applyToArrears;
    remaining -= applyToArrears;
    const newCredit = tenant.credit_balance + remaining;

    // 4. Update tenant
    const { error: tUpErr } = await supabase.from('tenants').update({
      arrears: newArrears,
      credit_balance: newCredit
    }).eq('id', tenantId);
    if (tUpErr) throw new Error(tUpErr.message);

    // 5. Mark bills as paid if arrears is 0
    if (newArrears <= 0) {
      await supabase.from('bills').update({ is_paid: true }).eq('tenant_id', tenantId).eq('is_paid', false);
    }

    revalidatePath('/owner/payments');
    revalidatePath('/owner');

    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}


