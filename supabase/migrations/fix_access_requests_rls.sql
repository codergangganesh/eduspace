-- =====================================================
-- Fix RLS Policy for Access Requests
-- =====================================================
-- Issue: The previous policy checked "student_email = (SELECT email FROM auth.users WHERE id = auth.uid())"
-- This caused a silent crash for regular users because they don't have SELECT permission on auth.users.
-- When it crashed, it returned FALSE, hiding invitations from students whose student_id was still NULL.

-- Fix: Use Supabase's built-in auth.email() function instead, which doesn't require querying the auth schema.

DROP POLICY IF EXISTS "Students can view and respond to their access requests" ON public.access_requests;

CREATE POLICY "Students can view and respond to their access requests"
ON public.access_requests FOR ALL
USING (
    auth.uid() = student_id OR
    student_email = (auth.email())::text
);

-- Note: We also add a WITH CHECK clause to ensure inserts/updates follow the same rule
-- (Though typically students only update their existing requests to 'accepted'/'rejected')
DROP POLICY IF EXISTS "Students can view and respond to their access requests" ON public.access_requests;

CREATE POLICY "Students can view and respond to their access requests"
ON public.access_requests FOR SELECT
USING (
    auth.uid() = student_id OR
    student_email = (auth.email())::text
);

CREATE POLICY "Students can update their access requests"
ON public.access_requests FOR UPDATE
USING (
    auth.uid() = student_id OR
    student_email = (auth.email())::text
)
WITH CHECK (
    auth.uid() = student_id OR
    student_email = (auth.email())::text
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
