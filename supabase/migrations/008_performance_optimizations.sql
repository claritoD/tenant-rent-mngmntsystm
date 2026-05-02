-- ============================================================
-- Migration 008: Performance Optimizations (Indexing)
-- ============================================================

-- 1. Tenant Lookup Optimization
CREATE INDEX IF NOT EXISTS idx_tenants_unit_id ON tenants(unit_id);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

-- 2. Meter Readings Optimization (Frequent filters by tenant and date)
CREATE INDEX IF NOT EXISTS idx_meter_readings_tenant_date ON meter_readings(tenant_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_meter_readings_type ON meter_readings(type);

-- 3. Bills Optimization (Anniversary billing checks)
CREATE INDEX IF NOT EXISTS idx_bills_tenant_date ON bills(tenant_id, bill_date DESC);
CREATE INDEX IF NOT EXISTS idx_bills_is_paid ON bills(is_paid);

-- 4. Payments Optimization (Verification workflow)
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date_submitted ON payments(date_submitted DESC);

-- 5. Maintenance & Expenses
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant_status ON maintenance_tickets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_category_date ON expenses(category, date DESC);

-- 6. Storage Objects Optimization (Speeds up listing/RLS checks)
-- This is managed by Supabase usually, but we can ensure indexes on our metadata if needed.
-- Note: Supabase's storage.objects already has indexes on bucket_id and name.
