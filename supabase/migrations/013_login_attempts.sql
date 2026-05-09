-- Paste this into your Supabase SQL Editor and run it

CREATE TABLE IF NOT EXISTS login_attempts (
    email TEXT PRIMARY KEY,
    attempts INT DEFAULT 1,
    last_attempt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
-- No policies needed because this table will only be read/written by the server using the service_role key.
