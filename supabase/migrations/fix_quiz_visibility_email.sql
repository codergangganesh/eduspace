-- =====================================================
-- Fix Quiz RLS Policy for Email-Based Matching
-- =====================================================
-- Allows students to view quizzes if they are enrolled in the class
-- by either student_id OR by matching email address (for unlinked students)

-- Drop existing student view policy
DROP POLICY IF EXISTS "Students can view published quizzes for their classes" ON public.quizzes;

-- Recreate with email fallback support
CREATE POLICY "Students can view published quizzes for their classes"
ON public.quizzes FOR SELECT
USING (
    (status = ANY (ARRAY['published'::text, 'closed'::text])) 
    AND (
        -- Check by student_id (for linked students)
        EXISTS (
            SELECT 1 FROM public.class_students cs
            WHERE cs.class_id = quizzes.class_id
            AND cs.student_id = auth.uid()
        )
        OR
        -- Check by email (for unlinked students who registered with same email)
        EXISTS (
            SELECT 1 FROM public.class_students cs
            JOIN auth.users u ON LOWER(cs.email) = LOWER(u.email)
            WHERE cs.class_id = quizzes.class_id
            AND u.id = auth.uid()
            AND cs.student_id IS NULL
        )
    )
);

-- Also update the "Users can view quizzes" policy
DROP POLICY IF EXISTS "Users can view quizzes" ON public.quizzes;

CREATE POLICY "Users can view quizzes"
ON public.quizzes FOR SELECT
USING (
    (created_by = auth.uid())
    OR
    -- Lecturer owns the class
    (EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = quizzes.class_id
        AND c.lecturer_id = auth.uid()
    ))
    OR
    -- Student enrolled by student_id
    (EXISTS (
        SELECT 1 FROM public.class_students cs
        WHERE cs.class_id = quizzes.class_id
        AND cs.student_id = auth.uid()
    ))
    OR
    -- Student enrolled by email (unlinked)
    (EXISTS (
        SELECT 1 FROM public.class_students cs
        JOIN auth.users u ON LOWER(cs.email) = LOWER(u.email)
        WHERE cs.class_id = quizzes.class_id
        AND u.id = auth.uid()
        AND cs.student_id IS NULL
    ))
);
