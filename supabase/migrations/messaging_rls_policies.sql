-- Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversations;

-- Re-create policies with explicit permissions

-- 1. SELECT: Users can specific rows where they are a participant
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (
    auth.uid() = participant_1 OR 
    auth.uid() = participant_2
);

-- 2. INSERT: Users can insert rows if they are one of the participants
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
    auth.uid() = participant_1 OR 
    auth.uid() = participant_2
);

-- 3. UPDATE: Users can update rows if they are one of the participants
CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
USING (
    auth.uid() = participant_1 OR 
    auth.uid() = participant_2
);
