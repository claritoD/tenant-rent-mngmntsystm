/**
 * Hybrid Billing Utilities
 *
 * Rules:
 * - Rent / WiFi / Arrears  → billed on tenant's anniversary day each month
 * - Electric / Water       → billed using the most recent 18th reading
 * - A bill generated on the 8th includes rent for the UPCOMING month
 *   plus utilities from the most recent 18th reading.
 */

import type { MeterReading, Tenant, Unit, WaterRefill } from '@/types/database.types';

/**
 * Returns the next anniversary billing date for a tenant
 * relative to a given reference date (defaults to today).
 */
export function nextAnniversaryDate(
  moveInDate: string,
  referenceDate: Date = new Date()
): Date {
  const moveIn = new Date(moveInDate);
  const day = moveIn.getDate();

  const candidate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    day
  );

  // If this month's anniversary already passed, go to next month
  if (candidate <= referenceDate) {
    candidate.setMonth(candidate.getMonth() + 1);
  }

  return candidate;
}

/**
 * Returns the most recent 18th-of-month reading date at or before today.
 */
export function latestReadingDate(referenceDate: Date = new Date()): Date {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const candidate = new Date(y, m, 18);

  if (candidate > referenceDate) {
    // Use previous month's 18th
    candidate.setMonth(candidate.getMonth() - 1);
  }

  return candidate;
}

/**
 * Calculates the utility amount for a single meter reading.
 * consumption = curr - prev, billed at rate_per_unit.
 */
export function calcUtilityAmount(reading: MeterReading): number {
  const consumption = Math.max(0, reading.curr_reading - reading.prev_reading);
  return parseFloat((consumption * reading.rate_per_unit).toFixed(2));
}

export interface BillBreakdown {
  rent: number;
  electric: number;
  water: number;
  wifi: number;
  arrearsCarried: number;
  creditApplied: number;
  totalDue: number;
}

/**
 * Computes the full bill breakdown for a tenant.
 *
 * @param tenant       - tenant record (with unit joined)
 * @param unit         - the tenant's unit
 * @param electricReading - most recent electric meter reading (around 18th)
 * @param waterReading    - most recent water meter reading (around 18th), null if tank
 * @param waterRefills    - unbilled, completed water refill requests (if mode is tank)
 */
export function computeBill(
  tenant: Tenant,
  unit: Unit,
  electricReading: MeterReading | null,
  waterReading: MeterReading | null,
  waterRefills: WaterRefill[] = []
): BillBreakdown {
  const rent = unit.base_rent;
  const wifi = tenant.has_wifi ? unit.wifi_rate : 0;
  const electric = electricReading ? calcUtilityAmount(electricReading) : 0;

  let water = 0;
  if (tenant.water_mode === 'metered' && waterReading) {
    water = calcUtilityAmount(waterReading);
  } else if (tenant.water_mode === 'tank') {
    water = waterRefills.reduce((sum, r) => sum + (r.amount || 0), 0);
  }

  const arrearsCarried = tenant.arrears;
  const subtotal = rent + wifi + electric + water + arrearsCarried;
  const creditApplied = Math.min(tenant.credit_balance, subtotal);
  const totalDue = parseFloat((subtotal - creditApplied).toFixed(2));

  return {
    rent,
    electric,
    water,
    wifi,
    arrearsCarried,
    creditApplied,
    totalDue,
  };
}

/**
 * Returns a human-readable period label, e.g. "May 2026".
 */
export function periodLabel(date: Date): string {
  return date.toLocaleString('en-PH', { month: 'long', year: 'numeric' });
}
