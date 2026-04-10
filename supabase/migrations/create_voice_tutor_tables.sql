-- Create Voice Tutor Sessions table
CREATE TABLE public.voice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Practice',
    practice_mode TEXT,
    focus_area TEXT,
    difficulty TEXT,
    target_duration_minutes INTEGER,
    summary TEXT,
    rubric_score INTEGER,
    recommendations TEXT[],
    session_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Voice Tutor Messages table
CREATE TABLE public.voice_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_messages ENABLE ROW LEVEL SECURITY;

-- Policies for voice_sessions
CREATE POLICY "Users can view their own voice sessions"
    ON public.voice_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice sessions"
    ON public.voice_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions"
    ON public.voice_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice sessions"
    ON public.voice_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for voice_messages
CREATE POLICY "Users can view messages in their own voice sessions"
    ON public.voice_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.voice_sessions
        WHERE id = voice_messages.session_id
        AND user_id = auth.uid()
    ));

CREATE POLICY "Users can insert messages into their own voice sessions"
    ON public.voice_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.voice_sessions
        WHERE id = voice_messages.session_id
        AND user_id = auth.uid()
    ));

-- Trigger for updated_at on voice_sessions
DROP TRIGGER IF EXISTS update_voice_sessions_updated_at ON public.voice_sessions;
CREATE TRIGGER update_voice_sessions_updated_at
    BEFORE UPDATE ON public.voice_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_messages_session_id ON public.voice_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
