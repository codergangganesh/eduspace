-- =====================================================
-- Complete Fix for assignment_submissions Table
-- =====================================================

-- First, let's check what policies exist
-- Run this to see all policies:
-- SELECT * FROM pg_policies WHERE tablename = 'assignment_submissions';

-- Drop ALL policies on assignment_submissions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'assignment_submissions' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.assignment_submissions';
    END LOOP;
END $$;

-- Drop ALL policies on assignments that might reference course_id
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'assignments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.assignments';
    END LOOP;
END $$;

-- Recreate assignment_submissions policies (simple, no joins)
CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own submissions"
ON public.assignment_submissions FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view all submissions"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments
        WHERE assignments.id = assignment_submissions.assignment_id
        AND assignments.lecturer_id = auth.uid()
    )
);

CREATE POLICY "Lecturers can update all submissions"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments
        WHERE assignments.id = assignment_submissions.assignment_id
        AND assignments.lecturer_id = auth.uid()
    )
);

-- Recreate assignments policies (using class_id, not course_id)
CREATE POLICY "Lecturers can view their assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (lecturer_id = auth.uid());

CREATE POLICY "Lecturers can insert their assignments"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (lecturer_id = auth.uid());

CREATE POLICY "Lecturers can update their assignments"
ON public.assignments FOR UPDATE
TO authenticated
USING (lecturer_id = auth.uid());

CREATE POLICY "Lecturers can delete their assignments"
ON public.assignments FOR DELETE
TO authenticated
USING (lecturer_id = auth.uid());

CREATE POLICY "Students can view published assignments for enrolled classes"
ON public.assignments FOR SELECT
TO authenticated
USING (
    (
        -- New class-based assignments (must be accepted)
        class_id IS NOT NULL AND
        (status = 'published' OR status = 'active') AND
        EXISTS (
            SELECT 1 FROM public.access_requests ar
            WHERE ar.class_id = assignments.class_id
            AND ar.student_id = auth.uid()
            AND ar.status = 'accepted'
        )
    )
);

-- Enable RLS
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
