-- ============================================================
-- Migration 011: Add due date change request tracking
-- ============================================================

CREATE TYPE due_date_change_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE due_date_change_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    current_anniversary_day SMALLINT NOT NULL,
    requested_anniversary_day SMALLINT NOT NULL,
    reason TEXT,
    status due_date_change_status DEFAULT 'pending',
    owner_note TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE due_date_change_requests ENABLE ROW LEVEL SECURITY;

-- Owner has full access
CREATE POLICY "Owner: full access to due_date_change_requests" 
  ON due_date_change_requests FOR ALL 
  USING (is_owner()) WITH CHECK (is_owner());

-- Tenant can view their own
CREATE POLICY "Tenant: view own due_date_change_requests" 
  ON due_date_change_requests FOR SELECT 
  USING (tenant_id = auth.uid());

-- Tenant can request a change (insert)
CREATE POLICY "Tenant: insert own due_date_change_requests" 
  ON due_date_change_requests FOR INSERT 
  WITH CHECK (tenant_id = auth.uid() AND status = 'pending');
