-- Create Coach's Notebook Chat table for persistent clarification chats
CREATE TABLE public.coach_notebook_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.coach_notebook_chats ENABLE ROW LEVEL SECURITY;

-- Policies for coach_notebook_chats
CREATE POLICY "Users can view their own coach notebook chats"
    ON public.coach_notebook_chats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coach notebook chats"
    ON public.coach_notebook_chats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coach notebook chats"
    ON public.coach_notebook_chats FOR DELETE
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_coach_notebook_chats_user_id ON public.coach_notebook_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_notebook_chats_created_at ON public.coach_notebook_chats(created_at DESC);
