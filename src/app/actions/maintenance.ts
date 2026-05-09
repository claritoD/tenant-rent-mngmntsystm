'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { triggerOwnerAlerts } from './notifications';

export async function createMaintenanceTicket(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    const description = formData.get('description') as string;
    const photo = formData.get('photo') as File | null;

    if (!description) throw new Error('Description is required.');

    let photoUrl = null;
    if (photo && photo.size > 0) {
      const ext = photo.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('maintenance-photos')
        .upload(path, photo);
      
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('maintenance-photos').getPublicUrl(path);
      photoUrl = publicUrl;
    }

    const { error } = await supabase.from('maintenance_tickets').insert({
      tenant_id: user.id,
      description,
      photo_url: photoUrl,
      status: 'pending'
    });

    if (error) throw error;

    // Fetch tenant details for the notification
    const { data: tenant } = await supabase.from('tenants').select('name').eq('id', user.id).single();

    await triggerOwnerAlerts(
      'New Maintenance Ticket',
      `${tenant?.name || 'A tenant'} reported an issue: "${description}".`,
      `${process.env.NEXT_PUBLIC_SITE_URL}/owner/maintenance`
    );

    revalidatePath('/tenant/maintenance');
    revalidatePath('/owner/maintenance');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('maintenance_tickets')
      .update({ status })
      .eq('id', ticketId);

    if (error) throw error;

    revalidatePath('/tenant/maintenance');
    revalidatePath('/owner/maintenance');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}
