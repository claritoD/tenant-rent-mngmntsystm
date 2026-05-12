-- Migration for Broadcast Messaging / Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Landlord has full access
CREATE POLICY "Owner: full access to announcements"
  ON announcements FOR ALL
  USING (coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'owner', false))
  WITH CHECK (coalesce((auth.jwt() -> 'user_metadata' ->> 'role') = 'owner', false));

-- Tenants can only read announcements
CREATE POLICY "Tenants: read-only access to announcements"
  ON announcements FOR SELECT
  USING (true);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;
