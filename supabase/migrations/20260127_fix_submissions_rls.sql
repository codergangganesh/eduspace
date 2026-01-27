-- =====================================================
-- Fix RLS Policies for assignment_submissions Table
-- =====================================================

-- Drop all existing policies on assignment_submissions
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can insert their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Lecturers can view submissions for their assignments" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Lecturers can update submissions for their assignments" ON public.assignment_submissions;

-- Students can view their own submissions
CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can insert their own submissions
CREATE POLICY "Students can insert their own submissions"
ON public.assignment_submissions FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- Students can update their own submissions
CREATE POLICY "Students can update their own submissions"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (student_id = auth.uid());

-- Lecturers can view submissions for their assignments
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

-- Lecturers can update (grade) submissions for their assignments
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
