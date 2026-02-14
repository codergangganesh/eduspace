-- Create feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own feedback"
ON public.feedbacks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON public.feedbacks
FOR SELECT
USING (auth.uid() = user_id);

-- Create a view for admin to see all feedback (optional, but good for future)
-- CREATE VIEW public.all_feedbacks AS SELECT * FROM public.feedbacks;
-- GRANT SELECT ON public.all_feedbacks TO service_role;
