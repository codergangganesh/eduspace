-- Create a specific table for public-facing profile data
CREATE TABLE IF NOT EXISTS public.public_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT,
    program TEXT,
    year TEXT,
    department TEXT,
    gpa TEXT,
    credits_completed INTEGER,
    credits_required INTEGER,
    expected_graduation DATE,
    verified BOOLEAN DEFAULT false,
    email TEXT,
    phone TEXT,
    city TEXT,
    country TEXT,
    last_updated TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_public_profile_user UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Anyone can view public profiles
CREATE POLICY "Anyone can view public profiles" 
ON public.public_profiles 
FOR SELECT 
USING (true);

-- 2. Only the owner can update their public profile
CREATE POLICY "Users can update their own public profile" 
ON public.public_profiles 
FOR ALL 
USING (auth.uid() = user_id);

-- Create a function to automatically sync profiles to public_profiles (Optional but good for data integrity)
-- For now, we'll do it from the frontend as requested to ensure "saving details in supabase" happens explicitly.
