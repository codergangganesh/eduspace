-- Secure function to fetch assignment submissions for a lecturer
-- Bypasses RLS on assignment_submissions table but enforces lecturer ownership check
CREATE OR REPLACE FUNCTION get_assignment_submissions_for_lecturer(p_assignment_id UUID)
RETURNS SETOF public.assignment_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is the lecturer for this assignment
  IF EXISTS (
    SELECT 1 FROM public.assignments 
    WHERE id = p_assignment_id 
    AND lecturer_id = auth.uid()
  ) THEN
    RETURN QUERY 
    SELECT * FROM public.assignment_submissions 
    WHERE assignment_id = p_assignment_id;
  ELSE
    -- Return nothing if not authorized (instead of error, to handle "not found" gracefully)
    RETURN;
  END IF;
END;
$$;
