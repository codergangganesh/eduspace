-- Add sidebar_mode to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sidebar_mode TEXT DEFAULT 'expanded' 
CHECK (sidebar_mode IN ('expanded', 'collapsed', 'hover'));
