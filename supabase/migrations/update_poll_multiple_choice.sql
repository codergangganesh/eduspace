-- Add allow_multiple column to chat_polls
ALTER TABLE chat_polls ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT false;

-- Update constraints on chat_poll_votes to allow multiple votes per user (one per option)
-- First, drop the old unique constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_poll_votes_poll_id_user_id_key') THEN
        ALTER TABLE chat_poll_votes DROP CONSTRAINT chat_poll_votes_poll_id_user_id_key;
    END IF;
END $$;

-- Add the new unique constraint for poll_id, user_id, AND option_index
ALTER TABLE chat_poll_votes ADD CONSTRAINT chat_poll_votes_poll_id_user_id_option_index_key UNIQUE (poll_id, user_id, option_index);
