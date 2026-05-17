'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteAnnouncement(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized');

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/owner/broadcast');
    revalidatePath('/tenant');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function updateAnnouncement(id: string, updates: { title: string, content: string, is_pinned: boolean, property_id: string | null, image_url?: string | null, attachment_url?: string | null, expires_at?: string | null }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized');

    const { error } = await (supabase as any).from('announcements').update(updates).eq('id', id);
    if (error) throw error;

    revalidatePath('/owner/broadcast');
    revalidatePath('/tenant');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
