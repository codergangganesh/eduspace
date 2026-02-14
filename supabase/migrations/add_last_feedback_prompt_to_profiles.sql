-- Add last_feedback_prompt_at to profiles table for cross-device feedback tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_feedback_prompt_at TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.last_feedback_prompt_at IS 'Timestamp of when the user was last shown the feedback prompt automatically.';
