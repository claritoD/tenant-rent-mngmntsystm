-- Migration to support Building -> Unit hierarchy
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Landlord full access
CREATE POLICY "Owner: full access to properties" 
  ON properties FOR ALL 
  USING (coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'owner', false)) 
  WITH CHECK (coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'owner', false));

-- Tenants can view the property of their unit
CREATE POLICY "Tenants: view their property"
  ON properties FOR SELECT
  USING (id IN (SELECT property_id FROM units WHERE id IN (SELECT unit_id FROM tenants WHERE id = auth.uid())));

-- Link units to properties
ALTER TABLE units ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;

-- Insert a default "Main Building" to catch existing units
DO $$
DECLARE
    prop_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM properties LIMIT 1) THEN
        INSERT INTO properties (name, address) VALUES ('Main Building', 'Default Address') RETURNING id INTO prop_id;
        UPDATE units SET property_id = prop_id WHERE property_id IS NULL;
    END IF;
END $$;
