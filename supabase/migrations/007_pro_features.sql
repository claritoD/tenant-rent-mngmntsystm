-- ============================================================
-- Migration 007: Pro Features (Maintenance & Expenses) - STRICT VERSION
-- ============================================================

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('pending', 'open', 'resolved', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM ('Repair', 'Tax', 'Utility', 'Supplies', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tables
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status      ticket_status DEFAULT 'pending',
    photo_url   TEXT, -- Storing the STORAGE PATH, not the public URL
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS expenses (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount      NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    description TEXT NOT NULL,
    category    expense_category NOT NULL,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2.1 Data Cleanup (Fix existing negative values so constraints can be added)
-- We update both to 0 to ensure the reading_order (curr >= prev) constraint is maintained
UPDATE meter_readings 
SET prev_reading = 0, curr_reading = 0 
WHERE prev_reading < 0 OR curr_reading < 0;

UPDATE meter_readings 
SET rate_per_unit = 0 
WHERE rate_per_unit < 0;


-- 2.2 Strict Validation for Meter Readings
ALTER TABLE meter_readings DROP CONSTRAINT IF EXISTS prev_non_negative;
ALTER TABLE meter_readings ADD CONSTRAINT prev_non_negative CHECK (prev_reading >= 0);

ALTER TABLE meter_readings DROP CONSTRAINT IF EXISTS curr_non_negative;
ALTER TABLE meter_readings ADD CONSTRAINT curr_non_negative CHECK (curr_reading >= 0);

ALTER TABLE meter_readings DROP CONSTRAINT IF EXISTS rate_non_negative;
ALTER TABLE meter_readings ADD CONSTRAINT rate_non_negative CHECK (rate_per_unit >= 0);



-- 3. Row Level Security
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Maintenance Policies
DROP POLICY IF EXISTS "Owner: full access to tickets" ON maintenance_tickets;
CREATE POLICY "Owner: full access to tickets" ON maintenance_tickets 
FOR ALL USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Tenant: view own tickets" ON maintenance_tickets;
CREATE POLICY "Tenant: view own tickets" ON maintenance_tickets 
FOR SELECT USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Tenant: insert own tickets" ON maintenance_tickets;
CREATE POLICY "Tenant: insert own tickets" ON maintenance_tickets 
FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- Expenses Policies
DROP POLICY IF EXISTS "Owner: full access to expenses" ON expenses;
CREATE POLICY "Owner: full access to expenses" ON expenses 
FOR ALL USING (public.is_owner()) WITH CHECK (public.is_owner());

-- 4. Storage Bucket (Setting to PUBLIC for easy viewing, while keeping records strictly controlled)
-- Note: In a production "Strict" environment, we'd use private and signed URLs, 
-- but for the current architecture to function properly with getPublicUrl, we use public: true.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maintenance-photos', 'maintenance-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for maintenance-photos
-- Even if public: true, we restrict who can UPLOAD and DELETE.
-- Reading (SELECT) is public if the bucket is public, but we add policies for clarity.

DROP POLICY IF EXISTS "Owner ALL on maintenance-photos" ON storage.objects;
CREATE POLICY "Owner ALL on maintenance-photos" 
ON storage.objects FOR ALL 
USING (bucket_id = 'maintenance-photos' AND public.is_owner()) 
WITH CHECK (bucket_id = 'maintenance-photos' AND public.is_owner());

DROP POLICY IF EXISTS "Tenant INSERT on maintenance-photos" ON storage.objects;
CREATE POLICY "Tenant INSERT on maintenance-photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'maintenance-photos' AND (auth.uid()::text = (string_to_array(name, '/'))[1]));

-- Also ensure payment-proofs is public so the owner can actually see them
UPDATE storage.buckets SET public = true WHERE id = 'payment-proofs';
