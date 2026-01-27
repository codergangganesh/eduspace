-- =====================================================
-- Update RLS Policies for Class-Scoped Notifications
-- =====================================================

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Students see notifications from accepted classes" ON public.notifications;

-- Students can only see notifications from accepted classes or general notifications
CREATE POLICY "Students see notifications from accepted classes"
ON public.notifications FOR SELECT
USING (
    recipient_id = auth.uid() AND
    (
        -- Class-scoped notifications (only if enrolled and accepted)
        (
            class_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.access_requests ar
                WHERE ar.class_id = notifications.class_id
                AND ar.student_id = auth.uid()
                AND ar.status = 'accepted'
            )
        )
        OR
        -- Non-class notifications (general notifications, access requests, etc.)
        class_id IS NULL
    )
);

-- Lecturers can see all their notifications
CREATE POLICY "Lecturers see all their notifications"
ON public.notifications FOR SELECT
USING (
    recipient_id = auth.uid()
);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (recipient_id = auth.uid());

-- =====================================================
-- Ensure Assignments RLS Supports Class-Scoped Access
-- =====================================================

-- Update student assignment viewing policy
DROP POLICY IF EXISTS "Students can view assignments for enrolled classes" ON public.assignments;

CREATE POLICY "Students can view assignments for enrolled classes"
ON public.assignments FOR SELECT
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
    OR
    (
        -- Old course-based assignments (backward compatibility)
        class_id IS NULL AND
        status = 'published' AND
        EXISTS (
            SELECT 1 FROM public.course_enrollments e 
            WHERE e.course_id = assignments.course_id 
            AND e.student_id = auth.uid()
        )
    )
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
