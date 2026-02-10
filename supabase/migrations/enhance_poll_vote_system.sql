-- Enhance Poll Vote System for Vote Changes
-- This migration ensures students can change their votes with proper data integrity

-- 1. Add UPDATE and DELETE policies for chat_poll_votes
-- Allow users to update their own votes
CREATE POLICY "Users can update their own votes" ON chat_poll_votes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own votes (needed for vote changes)
CREATE POLICY "Users can delete their own votes" ON chat_poll_votes
    FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Add is_active column to chat_polls for poll state management
ALTER TABLE chat_polls ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false;

-- 3. Create an index for faster vote lookups
CREATE INDEX IF NOT EXISTS idx_chat_poll_votes_poll_user ON chat_poll_votes(poll_id, user_id);

-- 4. Add a function to handle vote changes atomically
CREATE OR REPLACE FUNCTION change_poll_vote(
    p_poll_id UUID,
    p_user_id UUID,
    p_new_option_index INTEGER
) RETURNS void AS $$
BEGIN
    -- Delete any existing votes for this user on this poll
    DELETE FROM chat_poll_votes
    WHERE poll_id = p_poll_id AND user_id = p_user_id;
    
    -- Insert the new vote
    INSERT INTO chat_poll_votes (poll_id, user_id, option_index)
    VALUES (p_poll_id, p_user_id, p_new_option_index);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION change_poll_vote(UUID, UUID, INTEGER) TO authenticated;
