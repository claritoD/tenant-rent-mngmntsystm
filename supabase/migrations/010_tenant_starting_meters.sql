-- ============================================================
-- Migration 010: Add starting meter readings for tenants
-- ============================================================

ALTER TABLE tenants ADD COLUMN start_electric_reading NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE tenants ADD COLUMN start_water_reading NUMERIC(10, 2) DEFAULT 0;

-- Optional: Update existing tenants to have a default starting reading 
-- based on their first recorded reading if available, but for now 0 is fine.
