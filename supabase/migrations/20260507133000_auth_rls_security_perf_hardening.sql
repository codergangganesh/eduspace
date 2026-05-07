-- Harden auth role bootstrap, restore RLS on exposed tables, and add
-- high-signal indexes for the current app query patterns.

-- 1. Stop auth metadata from minting arbitrary roles during signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  requested_role := CASE
    WHEN lower(COALESCE(NEW.raw_user_meta_data ->> 'role', '')) = 'lecturer'
      THEN 'lecturer'::public.app_role
    ELSE 'student'::public.app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Reduce direct RPC exposure for internal trigger/helper functions.
ALTER FUNCTION public.link_student_to_email_records() SET search_path = public;
ALTER FUNCTION public.populate_lecturer_metadata() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.link_student_to_email_records() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.populate_lecturer_metadata() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3. Views in public should respect caller RLS instead of view-owner privileges.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname = 'class_all_students'
  ) THEN
    EXECUTE 'ALTER VIEW public.class_all_students SET (security_invoker = true)';
  END IF;
END
$$;

-- 4. Re-enable RLS on exposed tables with policies that match the current app.
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- access_requests: keep current sender/student workflows, but scope to authenticated users.
DROP POLICY IF EXISTS "Lecturers can manage access requests for their classes" ON public.access_requests;
DROP POLICY IF EXISTS "Students can view and respond to their access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Students can update their access requests" ON public.access_requests;

CREATE POLICY "Lecturers can manage access requests for their classes"
ON public.access_requests
FOR ALL
TO authenticated
USING (auth.uid() = lecturer_id)
WITH CHECK (auth.uid() = lecturer_id);

CREATE POLICY "Students can view their access requests"
ON public.access_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id
  OR lower(student_email) = lower(auth.email())
);

CREATE POLICY "Students can update their access requests"
ON public.access_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = student_id
  OR lower(student_email) = lower(auth.email())
)
WITH CHECK (
  auth.uid() = student_id
  OR lower(student_email) = lower(auth.email())
);

-- course_enrollments: remove global readability and restore owner/student visibility.
DROP POLICY IF EXISTS "Enrollments are viewable by everyone" ON public.course_enrollments;
DROP POLICY IF EXISTS "Lecturers can manage enrollments for their courses" ON public.course_enrollments;
DROP POLICY IF EXISTS "Lecturers can view enrollments for their courses" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.course_enrollments;

CREATE POLICY "Lecturers can manage enrollments for their courses"
ON public.course_enrollments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.courses c
    WHERE c.id = course_enrollments.course_id
      AND c.lecturer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.courses c
    WHERE c.id = course_enrollments.course_id
      AND c.lecturer_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own enrollments"
ON public.course_enrollments
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- invitations: only the inviter or the invited email owner may see rows.
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "Lecturers can send invitations" ON public.invitations;
DROP POLICY IF EXISTS "Lecturers can update their own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Lecturers can view their own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can update own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Users can view own invitations" ON public.invitations;

CREATE POLICY "Inviters can manage their own invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (invited_by = auth.uid())
WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Recipients can view their own invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid()
  OR lower(email) = lower(auth.email())
);

-- user_roles: keep role reads behind authentication instead of exposing them publicly.
DROP POLICY IF EXISTS "Allow role viewing for profiles" ON public.user_roles;

CREATE POLICY "Authenticated users can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- 5. Add high-value indexes for the app's real query patterns.
CREATE INDEX IF NOT EXISTS idx_access_requests_lecturer_id
  ON public.access_requests(lecturer_id);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_2_last_message_at
  ON public.conversations(participant_2, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id
  ON public.course_enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id
  ON public.course_enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
  ON public.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON public.messages(receiver_id, conversation_id)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_role_user_id
  ON public.user_roles(role, user_id);

-- 6. Remove known duplicate indexes that the performance advisor flagged.
DROP INDEX IF EXISTS public.unique_pending_invitation_per_email;
