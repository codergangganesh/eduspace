-- Add profile enhancement fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Add profile enhancement fields to public_profiles table
ALTER TABLE public.public_profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Update RLS policies for public_profiles if necessary (already exists likely)
-- If public_profiles doesn't have cover_url in its sync logic, it needs to be updated too.
