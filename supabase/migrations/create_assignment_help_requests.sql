-- Live quick-help threads for assignment pages

CREATE TABLE IF NOT EXISTS public.help_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requester_role TEXT DEFAULT 'student' CHECK (requester_role IN ('student', 'lecturer', 'admin')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    resolved_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.help_request_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    help_request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_help_requests_assignment_id ON public.help_requests(assignment_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_class_id ON public.help_requests(class_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_requester_id ON public.help_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_help_request_replies_help_request_id ON public.help_request_replies(help_request_id);

ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_request_replies ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Users can create help requests in their assignment space" ON public.help_requests;
CREATE POLICY "Users can create help requests in their assignment space"
ON public.help_requests FOR INSERT
WITH CHECK (
    auth.uid() = requester_id
    AND (
        EXISTS (
            SELECT 1
            FROM public.assignments a
            WHERE a.id = help_requests.assignment_id
            AND a.lecturer_id = auth.uid()
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
    )
);

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
        FROM public.class_students cs
        WHERE cs.class_id = help_requests.class_id
        AND cs.student_id = auth.uid()
    )
);

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

DROP TRIGGER IF EXISTS update_help_requests_updated_at ON public.help_requests;
CREATE TRIGGER update_help_requests_updated_at
BEFORE UPDATE ON public.help_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.help_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_request_replies;
