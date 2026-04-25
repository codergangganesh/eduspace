-- Add richer metadata for AI voice tutor sessions
ALTER TABLE public.voice_sessions
    ADD COLUMN IF NOT EXISTS practice_mode TEXT,
    ADD COLUMN IF NOT EXISTS focus_area TEXT,
    ADD COLUMN IF NOT EXISTS difficulty TEXT,
    ADD COLUMN IF NOT EXISTS target_duration_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS summary TEXT,
    ADD COLUMN IF NOT EXISTS rubric_score NUMERIC,
    ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS session_metrics JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.voice_sessions
    DROP CONSTRAINT IF EXISTS voice_sessions_difficulty_check;

ALTER TABLE public.voice_sessions
    ADD CONSTRAINT voice_sessions_difficulty_check
    CHECK (difficulty IS NULL OR difficulty IN ('beginner', 'intermediate', 'advanced'));

ALTER TABLE public.voice_sessions
    DROP CONSTRAINT IF EXISTS voice_sessions_practice_mode_check;

ALTER TABLE public.voice_sessions
    ADD CONSTRAINT voice_sessions_practice_mode_check
    CHECK (practice_mode IS NULL OR practice_mode IN (
        'interview',
        'language',
        'presentation',
        'sales',
        'academic',
        'confidence'
    ));

CREATE INDEX IF NOT EXISTS idx_voice_sessions_practice_mode
    ON public.voice_sessions(practice_mode);

