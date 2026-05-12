'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { triggerOwnerAlerts } from '@/app/actions/notifications';

export async function requestWaterRefill() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    // Duplicate protection: Check if there's already a pending request
    const { data: existing } = await supabase
      .from('water_refills')
      .select('id')
      .eq('tenant_id', user.id)
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (existing) {
      return { success: true, message: 'Request already pending.' };
    }

    const { error } = await supabase.from('water_refills').insert({
      tenant_id: user.id,
      status: 'pending',
    });

    if (error) throw error;

    // Fetch tenant name for the alert
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', user.id)
      .single();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rentease.vercel.app';
    await triggerOwnerAlerts(
      'Water Refill Requested',
      `${tenant?.name ?? 'A tenant'} has requested a water tank refill.`,
      `${siteUrl}/owner/water-refills`
    ).catch(console.error);

    revalidatePath('/tenant');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

/** Called by the owner to manually record a refill without a request */
export async function recordManualWaterRefill(tenantId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized.');

    // Fetch tenant's tank rate
    const { data: tenant, error: tErr } = await supabase
      .from('tenants')
      .select('water_tank_rate')
      .eq('id', tenantId)
      .single();

    if (tErr || !tenant) throw new Error('Tenant not found.');

    const { error } = await supabase.from('water_refills').insert({
      tenant_id: tenantId,
      status: 'completed',
      amount: tenant.water_tank_rate,
      completed_at: new Date().toISOString(),
    });

    if (error) throw error;

    revalidatePath(`/owner/tenants/${tenantId}`);
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
