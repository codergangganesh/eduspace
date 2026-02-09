-- Add update policy for chat_polls
CREATE POLICY "Users can update their own polls" ON chat_polls
    FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
