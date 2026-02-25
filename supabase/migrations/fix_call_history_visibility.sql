-- Fix for Call History not showing data due to RLS and Join issues
-- 1. Ensure columns are NOT NULL and populated
UPDATE public.call_sessions SET is_hidden_by_caller = false WHERE is_hidden_by_caller IS NULL;
UPDATE public.call_sessions SET is_hidden_by_receiver = false WHERE is_hidden_by_receiver IS NULL;

ALTER TABLE public.call_sessions 
ALTER COLUMN is_hidden_by_caller SET NOT NULL,
ALTER COLUMN is_hidden_by_caller SET DEFAULT false,
ALTER COLUMN is_hidden_by_receiver SET NOT NULL,
ALTER COLUMN is_hidden_by_receiver SET DEFAULT false;

-- 2. Add Explicit Foreign Keys to Profiles to enable Supabase Joins
-- First, drop if they exist (unlikely but safe)
ALTER TABLE public.call_sessions DROP CONSTRAINT IF EXISTS call_sessions_caller_profiles_fkey;
ALTER TABLE public.call_sessions DROP CONSTRAINT IF EXISTS call_sessions_receiver_profiles_fkey;

ALTER TABLE public.call_sessions
ADD CONSTRAINT call_sessions_caller_profiles_fkey 
FOREIGN KEY (caller_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.call_sessions
ADD CONSTRAINT call_sessions_receiver_profiles_fkey 
FOREIGN KEY (receiver_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 3. Update RLS Policy to be robust
DROP POLICY IF EXISTS "Users can view their own calls" ON public.call_sessions;

CREATE POLICY "Users can view their own calls"
ON public.call_sessions
FOR SELECT
USING (
    (auth.uid() = caller_id AND is_hidden_by_caller = false) OR 
    (auth.uid() = receiver_id AND is_hidden_by_receiver = false)
);

-- 4. Re-enable Realtime for the table just in case
ALTER TABLE public.call_sessions REPLICA IDENTITY FULL;
