-- =====================================================
-- Fix Quiz RLS Policy - Secure Function & Proper Access
-- =====================================================
-- This migration fixes the RLS issue where students (especially those registered via email)
-- were getting "permission denied" errors when trying to view quizzes.
-- It replaces the insecure/buggy direct join to auth.users with a SECURITY DEFINER function
-- that safely checks enrollment.

-- 1. Create a secure function to check enrollment
CREATE OR REPLACE FUNCTION public.check_student_quiz_access(p_class_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_has_access boolean;
BEGIN
    v_user_id := auth.uid();
    v_user_email := auth.jwt() ->> 'email';

    SELECT EXISTS (
        SELECT 1 FROM class_students cs
        WHERE cs.class_id = p_class_id
        AND (
            cs.student_id = v_user_id
            OR (
                v_user_email IS NOT NULL 
                AND LOWER(cs.email) = LOWER(v_user_email)
            )
        )
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_student_quiz_access(uuid) TO authenticated;

-- 2. Update Student View Policy
DROP POLICY IF EXISTS "Students can view published quizzes for their classes" ON public.quizzes;

CREATE POLICY "Students can view published quizzes for their classes"
ON public.quizzes FOR SELECT
USING (
    (status = ANY (ARRAY['published'::text, 'closed'::text])) 
    AND public.check_student_quiz_access(class_id)
);

-- 3. Update General View Policy (Lecturer + Student)
-- This ensures lecturers can still see their own quizzes, and students can see theirs
DROP POLICY IF EXISTS "Users can view quizzes" ON public.quizzes;

CREATE POLICY "Users can view quizzes"
ON public.quizzes FOR SELECT
USING (
    (created_by = auth.uid()) -- Lecturer created it
    OR
    (EXISTS ( -- Lecturer owns the class
        SELECT 1 FROM public.classes c
        WHERE c.id = quizzes.class_id
        AND c.lecturer_id = auth.uid()
    ))
    OR
    public.check_student_quiz_access(class_id) -- Student enrolled
);
