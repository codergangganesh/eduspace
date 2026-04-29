-- Create AI Message Feedback Table
-- This table stores user feedback (like/dislike) for AI conversation messages

CREATE TABLE IF NOT EXISTS ai_message_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message_id UUID REFERENCES ai_messages(id) ON DELETE CASCADE NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, message_id)
);

-- Enable Row Level Security
ALTER TABLE ai_message_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for AI message feedback
-- Users can read their own feedback
CREATE POLICY "Users can view their own feedback"
    ON ai_message_feedback
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
    ON ai_message_feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update their own feedback"
    ON ai_message_feedback
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback"
    ON ai_message_feedback
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_message_feedback_message_id ON ai_message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_feedback_user_id ON ai_message_feedback(user_id);