-- ============================================================
-- Migration 012: Add owner dashboard analytics preferences
-- ============================================================

CREATE TABLE owner_dashboard_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    show_revenue_chart BOOLEAN DEFAULT true,
    show_payment_stats BOOLEAN DEFAULT true,
    show_tenant_occupancy BOOLEAN DEFAULT true,
    show_outstanding_arrears BOOLEAN DEFAULT true,
    show_utility_consumption BOOLEAN DEFAULT true,
    show_maintenance_tickets BOOLEAN DEFAULT true,
    show_expense_breakdown BOOLEAN DEFAULT true,
    show_water_refill_pending BOOLEAN DEFAULT true,
    show_due_date_pending BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(owner_id)
);

ALTER TABLE owner_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Owner can only see/modify their own settings
CREATE POLICY "Owner: manage own dashboard settings" 
  ON owner_dashboard_settings FOR ALL 
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Create a function to automatically create settings on first access
CREATE OR REPLACE FUNCTION create_owner_dashboard_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO owner_dashboard_settings (owner_id)
  VALUES (NEW.id)
  ON CONFLICT (owner_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger not needed for auth.users, but we can use a stored procedure instead
-- For now, settings will be auto-created on first request in the app
