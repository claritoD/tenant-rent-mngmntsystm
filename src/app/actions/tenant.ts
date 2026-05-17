'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markAnnouncementsAsRead() {
  try {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('tenants')
      .update({ last_read_announcements_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw error;
    revalidatePath('/tenant');
    return { success: true };
  } catch (err) {
    console.error('Failed to mark announcements as read:', err);
    return { error: (err as Error).message };
  }
}
