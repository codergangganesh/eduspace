-- ============================================================================
-- Migration: User Active Devices & Multi-Session Tracking
-- Enables real-time device recognition and remote session termination.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_active_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'desktop', -- 'desktop', 'mobile', 'tablet'
    browser TEXT NOT NULL,
    os TEXT NOT NULL,
    ip_address TEXT,
    location TEXT,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_device_unique UNIQUE (user_id, device_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_active_devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own devices" ON public.user_active_devices;
DROP POLICY IF EXISTS "Users can manage their own devices" ON public.user_active_devices;

-- Allow authenticated users to view only their own device sessions
CREATE POLICY "Users can view their own devices"
ON public.user_active_devices FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to insert, update, or delete their own device sessions
CREATE POLICY "Users can manage their own devices"
ON public.user_active_devices FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for high-performance session lookup
CREATE INDEX IF NOT EXISTS idx_user_active_devices_user_id ON public.user_active_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_active_devices_last_active ON public.user_active_devices(last_active_at DESC);
