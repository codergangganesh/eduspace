-- Allow new statuses in the check constraint
ALTER TABLE public.assignments
DROP CONSTRAINT IF EXISTS assignments_status_check;

ALTER TABLE public.assignments
ADD CONSTRAINT assignments_status_check
CHECK (status IN ('draft', 'published', 'active', 'closed', 'completed', 'archived'));

-- Update policy to allow students to see active and completed assignments
DROP POLICY IF EXISTS "Students can view assignments for enrolled classes" ON public.assignments;

CREATE POLICY "Students can view assignments for enrolled classes"
ON public.assignments FOR SELECT
USING (
    status IN ('published', 'active', 'completed') AND
    (
        -- New class-based assignments
        (
            class_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.class_students cs
                JOIN public.access_requests ar ON ar.class_id = cs.class_id AND ar.student_id = cs.student_id
                WHERE cs.class_id = assignments.class_id
                AND cs.student_id = auth.uid()
                AND ar.status = 'accepted'
            )
        )
        OR
        -- Old assignments without class_id (show to all students - backward compatibility)
        (class_id IS NULL)
    )
);
