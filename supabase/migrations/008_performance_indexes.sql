-- Optimization: Indexes for faster Lookups
CREATE INDEX IF NOT EXISTS idx_tenants_unit_id ON tenants(unit_id);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

CREATE INDEX IF NOT EXISTS idx_bills_tenant_id ON bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bills_is_paid ON bills(is_paid);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_meter_readings_tenant_id ON meter_readings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_type ON meter_readings(type);

CREATE INDEX IF NOT EXISTS idx_water_refills_tenant_id ON water_refills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_water_refills_status ON water_refills(status);
