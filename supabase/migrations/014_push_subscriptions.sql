-- Paste this into your Supabase SQL Editor and run it
-- This version supports multiple devices per user (iPhone, Desktop, etc.)

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage only their own subscriptions
DROP POLICY IF EXISTS "Users can upsert their own subscription" ON push_subscriptions;
CREATE POLICY "Users can upsert their own subscription"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
