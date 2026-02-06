-- Ensure RLS is enabled
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policy to prevent conflicts
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.quiz_submissions;

-- Re-create the policy cleanly
CREATE POLICY "Students can view their own submissions" 
ON public.quiz_submissions FOR SELECT 
TO authenticated
USING (
    student_id = auth.uid()
);

-- Ensure Insert/Update policies exist too (just in case)
DROP POLICY IF EXISTS "Students can create their own submissions" ON public.quiz_submissions;
CREATE POLICY "Students can create their own submissions" 
ON public.quiz_submissions FOR INSERT 
TO authenticated
WITH CHECK (
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Students can update their own submissions" ON public.quiz_submissions;
CREATE POLICY "Students can update their own submissions" 
ON public.quiz_submissions FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()
);

-- Grant permissions just in case
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_submissions TO authenticated;
