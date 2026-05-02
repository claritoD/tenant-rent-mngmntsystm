// Auto-generated types matching latest schema
// Updated manually to reflect wifi_rate move to Tenant and starting meter columns

export type WaterBillingMode = 'metered' | 'tank';
export type UtilityType = 'electric' | 'water';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';
export type WaterRefillStatus = 'pending' | 'completed' | 'cancelled';

export interface Unit {
  id: string;
  unit_name: string;
  base_rent: number;
  interior_photos: string[];
  map_location_url: string | null;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  unit_id: string | null;
  move_in_date: string;
  anniversary_day: number;
  has_wifi: boolean;
  wifi_rate: number;
  security_deposit: number;
  credit_balance: number;
  arrears: number;
  water_mode: WaterBillingMode;
  water_tank_rate: number;
  start_electric_reading: number;
  start_water_reading: number;
  is_active: boolean;
  created_at: string;
  // joined
  unit?: Unit;
}

export interface MeterReading {
  id: string;
  tenant_id: string;
  type: UtilityType;
  prev_reading: number;
  curr_reading: number;
  rate_per_unit: number;
  reading_date: string;
  created_at: string;
}

export interface Bill {
  id: string;
  tenant_id: string;
  bill_date: string;
  period_label: string;
  rent_amount: number;
  electric_amount: number;
  water_amount: number;
  wifi_amount: number;
  arrears_carried: number;
  credit_applied: number;
  total_due: number;
  is_paid: boolean;
  created_at: string;
  // joined
  tenant?: Tenant;
}

export interface Payment {
  id: string;
  tenant_id: string;
  bill_id: string | null;
  amount: number;
  payment_method: 'gcash' | 'cash';
  gcash_ref: string | null;
  proof_url: string | null;
  status: PaymentStatus;
  note: string | null;
  date_submitted: string;
  verified_at: string | null;
  created_at: string;
  // joined
  bill?: Bill;
}

export interface WaterRefill {
  id: string;
  tenant_id: string;
  status: WaterRefillStatus;
  amount: number | null;
  billed: boolean;
  requested_at: string;
  completed_at: string | null;
  // joined
  tenant?: Tenant;
}
