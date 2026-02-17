-- Update "Students can view published assignments for enrolled classes" policy
-- to include 'completed' and 'closed' statuses so students can see past assignments.
-- Also add fallback for legacy enrollments in class_students table.

DROP POLICY IF EXISTS "Students can view published assignments for enrolled classes" ON public.assignments;

CREATE POLICY "Students can view published assignments for enrolled classes"
ON public.assignments FOR SELECT
TO authenticated
USING (
    (
        class_id IS NOT NULL AND
        (status IN ('published', 'active', 'completed', 'closed')) AND
        (
            -- Check access_requests (primary method)
            EXISTS (
                SELECT 1 FROM public.access_requests ar
                WHERE ar.class_id = assignments.class_id
                AND ar.student_id = auth.uid()
                AND ar.status = 'accepted'
            )
            OR
            -- Check class_students (legacy method fallback)
            EXISTS (
                SELECT 1 FROM public.class_students cs
                WHERE cs.class_id = assignments.class_id
                AND cs.student_id = auth.uid()
            )
        )
    )
);
