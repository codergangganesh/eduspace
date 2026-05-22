-- ==========================================
-- Migration: Peer-to-Peer Streak Duels Setup
-- ==========================================

-- 1. SECURITY DEFINER FUNCTION TO PREVENT RLS INFINITE RECURSION
-- Returns a list of class_ids that the current user is enrolled in
CREATE OR REPLACE FUNCTION public.get_my_class_ids()
RETURNS TABLE (class_id UUID) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY 
    SELECT cs.class_id FROM public.class_students cs
    WHERE cs.student_id = auth.uid() OR cs.email = (auth.jwt() ->> 'email');
END;
$$ LANGUAGE plpgsql;

-- 2. ENHANCE RLS POLICIES FOR CLASSMATES LOOKUP
-- Allow students to view other student records if they share a class
DROP POLICY IF EXISTS "Students can view classmates in their classes" ON public.class_students;
CREATE POLICY "Students can view classmates in their classes"
ON public.class_students FOR SELECT
USING (
    class_id IN (SELECT public.get_my_class_ids())
);

-- Allow students to view profiles of classmates they share a class with
DROP POLICY IF EXISTS "Students can view classmates profiles" ON public.student_profiles;
CREATE POLICY "Students can view classmates profiles"
ON public.student_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.class_students cs
        WHERE cs.student_id = student_profiles.user_id
        AND cs.class_id IN (SELECT public.get_my_class_ids())
    )
);

-- Allow students to view current streaks of classmates they share a class with
DROP POLICY IF EXISTS "Students can view classmates streaks" ON public.user_streaks;
CREATE POLICY "Students can view classmates streaks"
ON public.user_streaks FOR SELECT
USING (
    user_id IN (
        SELECT cs.student_id FROM public.class_students cs
        WHERE cs.class_id IN (SELECT public.get_my_class_ids())
    )
);

-- 3. CREATE STREAK DUELS TABLE
CREATE TABLE IF NOT EXISTS public.streak_duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    defender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'completed')),
    challenger_start_streak INTEGER NOT NULL DEFAULT 0,
    defender_start_streak INTEGER NOT NULL DEFAULT 0,
    challenger_current_streak INTEGER NOT NULL DEFAULT 0,
    defender_current_streak INTEGER NOT NULL DEFAULT 0,
    challenger_score INTEGER NOT NULL DEFAULT 0,
    defender_score INTEGER NOT NULL DEFAULT 0,
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Enforce that challenger and defender are unique
    CONSTRAINT different_users CHECK (challenger_id <> defender_id)
);

-- Enable RLS
ALTER TABLE public.streak_duels ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR STREAK DUELS
-- Allow users to view duels they participate in, or duels occurring within their classes
DROP POLICY IF EXISTS "Users can view duels they participate in or within their classes" ON public.streak_duels;
CREATE POLICY "Users can view duels they participate in or within their classes"
ON public.streak_duels FOR SELECT
USING (
    auth.uid() = challenger_id 
    OR auth.uid() = defender_id
    OR class_id IN (SELECT public.get_my_class_ids())
);

-- Allow students to create a pending duel if they are enrolled in the same class as the defender
DROP POLICY IF EXISTS "Users can create duels as challenger" ON public.streak_duels;
CREATE POLICY "Users can create duels as challenger"
ON public.streak_duels FOR INSERT
WITH CHECK (
    auth.uid() = challenger_id
    AND EXISTS (
        SELECT 1 FROM public.class_students cs
        WHERE cs.class_id = class_id AND cs.student_id = challenger_id
    )
    AND EXISTS (
        SELECT 1 FROM public.class_students cs
        WHERE cs.class_id = class_id AND cs.student_id = defender_id
    )
);

-- Allow both challenger and defender to update the duel details (respond, sync scores)
DROP POLICY IF EXISTS "Users can update their own duels" ON public.streak_duels;
CREATE POLICY "Users can update their own duels"
ON public.streak_duels FOR UPDATE
USING (auth.uid() = challenger_id OR auth.uid() = defender_id)
WITH CHECK (auth.uid() = challenger_id OR auth.uid() = defender_id);

-- 5. TRIGGER FOR UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_streak_duels_updated_at ON public.streak_duels;
CREATE TRIGGER set_streak_duels_updated_at
    BEFORE UPDATE ON public.streak_duels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. REAL-TIME REGISTRATION
-- Add streak_duels to Supabase Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'streak_duels'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.streak_duels;
    END IF;
END $$;
