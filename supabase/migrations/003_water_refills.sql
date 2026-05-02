-- ============================================================
-- Migration to add water_refills tracking
-- ============================================================

CREATE TYPE water_refill_status AS ENUM ('pending', 'completed', 'cancelled');

CREATE TABLE water_refills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    status water_refill_status DEFAULT 'pending',
    amount NUMERIC(10, 2), -- filled when completed
    billed BOOLEAN DEFAULT false,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE water_refills ENABLE ROW LEVEL SECURITY;

-- Owner has full access
CREATE POLICY "Owner: full access to water_refills" 
  ON water_refills FOR ALL 
  USING (is_owner()) WITH CHECK (is_owner());

-- Tenant can view their own
CREATE POLICY "Tenant: view own water_refills" 
  ON water_refills FOR SELECT 
  USING (tenant_id = auth.uid());

-- Tenant can request a refill (insert)
CREATE POLICY "Tenant: insert own water_refills" 
  ON water_refills FOR INSERT 
  WITH CHECK (tenant_id = auth.uid() AND status = 'pending');
