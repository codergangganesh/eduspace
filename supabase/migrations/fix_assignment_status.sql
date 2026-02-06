-- Enable RLS on assignment_submissions
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can insert their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can delete their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Lecturers can view submissions for their assignments" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Lecturers can update submissions for their assignments" ON public.assignment_submissions;

-- 1. Students can VIEW their own submissions
CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- 2. Students can INSERT their own submissions
-- Ensure the student_id matches the authenticated user
CREATE POLICY "Students can insert their own submissions"
ON public.assignment_submissions FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- 3. Students can UPDATE their own submissions (e.g. resubmit if allowed)
CREATE POLICY "Students can update their own submissions"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (student_id = auth.uid());

-- 4. Students can DELETE their own submissions
CREATE POLICY "Students can delete their own submissions"
ON public.assignment_submissions FOR DELETE
TO authenticated
USING (student_id = auth.uid());

-- 5. Lecturers can VIEW submissions for assignments they created
CREATE POLICY "Lecturers can view submissions for their assignments"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
        AND a.lecturer_id = auth.uid()
    )
);

-- 6. Lecturers can UPDATE (Grade) submissions for their assignments
CREATE POLICY "Lecturers can update submissions for their assignments"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
        AND a.lecturer_id = auth.uid()
    )
);
