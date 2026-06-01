-- ==========================================
-- Migration: Streak Duel Achievements Setup
-- ==========================================

-- 1. CREATE USER DUEL BADGES TABLE
CREATE TABLE IF NOT EXISTS public.user_duel_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    wins_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, badge_type)
);

-- Enable RLS
ALTER TABLE public.user_duel_badges ENABLE ROW LEVEL SECURITY;

-- 2. RLS POLICIES FOR USER DUEL BADGES
-- Allow users to view their own badges
DROP POLICY IF EXISTS "Users can view own duel badges" ON public.user_duel_badges;
CREATE POLICY "Users can view own duel badges"
    ON public.user_duel_badges FOR SELECT
    USING (auth.uid() = user_id);

-- Allow students to unlock/insert badges for themselves
DROP POLICY IF EXISTS "Users can insert own duel badges" ON public.user_duel_badges;
CREATE POLICY "Users can insert own duel badges"
    ON public.user_duel_badges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow students to update/manage their badges
DROP POLICY IF EXISTS "Users can update own duel badges" ON public.user_duel_badges;
CREATE POLICY "Users can update own duel badges"
    ON public.user_duel_badges FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow students to delete their badges
DROP POLICY IF EXISTS "Users can delete own duel badges" ON public.user_duel_badges;
CREATE POLICY "Users can delete own duel badges"
    ON public.user_duel_badges FOR DELETE
    USING (auth.uid() = user_id);

-- Add user_duel_badges to Realtime replication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'user_duel_badges'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_duel_badges;
    END IF;
END $$;
