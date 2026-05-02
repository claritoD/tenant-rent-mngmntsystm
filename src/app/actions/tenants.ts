'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function archiveTenant(tenantId: string) {
  try {
    const supabase = await createClient();

    // 1. Mark as inactive and clear unit association
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
    const { error: tErr } = await supabase.from('tenants').insert({
      id: userId,
      name: data.name,
      unit_id: data.unit_id,
      move_in_date: data.move_in_date,
      is_active: true
    });

    if (tErr) {
      // Cleanup auth user if tenant record fails
      await adminSupabase.auth.admin.deleteUser(userId);
      throw new Error(`Tenant Error: ${tErr.message}`);
    }

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

    revalidatePath('/owner/tenants');
    revalidatePath('/owner/payments');
    
    return { success: true, userId };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
