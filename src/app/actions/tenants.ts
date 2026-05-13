'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/nodemailer';
import type { Tenant } from '@/types/database.types';

/** Marks a tenant as inactive and unassigns them from their unit, but keeps their data for history. */
export async function archiveTenant(tenantId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized');

    const { error } = await supabase
      .from('tenants')
      .update({ 
        is_active: false,
        unit_id: null 
      })
      .eq('id', tenantId);

    if (error) throw error;

    revalidatePath('/owner/tenants');
    revalidatePath(`/owner/tenants/${tenantId}`);
    revalidatePath('/owner/units');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

/** Permanently deletes a tenant and all their associated data (bills, payments, etc.) */
export async function deleteTenant(tenantId: string) {
  try {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify requesting user is owner
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized');

    // Deleting the Auth user triggers a CASCADE delete on the 'tenants' table
    // which in turn triggers a CASCADE delete on bills, payments, etc.
    const { error } = await adminSupabase.auth.admin.deleteUser(tenantId);

    if (error) throw error;

    revalidatePath('/owner/tenants');
    revalidatePath('/owner/units');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function updateTenant(tenantId: string, data: Partial<Tenant>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized');
    const { error } = await supabase
      .from('tenants')
      .update(data)
      .eq('id', tenantId);

    if (error) throw error;

    revalidatePath('/owner/tenants');
    revalidatePath(`/owner/tenants/${tenantId}`);
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export interface HistoricalPayment {
  amount: number;
  date: string;
}

export async function quickStartTenant(data: {
  name: string;
  email: string;
  password: string;
  unit_id: string;
  move_in_date: string;
  has_wifi?: boolean;
  wifi_rate?: number;
  water_mode?: 'tank' | 'metered' | 'per_head';
  water_tank_rate?: number;
  occupants_count?: number;
  water_per_head_rate?: number;
  security_deposit?: number;
  start_electric_reading?: number;
  start_water_reading?: number;
  payments: HistoricalPayment[];
}) {
  try {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Create Auth User
    const { data: authData, error: authErr } = await adminSupabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { role: 'tenant', full_name: data.name }
    });

    if (authErr) throw new Error(`Auth Error: ${authErr.message}`);
    const userId = authData.user.id;

    // 2. Create Tenant Record
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized');

    const { error: tErr } = await supabase.from('tenants').insert({
      id: userId,
      name: data.name,
      unit_id: data.unit_id,
      move_in_date: data.move_in_date,
      has_wifi: data.has_wifi ?? false,
      wifi_rate: data.wifi_rate ?? 0,
      water_mode: data.water_mode ?? 'tank',
      water_tank_rate: data.water_tank_rate ?? 0,
      occupants_count: data.occupants_count ?? 1,
      water_per_head_rate: data.water_per_head_rate ?? 0,
      security_deposit: data.security_deposit ?? 0,
      start_electric_reading: data.start_electric_reading ?? 0,
      start_water_reading: data.start_water_reading ?? 0,
      is_active: true
    });

    if (tErr) {
      // Cleanup auth user if tenant record fails
      await adminSupabase.auth.admin.deleteUser(userId);
      throw new Error(`Tenant Error: ${tErr.message}`);
    }

    // Fetch Unit Details for the email
    const { data: unitData } = await adminSupabase
      .from('units')
      .select('unit_name, base_rent')
      .eq('id', data.unit_id)
      .single();

    // 3. Insert Historical Payments
    if (data.payments.length > 0) {
      const paymentRecords = data.payments.map(p => ({
        tenant_id: userId,
        amount: p.amount,
        payment_method: 'cash' as const,
        gcash_ref: 'Historical Record',
        status: 'verified' as const,
        date_submitted: new Date(p.date).toISOString(),
        verified_at: new Date(p.date).toISOString()
      }));

      const { error: pErr } = await supabase.from('payments').insert(paymentRecords);
      if (pErr) throw new Error(`Payment Import Error: ${pErr.message}`);
    }

    // 4. Send Welcome Email
    try {
      await sendEmail({
        to: data.email,
        subject: 'Welcome to your Tenant Portal!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #6366f1;">Hello ${data.name}!</h2>
            <p>Your landlord has created an account for you in the <strong>RentsEasy Tenant Portal</strong>.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;">Rental Details:</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Unit:</strong> ${unitData?.unit_name || 'Assigned Unit'}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Monthly Rent:</strong> ₱${unitData?.base_rent?.toLocaleString() || '0'}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Move-in Date:</strong> ${new Date(data.move_in_date).toLocaleDateString()}</p>
            </div>

            <p>You can now log in to view your bills, submit payments, and request maintenance.</p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>Login URL:</strong> <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rentseasy.vercel.app'}/login">Click here to login</a></p>
              <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Temporary Password:</strong> ${data.password}</p>
            </div>
            <p style="font-size: 12px; color: #64748b;">Please change your password once you log in.</p>
          </div>
        `
      });
    } catch (e) {
      const emailError = e instanceof Error ? e.message : String(e);
      console.error('⚠️ Email failed to send for tenant:', data.email, 'Error:', emailError);
    }

    revalidatePath('/owner/tenants');
    revalidatePath('/owner/payments');
    
    return { success: true, userId };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
