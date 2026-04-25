-- Security hardening for notifications RLS and submission access checks

DO $$
BEGIN
    DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can only create notifications for themselves" ON public.notifications;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notifications'
          AND column_name = 'recipient_id'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY "Users can only create notifications for themselves"
            ON public.notifications
            FOR INSERT
            WITH CHECK (auth.uid() = recipient_id)
        $policy$;
    ELSIF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notifications'
          AND column_name = 'user_id'
    ) THEN
        EXECUTE $policy$
            CREATE POLICY "Users can only create notifications for themselves"
            ON public.notifications
            FOR INSERT
            WITH CHECK (auth.uid() = user_id)
        $policy$;
    ELSE
        RAISE EXCEPTION 'notifications table must contain recipient_id or user_id';
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.get_active_student_submission(
    p_quiz_id UUID,
    p_student_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    IF auth.uid() <> p_student_id AND NOT public.has_role(auth.uid(), 'lecturer') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT row_to_json(qs)
    INTO result
    FROM public.quiz_submissions qs
    WHERE qs.quiz_id = p_quiz_id
      AND qs.student_id = p_student_id
      AND qs.is_archived = false
    LIMIT 1;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_student_submission(UUID, UUID) TO authenticated;
