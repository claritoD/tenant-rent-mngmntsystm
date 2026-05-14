// Auto-generated types matching latest schema
// Updated manually to reflect wifi_rate move to Tenant and starting meter columns

export type WaterBillingMode = 'metered' | 'tank' | 'per_head';
export type UtilityType = 'electric' | 'water';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';
export type WaterRefillStatus = 'pending' | 'completed' | 'cancelled';
export type DueDateChangeStatus = 'pending' | 'approved' | 'rejected';

export interface Property {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface Unit {
  id: string;
  unit_name: string;
  base_rent: number;
  interior_photos: string[];
  map_location_url: string | null;
  property_id: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  sender_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  property_id: string | null;
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
  occupants_count: number;
  water_per_head_rate: number;
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

export interface DueDateChangeRequest {
  id: string;
  tenant_id: string;
  current_anniversary_day: number;
  requested_anniversary_day: number;
  reason: string | null;
  status: DueDateChangeStatus;
  owner_note: string | null;
  requested_at: string;
  reviewed_at: string | null;
  created_at: string;
  // joined
  tenant?: Tenant;
}

export interface OwnerDashboardSettings {
  id: string;
  owner_id: string;
  show_revenue_chart: boolean;
  show_payment_stats: boolean;
  show_tenant_occupancy: boolean;
  show_outstanding_arrears: boolean;
  show_utility_consumption: boolean;
  show_maintenance_tickets: boolean;
  show_expense_breakdown: boolean;
  show_water_refill_pending: boolean;
  show_due_date_pending: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTicket {
  id: string;
  tenant_id: string;
  description: string;
  status: 'pending' | 'open' | 'resolved' | 'cancelled';
  photo_url: string | null;
  created_at: string;
  // joined
  tenant?: Tenant;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: 'Repair' | 'Tax' | 'Utility' | 'Supplies' | 'Other';
  date: string;
  created_at: string;
}

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      units: {
        Row: Unit;
        Insert: Partial<Unit>;
        Update: Partial<Unit>;
      };
      tenants: {
        Row: Omit<Tenant, 'unit'>;
        Insert: Partial<Omit<Tenant, 'unit'>>;
        Update: Partial<Omit<Tenant, 'unit'>>;
      };
      meter_readings: {
        Row: MeterReading;
        Insert: Partial<MeterReading>;
        Update: Partial<MeterReading>;
      };
      due_date_change_requests: {
        Row: Omit<DueDateChangeRequest, 'tenant'>;
        Insert: Partial<Omit<DueDateChangeRequest, 'tenant'>>;
        Update: Partial<Omit<DueDateChangeRequest, 'tenant'>>;
      };
      bills: {
        Row: Omit<Bill, 'tenant'>;
        Insert: Partial<Omit<Bill, 'tenant'>>;
        Update: Partial<Omit<Bill, 'tenant'>>;
      };
      payments: {
        Row: Omit<Payment, 'bill'>;
        Insert: Partial<Omit<Payment, 'bill'>>;
        Update: Partial<Omit<Payment, 'bill'>>;
      };
      water_refills: {
        Row: Omit<WaterRefill, 'tenant'>;
        Insert: Partial<Omit<WaterRefill, 'tenant'>>;
        Update: Partial<Omit<WaterRefill, 'tenant'>>;
      };
      owner_dashboard_settings: {
        Row: OwnerDashboardSettings;
        Insert: Partial<OwnerDashboardSettings>;
        Update: Partial<OwnerDashboardSettings>;
      };
      properties: {
        Row: Property;
        Insert: Partial<Property>;
        Update: Partial<Property>;
      };
      announcements: {
        Row: Announcement;
        Insert: Partial<Announcement>;
        Update: Partial<Announcement>;
      };
      maintenance_tickets: {
        Row: Omit<MaintenanceTicket, 'tenant'>;
        Insert: Partial<Omit<MaintenanceTicket, 'tenant'>>;
        Update: Partial<Omit<MaintenanceTicket, 'tenant'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Partial<Expense>;
        Update: Partial<Expense>;
      };
    };
    Views: { [key: string]: { Row: never; Insert: never; Update: never } };
    Functions: { [key: string]: { Args: never[]; Returns: unknown } };
    Enums: { [key: string]: string };
    CompositeTypes: { [key: string]: unknown };
  };
};
