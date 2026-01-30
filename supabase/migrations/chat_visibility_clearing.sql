-- Add chat management fields to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS cleared_at JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS visible_to UUID[] DEFAULT NULL;

-- Initialize visible_to for existing conversations
UPDATE public.conversations
SET visible_to = ARRAY[participant_1, participant_2]
WHERE visible_to IS NULL;

-- Update RLS policies to respect visible_to
-- If a user deletes a chat, they shouldn't see it in the list (but we might need to select it to check for existence/resurrection)
-- The existing policy "Users can view their own conversations" checks participant_1/2.
-- We can keep that for security (ownership) and filter visibility in the application query, 
-- OR strictly enforce it here. 
-- Strict enforcement:
-- CREATE POLICY "Users can view active conversations"
-- ON public.conversations FOR SELECT
-- USING (auth.uid() = ANY(visible_to));
-- However, we likely want to allow fetching "deleted" chats to check if we need to "resurrect" them vs create new.
-- So we'll trust the application query to filter for the UI list, but allow selecting by ID if participant.

-- Comment on columns
COMMENT ON COLUMN public.conversations.cleared_at IS 'JSONB mapping user_id to timestamp. Messages before this timestamp are hidden for that user.';
COMMENT ON COLUMN public.conversations.visible_to IS 'Array of user_ids who have not deleted this conversation. If a user deletes the chat, their ID is removed.';
