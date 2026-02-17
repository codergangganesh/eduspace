-- Create user_activity_log table to track historical activity
CREATE TABLE IF NOT EXISTS public.user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, action_date)
);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for user_activity_log
DROP POLICY IF EXISTS "Users can view their own activity log" ON public.user_activity_log;
CREATE POLICY "Users can view their own activity log"
    ON public.user_activity_log FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activity log" ON public.user_activity_log;
CREATE POLICY "Users can insert their own activity log"
    ON public.user_activity_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own activity log" ON public.user_activity_log;
CREATE POLICY "Users can update their own activity log"
    ON public.user_activity_log FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own activity log" ON public.user_activity_log;
CREATE POLICY "Users can delete their own activity log"
    ON public.user_activity_log FOR DELETE
    USING (auth.uid() = user_id);
