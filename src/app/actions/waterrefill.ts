'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { triggerOwnerAlerts } from '@/app/actions/notifications';

export async function requestWaterRefill() {
  try {
    const supabase: any = await createClient();
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

    const { error } = await (supabase as any).from('water_refills').insert({
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
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized.');

    // Fetch tenant's tank rate
    const { data: tenant, error: tErr } = await supabase
      .from('tenants')
      .select('water_tank_rate')
      .eq('id', tenantId)
      .single();

    if (tErr || !tenant) throw new Error('Tenant not found.');

    const { error } = await (supabase as any).from('water_refills').insert({
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

/** Resolves an existing water refill request (called from WaterRefillAction) */
export async function resolveWaterRefill(requestId: string, status: 'completed' | 'cancelled', amount?: number, tenantId?: string, tenantName?: string) {
  try {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized.');

    const updateData: any = {
      status,
      completed_at: new Date().toISOString(),
    };
    if (amount !== undefined) {
      updateData.amount = amount;
    }

    const { error } = await (supabase as any).from('water_refills').update(updateData).eq('id', requestId);
    if (error) throw error;

    // Send notification if completed and we have tenant details
    if (status === 'completed' && tenantId) {
      const { triggerTenantAlerts } = await import('@/app/actions/notifications');
      await triggerTenantAlerts(
        tenantId,
        'Water Tank Refilled 💧',
        'Your water tank has been successfully refilled.',
        '/tenant'
      ).catch(console.error);
    }

    revalidatePath('/owner/water-refills');
    if (tenantId) revalidatePath(`/owner/tenants/${tenantId}`);
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

