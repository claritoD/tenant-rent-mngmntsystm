-- ============================================================
-- Tenant Management App - Initial Schema Migration
-- Paste this into the Supabase SQL Editor and run it.
-- ============================================================

-- ---- 1. ENUMS ----
CREATE TYPE water_billing_mode AS ENUM ('metered', 'tank');
CREATE TYPE utility_type AS ENUM ('electric', 'water');
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');

-- ---- 2. TABLES ----

-- Units (rooms/apartments managed by the landlord)
CREATE TABLE units (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_name   TEXT NOT NULL,
    base_rent   NUMERIC(10, 2) NOT NULL,
    wifi_rate   NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Tenants (maps 1:1 to Supabase Auth users)
CREATE TABLE tenants (
    id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    unit_id          UUID REFERENCES units(id) ON DELETE SET NULL,
    move_in_date     DATE NOT NULL,
    anniversary_day  SMALLINT GENERATED ALWAYS AS (EXTRACT(DAY FROM move_in_date)::SMALLINT) STORED,
    has_wifi         BOOLEAN DEFAULT false,
    security_deposit NUMERIC(10, 2) DEFAULT 0,
    credit_balance   NUMERIC(10, 2) DEFAULT 0,   -- overpayments / advance payments
    arrears          NUMERIC(10, 2) DEFAULT 0,   -- accumulated underpayments
    water_mode       water_billing_mode DEFAULT 'tank',
    water_tank_rate  NUMERIC(10, 2) DEFAULT 0,   -- fixed fee if mode = 'tank'
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Utility Meter Readings (entered by owner on/around the 18th of each month)
CREATE TABLE meter_readings (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type          utility_type NOT NULL,
    prev_reading  NUMERIC(10, 2) NOT NULL,
    curr_reading  NUMERIC(10, 2) NOT NULL,
    rate_per_unit NUMERIC(10, 2) NOT NULL,   -- PHP per kWh or per cubic meter
    reading_date  DATE NOT NULL,             -- always around the 18th
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    CONSTRAINT reading_order CHECK (curr_reading >= prev_reading)
);

-- Bills (immutable snapshot of each tenant's monthly bill)
CREATE TABLE bills (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
    bill_date         DATE NOT NULL,          -- anniversary date this bill covers
    period_label      TEXT NOT NULL,          -- e.g. "May 2025"
    rent_amount       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    electric_amount   NUMERIC(10, 2) NOT NULL DEFAULT 0,
    water_amount      NUMERIC(10, 2) NOT NULL DEFAULT 0,
    wifi_amount       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    arrears_carried   NUMERIC(10, 2) NOT NULL DEFAULT 0,
    credit_applied    NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_due         NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_paid           BOOLEAN DEFAULT false,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Payments (GCash submissions by tenant, verified manually by owner)
CREATE TABLE payments (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
    bill_id        UUID REFERENCES bills(id) ON DELETE SET NULL,
    amount         NUMERIC(10, 2) NOT NULL,
    gcash_ref      TEXT NOT NULL,
    proof_url      TEXT,                      -- Supabase Storage URL for screenshot
    status         payment_status DEFAULT 'pending',
    note           TEXT,                      -- Owner note on verification
    date_submitted TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    verified_at    TIMESTAMP WITH TIME ZONE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ---- 3. ROW LEVEL SECURITY ----

ALTER TABLE units          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;

-- Helper: returns true if the calling user has role='owner' in their JWT metadata
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner',
    false
  );
END;
$$;

-- Units
CREATE POLICY "Owner: full access to units"          ON units FOR ALL        USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "Tenant: view own unit"                ON units FOR SELECT     USING (id IN (SELECT unit_id FROM tenants WHERE id = auth.uid()));

-- Tenants
CREATE POLICY "Owner: full access to tenants"        ON tenants FOR ALL      USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "Tenant: view own record"              ON tenants FOR SELECT   USING (id = auth.uid());

-- Meter Readings
CREATE POLICY "Owner: full access to readings"       ON meter_readings FOR ALL     USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "Tenant: view own readings"            ON meter_readings FOR SELECT  USING (tenant_id = auth.uid());

-- Bills
CREATE POLICY "Owner: full access to bills"          ON bills FOR ALL        USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "Tenant: view own bills"               ON bills FOR SELECT     USING (tenant_id = auth.uid());

-- Payments
CREATE POLICY "Owner: full access to payments"       ON payments FOR ALL     USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "Tenant: view own payments"            ON payments FOR SELECT  USING (tenant_id = auth.uid());
CREATE POLICY "Tenant: submit payment"               ON payments FOR INSERT  WITH CHECK (tenant_id = auth.uid() AND status = 'pending');

-- ---- 4. STORAGE BUCKETS ----
-- Run these separately if not using migrations for storage:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lease-docs', 'lease-docs', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('move-in-photos', 'move-in-photos', false);
-- 
-- Storage RLS (add in Supabase Dashboard -> Storage -> Policies):
-- lease-docs:      Owner ALL;  Tenant SELECT on path starting with their own UUID
-- payment-proofs:  Owner ALL;  Tenant INSERT/SELECT on path starting with their own UUID
-- move-in-photos:  Owner ALL;  Tenant SELECT on path starting with their own UUID
