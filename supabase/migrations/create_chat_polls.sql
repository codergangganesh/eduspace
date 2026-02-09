-- Create table for polls
CREATE TABLE IF NOT EXISTS chat_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Create table for poll votes
CREATE TABLE IF NOT EXISTS chat_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES chat_polls(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(poll_id, user_id) -- One vote per user per poll
);

-- Enable RLS
ALTER TABLE chat_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies for Polls
CREATE POLICY "Users can view polls in their conversations" ON chat_polls
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = chat_polls.conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()) -- Basic check, can be expanded for groups
        )
    );

CREATE POLICY "Users can create polls in their conversations" ON chat_polls
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = chat_polls.conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

-- Policies for Votes
CREATE POLICY "Users can view votes in their conversations" ON chat_poll_votes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_polls p
            JOIN conversations c ON c.id = p.conversation_id
            WHERE p.id = chat_poll_votes.poll_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

CREATE POLICY "Users can vote in their conversations" ON chat_poll_votes
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM chat_polls p
            JOIN conversations c ON c.id = p.conversation_id
            WHERE p.id = chat_poll_votes.poll_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );
