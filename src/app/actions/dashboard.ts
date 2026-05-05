'use server';

import { createClient } from '@/lib/supabase/server';
import type { OwnerDashboardSettings } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export async function getOrCreateDashboardSettings() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated.' };

    // Try to get existing settings
    let { data: settings, error: getErr } = await supabase
      .from('owner_dashboard_settings')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    // If not found, create default settings
    if (getErr || !settings) {
      const defaultSettings = {
        owner_id: user.id,
        show_revenue_chart: true,
        show_payment_stats: true,
        show_tenant_occupancy: true,
        show_outstanding_arrears: true,
        show_utility_consumption: true,
        show_maintenance_tickets: true,
        show_expense_breakdown: true,
        show_water_refill_pending: true,
        show_due_date_pending: true,
      };

      const { data: created, error: createErr } = await supabase
        .from('owner_dashboard_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (createErr) throw createErr;
      settings = created;
    }

    return { data: settings as OwnerDashboardSettings };
  } catch (err: unknown) {
    console.error('Error getting dashboard settings:', err);
    return { error: 'Failed to get settings.' };
  }
}

export async function updateDashboardSettings(updates: Partial<OwnerDashboardSettings>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: 'Not authenticated.' };

    const { data: settings, error: updateErr } = await supabase
      .from('owner_dashboard_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('owner_id', user.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    revalidatePath('/owner');
    return { data: settings as OwnerDashboardSettings };
  } catch (err: unknown) {
    console.error('Error updating dashboard settings:', err);
    return { error: 'Failed to update settings.' };
  }
}

export async function getDashboardAnalytics() {
  try {
    const supabase = await createClient();

    // Get all analytics data in parallel
    const [
      { data: unitsData },
      { data: tenantsData },
      { data: billsData },
      { data: paymentsData },
      { data: waterRefillsData },
      { data: dueDateRequestsData },
      { data: maintenanceData },
      { data: expensesData },
    ] = await Promise.all([
      supabase.from('units').select('id'),
      supabase.from('tenants').select('id, is_active, unit_id, arrears, credit_balance'),
      supabase.from('bills').select('id, total_due, is_paid, rent_amount, electric_amount, water_amount, created_at'),
      supabase.from('payments').select('amount, status, verified_at, date_submitted'),
      supabase.from('water_refills').select('status, requested_at'),
      supabase.from('due_date_change_requests').select('status, requested_at'),
      supabase.from('maintenance').select('id, status') as any, // May not exist yet
      supabase.from('expenses').select('id, amount, created_at') as any, // May not exist yet
    ]);

    const units = unitsData || [];
    const tenants = tenantsData || [];
    const bills = billsData || [];
    const payments = paymentsData || [];
    const waterRefills = waterRefillsData || [];
    const dueDateRequests = dueDateRequestsData || [];

    // Calculate unit occupancy
    const totalUnits = units.length;
    const activeUnits = units.filter(u => {
      const tenantInUnit = tenants.find(t => t.unit_id === u.id && t.is_active);
      return !!tenantInUnit;
    }).length;
    const occupancyRate = totalUnits > 0 ? (activeUnits / totalUnits) * 100 : 0;

    const totalArrears = tenants.reduce((sum, t) => sum + (t.arrears || 0), 0);
    const totalCredit = tenants.reduce((sum, t) => sum + (t.credit_balance || 0), 0);

    const totalRevenue = bills.reduce((sum, b) => sum + b.total_due, 0);
    const paidRevenue = bills.filter(b => b.is_paid).reduce((sum, b) => sum + b.total_due, 0);
    const collectionRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0;

    const onTimePayments = payments.filter(p => p.status === 'verified').length;
    const totalPayments = payments.length;
    const verificationRate = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;

    const pendingWaterRefills = waterRefills.filter(w => w.status === 'pending').length;
    const pendingDueDateRequests = dueDateRequests.filter(d => d.status === 'pending').length;

    // Monthly revenue breakdown
    const currentMonth = new Date();
    const monthlyBills = bills.filter(b => {
      const billDate = new Date(b.created_at);
      return billDate.getMonth() === currentMonth.getMonth() && billDate.getFullYear() === currentMonth.getFullYear();
    });
    const monthlyRevenue = monthlyBills.reduce((sum, b) => sum + b.total_due, 0);
    const monthlyUtilities = monthlyBills.reduce((sum, b) => sum + (b.electric_amount + b.water_amount), 0);

    return {
      occupancy: {
        total: totalUnits,
        active: activeUnits,
        rate: Math.round(occupancyRate),
      },
      revenue: {
        total: totalRevenue,
        paid: paidRevenue,
        unpaid: totalRevenue - paidRevenue,
        collectionRate: Math.round(collectionRate),
        monthlyRevenue,
        monthlyUtilities,
      },
      arrears: {
        total: totalArrears,
        count: tenants.filter(t => t.arrears > 0).length,
      },
      credit: {
        total: totalCredit,
        count: tenants.filter(t => t.credit_balance > 0).length,
      },
      payments: {
        total: totalPayments,
        verified: onTimePayments,
        pending: totalPayments - onTimePayments,
        verificationRate: Math.round(verificationRate),
      },
      pending: {
        waterRefills: pendingWaterRefills,
        dueDateRequests: pendingDueDateRequests,
      },
    };
  } catch (err: unknown) {
    console.error('Error fetching dashboard analytics:', err);
    return null;
  }
}
