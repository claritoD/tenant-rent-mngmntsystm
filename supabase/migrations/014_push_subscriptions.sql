-- Paste this into your Supabase SQL Editor and run it

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Server actions use the service_role key so no RLS policies are needed.
