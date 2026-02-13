-- Add active_call column to profiles table to persist call state across refreshes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_call JSONB DEFAULT NULL;

-- Enable Realtime for the profiles table if not already enabled
-- Note: You might need to adjust this depending on your existing publication settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Add a comment for clarity
COMMENT ON COLUMN public.profiles.active_call IS 'Stores the current active call state: {type, conversationId, isMeeting}';
