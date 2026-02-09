-- Create table for student notes
CREATE TABLE IF NOT EXISTS student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see only their own notes
CREATE POLICY "Users can view own notes" ON student_notes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own notes
CREATE POLICY "Users can create own notes" ON student_notes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes" ON student_notes
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes" ON student_notes
    FOR DELETE
    USING (auth.uid() = user_id);
