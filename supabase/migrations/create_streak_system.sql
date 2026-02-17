-- Create user_streaks table
CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_days INTEGER DEFAULT 0,
    last_action_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    streak_count INTEGER NOT NULL,
    UNIQUE(user_id, badge_type)
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for user_streaks
DROP POLICY IF EXISTS "Users can view their own streak" ON public.user_streaks;
CREATE POLICY "Users can view their own streak"
    ON public.user_streaks FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own streak" ON public.user_streaks;
CREATE POLICY "Users can update their own streak"
    ON public.user_streaks FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own streak" ON public.user_streaks;
CREATE POLICY "Users can insert own streak"
    ON public.user_streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own streak" ON public.user_streaks;
CREATE POLICY "Users can delete own streak"
    ON public.user_streaks FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for user_badges
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges"
    ON public.user_badges FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;
CREATE POLICY "Users can insert own badges"
    ON public.user_badges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own badges" ON public.user_badges;
CREATE POLICY "Users can delete own badges"
    ON public.user_badges FOR DELETE
    USING (auth.uid() = user_id);

-- Function to handle streak updates automatically on action tracking
-- However, we'll likely handle this in the frontend/service to triggered by specific actions.
-- But let's add a trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_streaks_updated_at
    BEFORE UPDATE ON public.user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
