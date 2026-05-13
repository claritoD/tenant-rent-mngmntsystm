-- Add 'per_head' to water_billing_mode enum
ALTER TYPE water_billing_mode ADD VALUE 'per_head';

-- Add occupants_count and water_per_head_rate to tenants
ALTER TABLE tenants ADD COLUMN occupants_count INTEGER DEFAULT 1;
ALTER TABLE tenants ADD COLUMN water_per_head_rate NUMERIC(10, 2) DEFAULT 0;

-- Comment on columns for clarity
COMMENT ON COLUMN tenants.occupants_count IS 'Number of people in the unit for per-head water billing';
COMMENT ON COLUMN tenants.water_per_head_rate IS 'Rate per person if water_mode is per_head';
