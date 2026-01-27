-- =====================================================
-- Fix assignment_submissions Foreign Key Constraints
-- =====================================================

-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.assignment_submissions 
DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_fkey;

-- Add correct foreign key constraint pointing to auth.users
ALTER TABLE public.assignment_submissions
ADD CONSTRAINT assignment_submissions_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the constraint
COMMENT ON CONSTRAINT assignment_submissions_student_id_fkey ON public.assignment_submissions 
IS 'Foreign key to auth.users table for student identification';
