-- ============================================================
-- Migration to add payment-proofs storage bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- payment-proofs RLS: Owner can ALL, Tenant can INSERT and SELECT their own
CREATE POLICY "Owner ALL on payment-proofs" ON storage.objects FOR ALL USING (bucket_id = 'payment-proofs' AND is_owner()) WITH CHECK (bucket_id = 'payment-proofs' AND is_owner());
CREATE POLICY "Tenant INSERT on payment-proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND (auth.uid()::text = (string_to_array(name, '/'))[1]));
CREATE POLICY "Tenant SELECT on payment-proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND (auth.uid()::text = (string_to_array(name, '/'))[1]));
