-- ============================================================
-- Migration to add settings and vault storage
-- ============================================================

-- 1. Create Settings Bucket (Public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('settings', 'settings', true)
ON CONFLICT (id) DO NOTHING;

-- Settings RLS: Public can read, Owner can write
CREATE POLICY "Public SELECT on settings bucket" ON storage.objects FOR SELECT USING (bucket_id = 'settings');
CREATE POLICY "Owner INSERT on settings bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'settings' AND is_owner());
CREATE POLICY "Owner UPDATE on settings bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'settings' AND is_owner());
CREATE POLICY "Owner DELETE on settings bucket" ON storage.objects FOR DELETE USING (bucket_id = 'settings' AND is_owner());

-- 2. Create Vault Bucket (Private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vault', 'vault', false)
ON CONFLICT (id) DO NOTHING;

-- Vault RLS: Tenant can read their own (path must start with their UUID), Owner can read/write everything
-- Note: In Supabase storage RLS, `name` is the full path. We check if it starts with the user's ID.
CREATE POLICY "Owner ALL on vault bucket" ON storage.objects FOR ALL USING (bucket_id = 'vault' AND is_owner()) WITH CHECK (bucket_id = 'vault' AND is_owner());
CREATE POLICY "Tenant SELECT on vault bucket" ON storage.objects FOR SELECT USING (bucket_id = 'vault' AND (auth.uid()::text = (string_to_array(name, '/'))[1]));
