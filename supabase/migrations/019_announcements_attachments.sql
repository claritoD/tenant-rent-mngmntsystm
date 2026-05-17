-- Add image_url and attachment_url to announcements
ALTER TABLE announcements ADD COLUMN image_url text;
ALTER TABLE announcements ADD COLUMN attachment_url text;

-- Create an announcements bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for announcements bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'announcements');

CREATE POLICY "Owner Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'announcements' 
  AND coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'owner', false)
);

CREATE POLICY "Owner Update" 
ON storage.objects FOR UPDATE 
WITH CHECK (
  bucket_id = 'announcements' 
  AND coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'owner', false)
);

CREATE POLICY "Owner Delete" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'announcements' 
  AND coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'owner', false)
);
