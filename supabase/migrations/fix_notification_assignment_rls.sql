-- =====================================================
-- Fix RLS Policies for Notifications and Assignments
-- =====================================================
-- Issue: Students imported or added manually are only in class_students, 
-- not access_requests. Previous policies strictly checked access_requests.
-- ALSO: Previous fix attempted to query auth.users which causes permission errors.
-- Fix: Allow access if student is in class_students OR access_requests using auth.email().

-- 1. Fix Notifications Policies
DROP POLICY IF EXISTS "Students see notifications from accepted classes" ON public.notifications;
DROP POLICY IF EXISTS "Lecturers see all their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- Explicit policy for Lecturers (and Admins) to see all their own notifications
CREATE POLICY "Lecturers and Admins see all their own notifications"
ON public.notifications FOR SELECT
USING (
    recipient_id = auth.uid()
);

-- Refined policy for Students with roster fallback
CREATE POLICY "Students see notifications from roster or accepted classes"
ON public.notifications FOR SELECT
USING (
    recipient_id = auth.uid() AND
    (
        class_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.class_students cs
            WHERE cs.class_id = notifications.class_id
            AND (
                cs.student_id = auth.uid() OR
                cs.email = (auth.email())::text
            )
        ) OR
        EXISTS (
            SELECT 1 FROM public.access_requests ar
            WHERE ar.class_id = notifications.class_id
            AND ar.student_id = auth.uid()
            AND ar.status = 'accepted'
        )
    )
);

-- 2. Fix Assignments Policy
DROP POLICY IF EXISTS "Students can view assignments for enrolled classes" ON public.assignments;

CREATE POLICY "Students can view assignments for enrolled classes"
ON public.assignments FOR SELECT
USING (
    (
        class_id IS NOT NULL AND
        (status = 'published' OR status = 'active') AND
        (
            EXISTS (
                SELECT 1 FROM public.class_students cs
                WHERE cs.class_id = assignments.class_id
                AND (
                    cs.student_id = auth.uid() OR
                    cs.email = (auth.email())::text
                )
            ) OR
            EXISTS (
                SELECT 1 FROM public.access_requests ar
                WHERE ar.class_id = assignments.class_id
                AND ar.student_id = auth.uid()
                AND ar.status = 'accepted'
            )
        )
    )
    OR
    (
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
