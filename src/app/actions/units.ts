'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteUnit(unitId: string) {
  try {
    const supabase = await createClient();

    // 1. Check if occupied by active tenants
    const { count, error: countErr } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', unitId)
      .eq('is_active', true);

    if (countErr) throw countErr;
    if (count && count > 0) {
      return { error: 'Cannot delete unit while it has active tenants.' };
    }

    // 2. Delete
    const { error: delErr } = await supabase
      .from('units')
      .delete()
      .eq('id', unitId);

    if (delErr) throw delErr;

    revalidatePath('/owner/units');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
