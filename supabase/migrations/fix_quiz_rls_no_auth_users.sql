-- =====================================================
-- Fix Quiz RLS Policy - Remove auth.users reference
-- =====================================================
-- The previous policy joined to auth.users which causes permission errors
-- This version uses auth.jwt() to get email instead

-- Create a security definer function to check enrollment by email
CREATE OR REPLACE FUNCTION public.is_student_enrolled_in_class(p_class_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_is_enrolled boolean;
BEGIN
    -- Get current user info
    v_user_id := auth.uid();
    v_user_email := auth.jwt() ->> 'email';
    
    -- Check if enrolled by student_id OR by email
    SELECT EXISTS (
        SELECT 1 FROM class_students cs
        WHERE cs.class_id = p_class_id
        AND (
            cs.student_id = v_user_id
            OR (cs.student_id IS NULL AND LOWER(cs.email) = LOWER(v_user_email))
        )
    ) INTO v_is_enrolled;
    
    RETURN v_is_enrolled;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_student_enrolled_in_class(uuid) TO authenticated;

-- Drop and recreate the quiz policies
DROP POLICY IF EXISTS "Students can view published quizzes for their classes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can view quizzes" ON public.quizzes;

-- Recreate student policy using the function
CREATE POLICY "Students can view published quizzes for their classes"
ON public.quizzes FOR SELECT
USING (
    (status = ANY (ARRAY['published'::text, 'closed'::text])) 
    AND public.is_student_enrolled_in_class(class_id)
);

-- Recreate general view policy
CREATE POLICY "Users can view quizzes"
ON public.quizzes FOR SELECT
USING (
    (created_by = auth.uid())
    OR
    (EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = quizzes.class_id
        AND c.lecturer_id = auth.uid()
    ))
    OR
    public.is_student_enrolled_in_class(class_id)
);
