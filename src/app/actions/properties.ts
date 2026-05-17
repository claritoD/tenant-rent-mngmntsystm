'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createProperty(name: string, address: string) {
  try {
    const supabase: any = await createClient();
    const { error } = await (supabase as any).from('properties').insert({ name, address });
    if (error) throw error;
    
    revalidatePath('/owner/units');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function updateProperty(id: string, name: string, address: string) {
  try {
    const supabase: any = await createClient();
    const { error } = await (supabase as any).from('properties').update({ name, address }).eq('id', id);
    if (error) throw error;
    
    revalidatePath('/owner/units');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function deleteProperty(id: string) {
  try {
    const supabase: any = await createClient();
    const { error } = await (supabase as any).from('properties').delete().eq('id', id);
    if (error) throw error;
    
    revalidatePath('/owner/units');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

