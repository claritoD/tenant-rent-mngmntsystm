-- ============================================================
-- Migration 009: Refactor Tenant Billing (WiFi & Water Tank)
-- ============================================================

-- 1. Add wifi_rate to tenants table
ALTER TABLE tenants ADD COLUMN wifi_rate NUMERIC(10, 2) DEFAULT 0;

-- 2. Rename water_tank_rate to water_refill_price for clarity
-- Actually, the user asked "why is it when creating new tenant when water is in tank rating, there is tank rate per month?"
-- This implies they want it to be a per-refill price.
-- I'll keep the column name as is but we will change the UI label and billing logic.

-- 3. Migration: Copy unit.wifi_rate to tenants for existing active tenants
UPDATE tenants t
SET wifi_rate = u.wifi_rate
FROM units u
WHERE t.unit_id = u.id AND t.has_wifi = true;

-- 4. (Optional) Remove wifi_rate from units table if you want to be strict
-- But we can just ignore it in the UI to avoid breaking existing code.
