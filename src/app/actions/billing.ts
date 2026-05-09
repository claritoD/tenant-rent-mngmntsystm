'use server';

import { createClient } from '@/lib/supabase/server';
import { computeBill, latestReadingDate, periodLabel } from '@/utils/billing';
import type { Tenant, Unit, MeterReading, WaterRefill } from '@/types/database.types';
import { sendEmail } from '@/lib/nodemailer';
import { createClient as createServerClient } from '@supabase/supabase-js';

export async function generateBill(tenantId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'owner') throw new Error('Unauthorized');

    // 1. Fetch Tenant & Unit
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .select('*, unit:units(*)')
      .eq('id', tenantId)
      .single();
    if (tenantErr || !tenant) return { error: 'Tenant not found.' };

    const unit = (tenant as { unit: Unit }).unit;
    const billDate = new Date();
    const pLabel = periodLabel(billDate);

    // 1.5 Check for existing bill this period
    const { data: existingBill } = await supabase
      .from('bills')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('period_label', pLabel)
      .maybeSingle();

    if (existingBill) {
      return { error: `Bill for ${pLabel} already exists.` };
    }

    // 2. Fetch Latest Readings (Electric + Water if metered)
    const latestDate = latestReadingDate();
    
    const { data: readings } = await supabase
      .from('meter_readings')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('reading_date', latestDate.toISOString());

    const electricReading = readings?.find(r => r.type === 'electric') || null;
    const waterReading = tenant.water_mode === 'metered' ? (readings?.find(r => r.type === 'water') || null) : null;

    // 3. Fetch Unbilled Water Refills
    let waterRefills: WaterRefill[] = [];
    if (tenant.water_mode === 'tank') {
      const { data } = await supabase
        .from('water_refills')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .eq('billed', false);
      waterRefills = data || [];
    }

    // 4. Compute Bill
    const breakdown = computeBill(tenant as Tenant, unit, electricReading as MeterReading | null, waterReading as MeterReading | null, waterRefills);

    // 5. Transaction: We need to use service role to bypass some RLS if needed, 
    // or just run sequentially since owner has full access.
    
    // Create bill
    const { data: newBill, error: billErr } = await supabase.from('bills').insert({
      tenant_id: tenantId,
      bill_date: billDate.toISOString().split('T')[0],
      period_label: pLabel,
      rent_amount: breakdown.rent,
      electric_amount: breakdown.electric,
      water_amount: breakdown.water,
      wifi_amount: breakdown.wifi,
      arrears_carried: breakdown.arrearsCarried,
      credit_applied: breakdown.creditApplied,
      total_due: breakdown.totalDue,
      is_paid: breakdown.totalDue <= 0,
    }).select().single();

    if (billErr) throw new Error(billErr.message);

    // Update tenant balances
    const { error: tUpdateErr } = await supabase.from('tenants').update({
      arrears: breakdown.totalDue, // Old arrears are now rolled into the new total_due
      credit_balance: Math.max(0, tenant.credit_balance - breakdown.creditApplied),
    }).eq('id', tenantId);
    if (tUpdateErr) throw new Error(tUpdateErr.message);

    // Update water refills to billed
    if (waterRefills.length > 0) {
      const { error: wrErr } = await supabase.from('water_refills')
        .update({ billed: true })
        .in('id', waterRefills.map(r => r.id));
      if (wrErr) throw new Error(wrErr.message);
    }

    // 6. Send Email Notification
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: authData } = await adminSupabase.auth.admin.getUserById(tenantId);
    const email = authData?.user?.email;

    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: `Your RentsEasy Bill for ${pLabel} is Ready`,
          html: `
            <h2>Hello ${tenant.name},</h2>
            <p>Your hybrid utility bill for <strong>${pLabel}</strong> has been generated.</p>
            <h3>Total Due: ₱${breakdown.totalDue.toFixed(2)}</h3>
            <p>Please log in to your tenant dashboard to view the full breakdown and submit your GCash payment reference.</p>
            <p style="margin-top: 20px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rentseasy.vercel.app'}/login" style="background: #6366f1; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">View My Dashboard</a></p>
            <br/>
            <p>Thank you,<br/>Your Landlord</p>
          `
        });
      } catch (e) {
        console.error('Email notification failed:', e);
      }
    }

    return { success: true, billId: newBill.id };
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Unknown error occurred.' };
  }
}
