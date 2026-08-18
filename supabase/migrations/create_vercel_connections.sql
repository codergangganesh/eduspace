-- Migration: Create vercel_connections table for Vercel OAuth 2.0 Integration
-- Description: Stores secure Vercel OAuth credentials, profile metadata, and cached project summaries.

CREATE TABLE IF NOT EXISTS public.vercel_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Vercel Profile Details
    vercel_user_id TEXT,
    vercel_username TEXT,
    vercel_name TEXT,
    vercel_email TEXT,
    vercel_avatar_url TEXT,

    -- OAuth Security Tokens (Kept server-side / Edge function only)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- CSRF State Validation
    oauth_state TEXT,
    oauth_state_created_at TIMESTAMPTZ,

    -- Cached public metadata (Safe project counts, frameworks, deployment summaries)
    cached_data JSONB,

    -- Timestamps
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,

    CONSTRAINT unique_user_vercel_connection UNIQUE (user_id)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_vercel_connections_user_id ON public.vercel_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_vercel_connections_oauth_state ON public.vercel_connections(oauth_state);

-- Enable Row Level Security
ALTER TABLE public.vercel_connections ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own connection metadata
CREATE POLICY "Users can view own vercel connection"
    ON public.vercel_connections
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Users can insert their own vercel connection
CREATE POLICY "Users can insert own vercel connection"
    ON public.vercel_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own vercel connection
CREATE POLICY "Users can update own vercel connection"
    ON public.vercel_connections
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Users can delete their own vercel connection
CREATE POLICY "Users can delete own vercel connection"
    ON public.vercel_connections
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Safe Public View for public profiles (omits access_token and refresh_token entirely)
CREATE OR REPLACE VIEW public.public_vercel_profiles AS
SELECT 
    user_id,
    vercel_user_id,
    vercel_username,
    vercel_name,
    vercel_avatar_url,
    connected_at,
    last_synced_at,
    cached_data
FROM public.vercel_connections
WHERE vercel_user_id IS NOT NULL;
