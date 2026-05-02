-- ============================================================
-- Migration to add photos to units and create storage bucket
-- ============================================================

-- 1. Add fields to units table
ALTER TABLE units 
  ADD COLUMN interior_photos TEXT[] DEFAULT '{}',
  ADD COLUMN map_location_url TEXT;

-- 2. Create Storage Bucket for Units
INSERT INTO storage.buckets (id, name, public) 
VALUES ('units', 'units', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS Policies for units bucket
-- Allow public to read
CREATE POLICY "Public SELECT on units bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'units');

-- Allow owner to insert, update, delete
CREATE POLICY "Owner INSERT on units bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'units' AND is_owner());

CREATE POLICY "Owner UPDATE on units bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'units' AND is_owner());

CREATE POLICY "Owner DELETE on units bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'units' AND is_owner());
