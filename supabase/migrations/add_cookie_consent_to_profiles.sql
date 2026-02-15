-- Add cookie consent tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cookie_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cookie_consent_choice TEXT;

-- Update RLS policies to ensure users can update their own consent fields
-- (Assuming public.profiles already has standard owner-update policies)
