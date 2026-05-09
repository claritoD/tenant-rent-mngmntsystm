'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { triggerOwnerAlerts } from '@/app/actions/notifications';

export async function requestWaterRefill() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

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
