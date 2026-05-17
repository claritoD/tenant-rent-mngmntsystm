-- ============================================================
-- Migration 020: Add expires_at to announcements and cleanup RPC
-- ============================================================

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create an RPC function to clean up expired announcements
-- We use SECURITY DEFINER so it can run with elevated privileges if called by an authenticated user
CREATE OR REPLACE FUNCTION cleanup_expired_announcements()
RETURNS void AS $$
BEGIN
  -- Delete all announcements where the expires_at timestamp has passed
  DELETE FROM announcements WHERE expires_at < timezone('utc', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
