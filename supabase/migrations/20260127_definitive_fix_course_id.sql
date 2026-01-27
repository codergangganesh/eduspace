-- =====================================================
-- DEFINITIVE FIX: Remove ALL course_id References
-- =====================================================

-- Step 1: Drop all views that might reference course_id
DROP VIEW IF EXISTS public.assignment_details CASCADE;
DROP VIEW IF EXISTS public.student_assignments CASCADE;
DROP VIEW IF EXISTS public.lecturer_assignments CASCADE;

-- Step 2: Drop all functions that might reference course_id
DROP FUNCTION IF EXISTS public.get_student_assignments CASCADE;
DROP FUNCTION IF EXISTS public.get_lecturer_assignments CASCADE;

-- Step 3: Drop ALL triggers on assignments and assignment_submissions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
        AND event_object_table IN ('assignments', 'assignment_submissions')
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.' || quote_ident(r.event_object_table) || ' CASCADE';
    END LOOP;
END $$;

-- Step 4: Drop ALL policies on assignments
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'assignments' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.assignments CASCADE';
    END LOOP;
END $$;

-- Step 5: Drop ALL policies on assignment_submissions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'assignment_submissions' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.assignment_submissions CASCADE';
    END LOOP;
END $$;

-- Step 6: Recreate SIMPLE policies for assignments (NO JOINS, NO course_id)
CREATE POLICY "Lecturers can manage their own assignments"
ON public.assignments FOR ALL
TO authenticated
USING (lecturer_id = auth.uid())
WITH CHECK (lecturer_id = auth.uid());

CREATE POLICY "Students can view published assignments in their classes"
ON public.assignments FOR SELECT
TO authenticated
USING (
    (status = 'published' OR status = 'active') AND
    class_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.access_requests
        WHERE access_requests.class_id = assignments.class_id
        AND access_requests.student_id = auth.uid()
        AND access_requests.status = 'accepted'
    )
);

-- Step 7: Recreate SIMPLE policies for assignment_submissions (NO JOINS)
CREATE POLICY "Students manage their own submissions"
ON public.assignment_submissions FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Lecturers view submissions for their assignments"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments
        WHERE assignments.id = assignment_submissions.assignment_id
        AND assignments.lecturer_id = auth.uid()
    )
);

CREATE POLICY "Lecturers update submissions for their assignments"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments
        WHERE assignments.id = assignment_submissions.assignment_id
        AND assignments.lecturer_id = auth.uid()
    )
);

-- Step 8: Ensure RLS is enabled
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Step 9: Verify no course_id column exists in assignments
-- If it does exist, we need to know about it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'assignments' 
        AND column_name = 'course_id'
    ) THEN
        RAISE NOTICE 'WARNING: course_id column still exists in assignments table';
    ELSE
        RAISE NOTICE 'SUCCESS: No course_id column in assignments table';
    END IF;
END $$;

-- Step 10: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.assignment_submissions TO authenticated;
