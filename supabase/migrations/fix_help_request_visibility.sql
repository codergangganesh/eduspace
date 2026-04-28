-- Fix help request visibility for lecturers/admins
-- Some assignments may have lecturer_id null/mismatched; fall back to class lecturer ownership.

-- help_requests SELECT
DROP POLICY IF EXISTS "Help requests visible to assignment participants" ON public.help_requests;
CREATE POLICY "Help requests visible to assignment participants"
ON public.help_requests FOR SELECT
USING (
    auth.uid() = requester_id
    OR EXISTS (
        SELECT 1
        FROM public.assignments a
        WHERE a.id = help_requests.assignment_id
        AND a.lecturer_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.classes c
        WHERE c.id = help_requests.class_id
        AND c.lecturer_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
    OR EXISTS (
        SELECT 1
        FROM public.class_students cs
        WHERE cs.class_id = help_requests.class_id
        AND cs.student_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.access_requests ar
        WHERE ar.class_id = help_requests.class_id
        AND ar.student_id = auth.uid()
        AND ar.status = 'accepted'
    )
);

-- help_requests UPDATE
DROP POLICY IF EXISTS "Assignment participants can update help requests" ON public.help_requests;
CREATE POLICY "Assignment participants can update help requests"
ON public.help_requests FOR UPDATE
USING (
    auth.uid() = requester_id
    OR EXISTS (
        SELECT 1
        FROM public.assignments a
        WHERE a.id = help_requests.assignment_id
        AND a.lecturer_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.classes c
        WHERE c.id = help_requests.class_id
        AND c.lecturer_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
    OR EXISTS (
        SELECT 1
        FROM public.class_students cs
        WHERE cs.class_id = help_requests.class_id
        AND cs.student_id = auth.uid()
    )
)
WITH CHECK (
    auth.uid() = requester_id
    OR EXISTS (
        SELECT 1
        FROM public.assignments a
        WHERE a.id = help_requests.assignment_id
        AND a.lecturer_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.classes c
        WHERE c.id = help_requests.class_id
        AND c.lecturer_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
    OR EXISTS (
        SELECT 1
        FROM public.class_students cs
        WHERE cs.class_id = help_requests.class_id
        AND cs.student_id = auth.uid()
    )
);

-- Replies SELECT
DROP POLICY IF EXISTS "Help request replies visible to assignment participants" ON public.help_request_replies;
CREATE POLICY "Help request replies visible to assignment participants"
ON public.help_request_replies FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.help_requests hr
        WHERE hr.id = help_request_replies.help_request_id
        AND (
            auth.uid() = hr.requester_id
            OR EXISTS (
                SELECT 1
                FROM public.assignments a
                WHERE a.id = hr.assignment_id
                AND a.lecturer_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1
                FROM public.classes c
                WHERE c.id = hr.class_id
                AND c.lecturer_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1
                FROM public.user_roles ur
                WHERE ur.user_id = auth.uid()
                AND ur.role = 'admin'
            )
            OR EXISTS (
                SELECT 1
                FROM public.class_students cs
                WHERE cs.class_id = hr.class_id
                AND cs.student_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1
                FROM public.access_requests ar
                WHERE ar.class_id = hr.class_id
                AND ar.student_id = auth.uid()
                AND ar.status = 'accepted'
            )
        )
    )
);

-- Replies INSERT
DROP POLICY IF EXISTS "Assignment participants can reply to help requests" ON public.help_request_replies;
CREATE POLICY "Assignment participants can reply to help requests"
ON public.help_request_replies FOR INSERT
WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
        SELECT 1
        FROM public.help_requests hr
        WHERE hr.id = help_request_replies.help_request_id
        AND (
            auth.uid() = hr.requester_id
            OR EXISTS (
                SELECT 1
                FROM public.assignments a
                WHERE a.id = hr.assignment_id
                AND a.lecturer_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1
                FROM public.classes c
                WHERE c.id = hr.class_id
                AND c.lecturer_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1
                FROM public.user_roles ur
                WHERE ur.user_id = auth.uid()
                AND ur.role = 'admin'
            )
            OR EXISTS (
                SELECT 1
                FROM public.class_students cs
                WHERE cs.class_id = hr.class_id
                AND cs.student_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1
                FROM public.access_requests ar
                WHERE ar.class_id = hr.class_id
                AND ar.student_id = auth.uid()
                AND ar.status = 'accepted'
            )
        )
    )
);

