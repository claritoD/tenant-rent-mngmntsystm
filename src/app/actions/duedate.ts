'use server';

import { createClient } from '@/lib/supabase/server';
import type { Tenant, DueDateChangeRequest } from '@/types/database.types';
import { sendEmail } from '@/lib/nodemailer';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function submitDueDateChangeRequest(
  requestedDay: number,
  reason: string
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated.' };
    if (!requestedDay || requestedDay < 1 || requestedDay > 31) {
      return { error: 'Invalid day. Please select a day between 1-31.' };
    }

    // Get current tenant to verify existence
    const { data: tenant, error: tErr } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (tErr || !tenant) return { error: 'Tenant not found.' };
    if (tenant.anniversary_day === requestedDay) {
      return { error: 'The new due date is the same as your current due date.' };
    }

    // Check if there's already a pending request
    const { data: pending } = await supabase
      .from('due_date_change_requests')
      .select('*')
      .eq('tenant_id', user.id)
      .eq('status', 'pending')
      .single();

    if (pending) return { error: 'You already have a pending due date change request.' };

    // Create the request
    const { error: insertErr } = await supabase
      .from('due_date_change_requests')
      .insert({
        tenant_id: user.id,
        current_anniversary_day: tenant.anniversary_day,
        requested_anniversary_day: requestedDay,
        reason: reason || null,
      });

    if (insertErr) throw insertErr;

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated.' };

    // Fetch the request with tenant info
    const { data: request, error: fErr } = await supabase
      .from('due_date_change_requests')
      .select('*, tenant:tenants(*)')
      .eq('id', requestId)
      .single();

    if (fErr || !request) return { error: 'Request not found.' };
    if (request.status !== 'pending') return { error: 'Request is no longer pending.' };

    const tenant = (request as unknown as { tenant: Tenant }).tenant;

    // Update request status
    const { error: updateReqErr } = await supabase
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
    const moveInDate = new Date(tenant.move_in_date);
    const currentDay = moveInDate.getDate();
    const newMoveInDate = new Date(moveInDate);
    newMoveInDate.setDate(request.requested_anniversary_day);

    const { error: updateTenantErr } = await supabase
      .from('tenants')
      .update({
        move_in_date: newMoveInDate.toISOString().split('T')[0],
      })
      .eq('id', tenant.id);

    if (updateTenantErr) throw updateTenantErr;

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
        const dayString = String(request.requested_anniversary_day).padStart(2, '0');
        await sendEmail({
          to: email,
          subject: 'Due Date Change Approved ✅',
          html: `
            <h2>Hello ${tenant.name},</h2>
            <p>Your request to change your bill due date has been <strong>approved</strong>!</p>
            <p>
              Your new due date is now the <strong>${request.requested_anniversary_day}${['st', 'nd', 'rd'][((request.requested_anniversary_day - 1) % 3)] || 'th'} of each month</strong>.
              <br/>
              (Previously: ${request.current_anniversary_day}${['st', 'nd', 'rd'][((request.current_anniversary_day - 1) % 3)] || 'th'} of each month)
            </p>
            ${ownerNote ? `<p><strong>Note from landlord:</strong><br/>${ownerNote}</p>` : ''}
            <p style="margin-top: 20px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rentseasy.vercel.app'}/login" style="background: #6366f1; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Go to Dashboard</a></p>
            <p>Thank you!</p>
          `
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated.' };

    // Fetch the request with tenant info
    const { data: request, error: fErr } = await supabase
      .from('due_date_change_requests')
      .select('*, tenant:tenants(*)')
      .eq('id', requestId)
      .single();

    if (fErr || !request) return { error: 'Request not found.' };
    if (request.status !== 'pending') return { error: 'Request is no longer pending.' };

    const tenant = (request as unknown as { tenant: Tenant }).tenant;

    // Update request status
    const { error: updateErr } = await supabase
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
          subject: 'Due Date Change Request Update ℹ️',
          html: `
            <h2>Hello ${tenant.name},</h2>
            <p>Your request to change your bill due date has been <strong>declined</strong>.</p>
            <p>Your due date remains the <strong>${request.current_anniversary_day}${['st', 'nd', 'rd'][((request.current_anniversary_day - 1) % 3)] || 'th'} of each month</strong>.</p>
            ${ownerNote ? `<p><strong>Note from landlord:</strong><br/>${ownerNote}</p>` : ''}
            <p>You can submit a new request if you'd like. If you have questions, please contact your landlord.</p>
            <p style="margin-top: 20px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rentseasy.vercel.app'}/login" style="background: #6366f1; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Go to Dashboard</a></p>
          `
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
