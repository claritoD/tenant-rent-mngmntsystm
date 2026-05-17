-- Add last_read_announcements_at to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_read_announcements_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', '2020-01-01'::timestamp);
