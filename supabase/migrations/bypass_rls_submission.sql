-- Function to bypass RLS and get active submission
-- Using SECURITY DEFINER to run as owner (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_active_student_submission(
    p_quiz_id UUID, 
    p_student_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
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
