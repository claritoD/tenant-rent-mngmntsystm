'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Unit } from '@/types/database.types';

export async function updateUnit(unitId: string, data: Partial<Unit>) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('units')
      .update(data)
      .eq('id', unitId);

    if (error) throw error;

    revalidatePath('/owner/units');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function deleteUnit(unitId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', unitId);

    if (error) throw error;

    revalidatePath('/owner/units');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
