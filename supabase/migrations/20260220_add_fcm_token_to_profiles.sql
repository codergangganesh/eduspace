-- Migration to add fcm_token to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token ON public.profiles(fcm_token);

-- Update RLS if needed, but profiles usually allows users to update their own record
-- The existing policies for profiles should already allow users to update their own fcm_token.
