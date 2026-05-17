'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function processMoveOut(tenantId: string, data: {
  moveOutDate: string;
  finalElectricReading: number;
  finalWaterReading: number;
  damages: number;
  returnDeposit: boolean;
}) {
  try {
    const supabase: any = await createClient();

    // 1. Fetch tenant and latest readings
    const { data: tenant, error: tErr } = await supabase
      .from('tenants')
      .select('*, unit:units(*)')
      .eq('id', tenantId)
      .single();
    if (tErr || !tenant) throw new Error('Tenant not found.');

    const { data: lastElectric } = await supabase
      .from('meter_readings')
      .select('curr_reading, rate_per_unit')
      .eq('tenant_id', tenantId)
      .eq('type', 'electric')
      .order('reading_date', { ascending: false })
      .limit(1)
      .single();

    const { data: lastWater } = await supabase
      .from('meter_readings')
      .select('curr_reading, rate_per_unit')
      .eq('tenant_id', tenantId)
      .eq('type', 'water')
      .order('reading_date', { ascending: false })
      .limit(1)
      .single();

    // 2. Validation
    if (data.finalElectricReading < 0 || data.finalWaterReading < 0 || data.damages < 0) {
      throw new Error('Reading and damage values cannot be negative.');
    }
    if (data.finalElectricReading < (lastElectric?.curr_reading || 0)) {
      throw new Error(`Final electric reading (${data.finalElectricReading}) cannot be less than last reading (${lastElectric?.curr_reading || 0})`);
    }
    if (tenant.water_mode === 'metered' && data.finalWaterReading < (lastWater?.curr_reading || 0)) {
      throw new Error(`Final water reading (${data.finalWaterReading}) cannot be less than last reading (${lastWater?.curr_reading || 0})`);
    }

    // 3. Calculate Final Utility Costs
    const electricCost = (data.finalElectricReading - (lastElectric?.curr_reading || 0)) * (lastElectric?.rate_per_unit || 15);
    const waterCost = (tenant.water_mode === 'metered') 
      ? (data.finalWaterReading - (lastWater?.curr_reading || 0)) * (lastWater?.rate_per_unit || 40)
      : 0;

    // 4. Pro-rated Rent (Simplified: Days since last anniversary)
    // For this V2, we'll just use a simplified "Remaining Arrears + Utility + Damages - Deposit"
    const totalDue = tenant.arrears + electricCost + waterCost + data.damages;
    const finalSettlement = data.returnDeposit ? totalDue - tenant.security_deposit : totalDue;

    // 4. Record as a Final Bill or Arrears Update
    // To keep it simple and clean, we'll update the tenant's arrears to the final settlement
    // and then archive them.
    const { error: upErr } = await (supabase as any).from('tenants').update({
      arrears: finalSettlement,
      is_active: false,
      unit_id: null,
      security_deposit: 0 // consumed
    }).eq('id', tenantId);

    if (upErr) throw upErr;

    // 5. Record final readings
    await (supabase as any).from('meter_readings').insert([
      { tenant_id: tenantId, type: 'electric', prev_reading: lastElectric?.curr_reading || 0, curr_reading: data.finalElectricReading, rate_per_unit: lastElectric?.rate_per_unit || 15, reading_date: data.moveOutDate },
      { tenant_id: tenantId, type: 'water', prev_reading: lastWater?.curr_reading || 0, curr_reading: data.finalWaterReading, rate_per_unit: lastWater?.rate_per_unit || 40, reading_date: data.moveOutDate },
    ]);

    revalidatePath('/owner/tenants');
    revalidatePath(`/owner/tenants/${tenantId}`);
    return { success: true, finalSettlement };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

