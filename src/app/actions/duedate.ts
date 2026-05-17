'use server';

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/nodemailer';
import { dueDateApprovedEmail, dueDateRejectedEmail } from '@/lib/emailTemplates';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { triggerOwnerAlerts } from '@/app/actions/notifications';

export async function submitDueDateChangeRequest(
  requestedDay: number,
  reason: string
) {
  try {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated.' };
    if (!requestedDay || requestedDay < 1 || requestedDay > 31) {
      return { error: 'Invalid day. Please select a day between 1-31.' };
    }

    // Get current tenant to verify existence
    const { data: tenant, error: tErr } = await (supabase as any)
      .from('tenants')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (tErr || !tenant) return { error: 'Tenant not found.' };
    if (tenant.anniversary_day === requestedDay) {
      return { error: 'The new due date is the same as your current due date.' };
    }

    // Check if there's already a pending request
    const { data: pending } = await (supabase as any)
      .from('due_date_change_requests')
      .select('*')
      .eq('tenant_id', user.id)
      .eq('status', 'pending')
      .single();

    if (pending) return { error: 'You already have a pending due date change request.' };

    // Create the request
    const { error: insertErr } = await (supabase as any)
      .from('due_date_change_requests')
      .insert({
        tenant_id: user.id,
        current_anniversary_day: tenant.anniversary_day,
        requested_anniversary_day: requestedDay,
        reason: reason || null,
      });

    if (insertErr) throw insertErr;

    // Notify owner
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rentease.vercel.app';
    await triggerOwnerAlerts(
      'Due Date Extension Request',
      `${tenant.name} has requested to change their bill due date from day ${tenant.anniversary_day} to day ${requestedDay}. Reason: "${reason || 'No reason provided'}".`,
      `${siteUrl}/owner/due-date-requests`
    ).catch(console.error);

    revalidatePath('/tenant');

    return { success: true };
  } catch (err: unknown) {
    console.error('Error submitting due date change request:', err);
    return { error: 'Failed to submit request. Please try again.' };
  }
}

export async function approveDueDateChangeRequest(
  requestId: string,
  ownerNote?: string
) {
  try {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated.' };

    // Fetch the request with tenant info
    const { data: request, error: fErr } = await (supabase as any)
      .from('due_date_change_requests')
      .select('*, tenant:tenants(*)')
      .eq('id', requestId)
      .single();

    if (fErr || !request) return { error: 'Request not found.' };
    if (request.status !== 'pending') return { error: 'Request is no longer pending.' };

    const tenant_obj = request.tenant;

    // Update request status
    const { error: updateReqErr } = await (supabase as any)
      .from('due_date_change_requests')
      .update({
        status: 'approved',
        owner_note: ownerNote || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateReqErr) throw updateReqErr;

    // Update tenant's move_in_date to reflect new anniversary day
    // Calculate the new move_in_date
    const moveInDate = new Date(tenant_obj.move_in_date);
    const newMoveInDate = new Date(moveInDate);
    newMoveInDate.setDate(request.requested_anniversary_day);

    const { error: updateTenantErr } = await (supabase as any)
      .from('tenants')
      .update({
        move_in_date: newMoveInDate.toISOString().split('T')[0],
      })
      .eq('id', tenant_obj.id);

    if (updateTenantErr) throw updateTenantErr;

    // Send email to tenant
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: authData } = await adminSupabase.auth.admin.getUserById(tenant_obj.id);
    const email = authData?.user?.email;

    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: '[RentsEasy] Due Date Change Approved ✅',
          html: dueDateApprovedEmail({
            name: tenant_obj.name,
            newDay: request.requested_anniversary_day,
            oldDay: request.current_anniversary_day,
            ownerNote,
          }),
        });
      } catch (e) {
        console.error('Email notification failed:', e);
      }
    }

    revalidatePath('/owner/settings');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error approving due date change request:', err);
    return { error: 'Failed to approve request. Please try again.' };
  }
}

export async function rejectDueDateChangeRequest(
  requestId: string,
  ownerNote?: string
) {
  try {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated.' };

    // Fetch the request with tenant info
    const { data: request, error: fErr } = await (supabase as any)
      .from('due_date_change_requests')
      .select('*, tenant:tenants(*)')
      .eq('id', requestId)
      .single();

    if (fErr || !request) return { error: 'Request not found.' };
    if (request.status !== 'pending') return { error: 'Request is no longer pending.' };

    const tenant = request.tenant;

    // Update request status
    const { error: updateErr } = await (supabase as any)
      .from('due_date_change_requests')
      .update({
        status: 'rejected',
        owner_note: ownerNote || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateErr) throw updateErr;

    // Send email to tenant
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: authData } = await adminSupabase.auth.admin.getUserById(tenant.id);
    const email = authData?.user?.email;

    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: '[RentsEasy] Due Date Request Update ℹ️',
          html: dueDateRejectedEmail({
            name: tenant.name,
            currentDay: request.current_anniversary_day,
            ownerNote,
          }),
        });
      } catch (e) {
        console.error('Email notification failed:', e);
      }
    }

    revalidatePath('/owner/settings');
    return { success: true };
  } catch (err: unknown) {
    console.error('Error rejecting due date change request:', err);
    return { error: 'Failed to reject request. Please try again.' };
  }
}
