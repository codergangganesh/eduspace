-- =====================================================
-- Fix class_students Foreign Key and RLS Policy Issues
-- =====================================================
-- Issue: "permission denied for table users" when importing students
-- 
-- Root Cause: RLS policy "Students can view their own class enrollments" uses:
--   SELECT email FROM auth.users WHERE id = auth.uid()
-- which requires SELECT on auth.users that regular users don't have.
-- 
-- Solution: Use auth.email() function instead of querying auth.users directly
-- =====================================================

-- 1. Drop the problematic foreign key constraint (if exists)
ALTER TABLE public.class_students
DROP CONSTRAINT IF EXISTS class_students_student_id_fkey;

-- 2. Ensure the column is nullable
ALTER TABLE public.class_students
ALTER COLUMN student_id DROP NOT NULL;

-- 3. Fix the RLS policy that references auth.users
DROP POLICY IF EXISTS "Students can view their own class enrollments" ON public.class_students;

CREATE POLICY "Students can view their own class enrollments"
ON public.class_students FOR SELECT
USING (
    auth.uid() = student_id 
    OR email = (auth.email())::text
);

-- 4. Ensure lecturer policy has proper WITH CHECK for inserts
DROP POLICY IF EXISTS "Lecturers can manage students in their classes" ON public.class_students;

CREATE POLICY "Lecturers can manage students in their classes"
ON public.class_students FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = class_students.class_id
        AND c.lecturer_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = class_students.class_id
        AND c.lecturer_id = auth.uid()
    )
);

-- Add documentation
COMMENT ON COLUMN public.class_students.student_id IS 
'Links to auth.users. NULL for imported students who have not yet registered/linked their account.';
