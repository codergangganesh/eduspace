-- ==============================================================================
-- EDUSPACE ADMIN PORTAL: COMPREHENSIVE POLICIES & AGGREGATION RPC FUNCTIONS
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Ensure status and role columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- 2. Auto-assign admin role in user_roles for admin accounts
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'mannamganeshbabu8@gmail.com' 
   OR email ILIKE '%admin%'
   OR (raw_user_meta_data->>'role') = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Robust is_admin() Security Definer Function
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Direct role check in user_roles table
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
    OR
    -- Direct role check in profiles table
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (user_id = auth.uid() OR id = auth.uid()) AND role = 'admin'
    )
    OR
    -- Email / metadata match
    (auth.jwt()->>'email' = 'mannamganeshbabu8@gmail.com')
    OR
    (auth.jwt()->>'email' ILIKE '%admin%')
    OR
    ((auth.jwt()->'user_metadata'->>'role') = 'admin')
    OR
    ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 3b. Helper function to pre-provision Dean / Admin accounts directly
DROP FUNCTION IF EXISTS public.provision_admin(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.provision_admin CASCADE;

CREATE OR REPLACE FUNCTION public.provision_admin(
  admin_email TEXT,
  admin_full_name TEXT DEFAULT 'Administrator',
  admin_department TEXT DEFAULT 'Administration'
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = admin_email;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User % does not exist in Auth. Create user in Supabase Auth first.', admin_email;
  END IF;

  INSERT INTO public.profiles (user_id, id, email, full_name, role, department, status, verified)
  VALUES (v_user_id, v_user_id, admin_email, admin_full_name, 'admin', admin_department, 'active', true)
  ON CONFLICT (user_id) DO UPDATE 
  SET role = 'admin', verified = true, status = 'active';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.provision_admin(TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 4. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_email TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- ==============================================================================
-- 5. Additive RLS Policies for Admin Role Across All Tables
-- ==============================================================================

-- user_roles
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
CREATE POLICY "Admins can update user roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.is_admin());

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile"
ON public.profiles FOR DELETE TO authenticated
USING (public.is_admin());

-- lecturer_profiles
DROP POLICY IF EXISTS "Admins can view all lecturer profiles" ON public.lecturer_profiles;
CREATE POLICY "Admins can view all lecturer profiles"
ON public.lecturer_profiles FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any lecturer profile" ON public.lecturer_profiles;
CREATE POLICY "Admins can update any lecturer profile"
ON public.lecturer_profiles FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any lecturer profile" ON public.lecturer_profiles;
CREATE POLICY "Admins can delete any lecturer profile"
ON public.lecturer_profiles FOR DELETE TO authenticated
USING (public.is_admin());

-- student_profiles
DROP POLICY IF EXISTS "Admins can view all student profiles" ON public.student_profiles;
CREATE POLICY "Admins can view all student profiles"
ON public.student_profiles FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any student profile" ON public.student_profiles;
CREATE POLICY "Admins can update any student profile"
ON public.student_profiles FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any student profile" ON public.student_profiles;
CREATE POLICY "Admins can delete any student profile"
ON public.student_profiles FOR DELETE TO authenticated
USING (public.is_admin());

-- class_students
DROP POLICY IF EXISTS "Admins can view all class students" ON public.class_students;
CREATE POLICY "Admins can view all class students"
ON public.class_students FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all class students" ON public.class_students;
CREATE POLICY "Admins can update all class students"
ON public.class_students FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all class students" ON public.class_students;
CREATE POLICY "Admins can delete all class students"
ON public.class_students FOR DELETE TO authenticated
USING (public.is_admin());

-- classes
DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
CREATE POLICY "Admins can view all classes"
ON public.classes FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all classes" ON public.classes;
CREATE POLICY "Admins can update all classes"
ON public.classes FOR UPDATE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all classes" ON public.classes;
CREATE POLICY "Admins can delete all classes"
ON public.classes FOR DELETE TO authenticated
USING (public.is_admin());

-- courses
DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
CREATE POLICY "Admins can view all courses"
ON public.courses FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all courses" ON public.courses;
CREATE POLICY "Admins can update all courses"
ON public.courses FOR UPDATE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all courses" ON public.courses;
CREATE POLICY "Admins can delete all courses"
ON public.courses FOR DELETE TO authenticated
USING (public.is_admin());

-- assignments
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.assignments;
CREATE POLICY "Admins can view all assignments"
ON public.assignments FOR SELECT TO authenticated
USING (public.is_admin());

-- assignment_submissions
DROP POLICY IF EXISTS "Admins can view all assignment submissions" ON public.assignment_submissions;
CREATE POLICY "Admins can view all assignment submissions"
ON public.assignment_submissions FOR SELECT TO authenticated
USING (public.is_admin());

-- quizzes
DROP POLICY IF EXISTS "Admins can view all quizzes" ON public.quizzes;
CREATE POLICY "Admins can view all quizzes"
ON public.quizzes FOR SELECT TO authenticated
USING (public.is_admin());

-- quiz_submissions
DROP POLICY IF EXISTS "Admins can view all quiz submissions" ON public.quiz_submissions;
CREATE POLICY "Admins can view all quiz submissions"
ON public.quiz_submissions FOR SELECT TO authenticated
USING (public.is_admin());

-- conversations
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations"
ON public.conversations FOR SELECT TO authenticated
USING (public.is_admin());

-- messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 5b. SECURITY DEFINER RPC Functions for Guaranteed Status & Role Mutations
-- ==============================================================================

DROP FUNCTION IF EXISTS public.admin_set_user_status(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_user_status(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_user_status(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_user_status() CASCADE;

CREATE OR REPLACE FUNCTION public.admin_set_user_status(
  target_user_id TEXT,
  new_status TEXT,
  target_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_uuid UUID;
BEGIN
  -- Verify caller is admin
  v_is_admin := public.is_admin();
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can update user status.';
  END IF;

  -- 1. Update profiles by user_id or id
  BEGIN
    v_uuid := target_user_id::UUID;
    UPDATE public.profiles
    SET status = new_status, updated_at = now()
    WHERE user_id = v_uuid OR id = v_uuid;

    UPDATE public.student_profiles
    SET status = new_status
    WHERE user_id = v_uuid OR id = v_uuid;

    UPDATE public.lecturer_profiles
    SET status = new_status
    WHERE user_id = v_uuid OR id = v_uuid;
  EXCEPTION WHEN OTHERS THEN
    -- In case target_user_id is not a valid UUID string
    NULL;
  END;

  -- 2. Update by email if provided
  IF target_email IS NOT NULL AND target_email <> '' AND target_email <> 'No email' THEN
    UPDATE public.profiles
    SET status = new_status, updated_at = now()
    WHERE email ILIKE target_email;

    UPDATE public.student_profiles
    SET status = new_status
    WHERE email ILIKE target_email;

    UPDATE public.lecturer_profiles
    SET status = new_status
    WHERE email ILIKE target_email;

    UPDATE public.class_students
    SET status = new_status
    WHERE email ILIKE target_email;
  END IF;

  -- 3. Notifications handling
  IF new_status = 'suspended' AND v_uuid IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, sender_id, title, message, type, action_type, created_at)
    VALUES (
      v_uuid,
      v_caller,
      'ACCOUNT_SUSPENDED',
      'Your account has been suspended by an administrator. Please contact your institution.',
      'general',
      'suspended',
      now()
    );
  ELSIF new_status = 'active' AND v_uuid IS NOT NULL THEN
    DELETE FROM public.notifications
    WHERE recipient_id = v_uuid AND title = 'ACCOUNT_SUSPENDED';
  END IF;

  -- 4. Audit Log
  INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, target_email, details)
  VALUES (
    COALESCE(v_caller, '00000000-0000-0000-0000-000000000000'::UUID),
    CASE WHEN new_status = 'suspended' THEN 'suspend_user' ELSE 'activate_user' END,
    v_uuid,
    target_email,
    jsonb_build_object('new_status', new_status, 'updated_at', now())
  );

  RETURN jsonb_build_object('success', true, 'status', new_status, 'user_id', target_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_status(TEXT, TEXT, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_set_user_role(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_user_role(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_user_role(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_user_role() CASCADE;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  target_user_id TEXT,
  new_role TEXT,
  target_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_uuid UUID;
  v_app_role app_role;
BEGIN
  v_is_admin := public.is_admin();
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can modify user roles.';
  END IF;

  v_app_role := new_role::app_role;
  v_uuid := target_user_id::UUID;

  -- Upsert user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uuid, v_app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = v_app_role;

  -- Update profiles role column
  UPDATE public.profiles
  SET role = new_role, updated_at = now()
  WHERE user_id = v_uuid OR id = v_uuid;

  IF target_email IS NOT NULL AND target_email <> '' THEN
    UPDATE public.profiles
    SET role = new_role, updated_at = now()
    WHERE email ILIKE target_email;
  END IF;

  -- Audit log
  INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, target_email, details)
  VALUES (
    COALESCE(v_caller, '00000000-0000-0000-0000-000000000000'::UUID),
    'change_role',
    v_uuid,
    target_email,
    jsonb_build_object('new_role', new_role, 'updated_at', now())
  );

  RETURN jsonb_build_object('success', true, 'role', new_role, 'user_id', target_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(TEXT, TEXT, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_delete_user_records(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_user_records(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_user_records() CASCADE;

CREATE OR REPLACE FUNCTION public.admin_delete_user_records(
  target_user_id TEXT,
  target_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_uuid UUID;
BEGIN
  v_is_admin := public.is_admin();
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can delete users.';
  END IF;

  BEGIN
    v_uuid := target_user_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_uuid := NULL;
  END;

  IF v_uuid IS NOT NULL THEN
    DELETE FROM public.class_students WHERE student_id = v_uuid OR id = v_uuid;
    DELETE FROM public.student_profiles WHERE user_id = v_uuid OR id = v_uuid;
    DELETE FROM public.lecturer_profiles WHERE user_id = v_uuid OR id = v_uuid;
    DELETE FROM public.user_roles WHERE user_id = v_uuid;
    DELETE FROM public.profiles WHERE user_id = v_uuid OR id = v_uuid;
  END IF;

  IF target_email IS NOT NULL AND target_email <> '' AND target_email <> 'No email' THEN
    DELETE FROM public.class_students WHERE email ILIKE target_email;
    DELETE FROM public.student_profiles WHERE email ILIKE target_email;
    DELETE FROM public.lecturer_profiles WHERE email ILIKE target_email;
    DELETE FROM public.profiles WHERE email ILIKE target_email;
  END IF;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, target_email, details)
  VALUES (
    COALESCE(v_caller, '00000000-0000-0000-0000-000000000000'::UUID),
    'delete_user',
    v_uuid,
    target_email,
    jsonb_build_object('deleted_at', now())
  );

  RETURN jsonb_build_object('success', true, 'deleted_user_id', target_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user_records(TEXT, TEXT) TO authenticated;

-- notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- user_activity_log
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.user_activity_log;
CREATE POLICY "Admins can view all activity logs"
ON public.user_activity_log FOR SELECT TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 6. RPC FUNCTION: Instant Live Dashboard Statistics (Security Definer)
-- ==============================================================================

DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats CASCADE;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_students INT := 0;
  v_active_students INT := 0;
  v_suspended_students INT := 0;
  v_total_lecturers INT := 0;
  v_active_lecturers INT := 0;
  v_total_admins INT := 0;
  v_total_courses INT := 0;
  v_total_classes INT := 0;
  v_total_assignments INT := 0;
  v_total_quizzes INT := 0;
  v_total_messages INT := 0;
  v_new_users_30d INT := 0;
  v_user_distribution JSONB;
  v_activity_summary JSONB;
  v_user_growth JSONB;
  v_recent_activity JSONB;
  v_submissions JSONB := '[]'::jsonb;
  v_quizzes JSONB := '[]'::jsonb;
  v_new_users JSONB := '[]'::jsonb;
BEGIN
  -- Count user roles
  SELECT COUNT(DISTINCT user_id) INTO v_total_students
  FROM public.user_roles WHERE role = 'student';

  SELECT COUNT(DISTINCT user_id) INTO v_total_lecturers
  FROM public.user_roles WHERE role = 'lecturer';

  SELECT COUNT(DISTINCT user_id) INTO v_total_admins
  FROM public.user_roles WHERE role = 'admin';

  -- Fallbacks from profiles if user_roles has missing entries
  IF v_total_students = 0 THEN
    SELECT COUNT(*) INTO v_total_students FROM public.profiles;
    IF v_total_students > v_total_lecturers THEN
      v_total_students := v_total_students - v_total_lecturers - GREATEST(v_total_admins, 1);
    END IF;
    IF v_total_students < 0 THEN v_total_students := 0; END IF;
  END IF;

  IF v_total_lecturers = 0 THEN
    SELECT COUNT(DISTINCT lecturer_id) INTO v_total_lecturers FROM public.classes;
    IF v_total_lecturers = 0 THEN
      SELECT COUNT(*) INTO v_total_lecturers FROM public.lecturer_profiles;
    END IF;
  END IF;

  IF v_total_admins = 0 THEN
    v_total_admins := 1;
  END IF;

  -- Active vs Suspended counts
  SELECT COUNT(*) INTO v_suspended_students
  FROM public.profiles WHERE status = 'suspended';

  v_active_students := GREATEST(v_total_students - v_suspended_students, 0);
  v_active_lecturers := v_total_lecturers;

  -- Counts for platform entities
  SELECT COUNT(*) INTO v_total_courses FROM public.courses;
  SELECT COUNT(*) INTO v_total_classes FROM public.classes;
  SELECT COUNT(*) INTO v_total_assignments FROM public.assignments;
  SELECT COUNT(*) INTO v_total_quizzes FROM public.quizzes;
  SELECT COUNT(*) INTO v_total_messages FROM public.messages;

  SELECT COUNT(*) INTO v_new_users_30d
  FROM public.profiles
  WHERE created_at >= (now() - interval '30 days');

  -- User distribution array
  v_user_distribution := jsonb_build_array(
    jsonb_build_object('name', 'Students', 'value', v_total_students, 'color', '#3b82f6'),
    jsonb_build_object('name', 'Lecturers', 'value', v_total_lecturers, 'color', '#10b981'),
    jsonb_build_object('name', 'Administrators', 'value', v_total_admins, 'color', '#8b5cf6')
  );

  IF v_suspended_students > 0 THEN
    v_user_distribution := v_user_distribution || jsonb_build_array(
      jsonb_build_object('name', 'Suspended', 'value', v_suspended_students, 'color', '#ef4444')
    );
  END IF;

  -- Activity summary array
  v_activity_summary := jsonb_build_array(
    jsonb_build_object('name', 'Assignments', 'count', v_total_assignments),
    jsonb_build_object('name', 'Quizzes', 'count', v_total_quizzes),
    jsonb_build_object('name', 'Courses', 'count', v_total_courses),
    jsonb_build_object('name', 'Classes', 'count', v_total_classes)
  );

  -- User growth trends (last 6 months)
  SELECT jsonb_agg(month_data) INTO v_user_growth
  FROM (
    SELECT 
      to_char(date_trunc('month', d), 'Mon') AS date,
      COUNT(p.id) AS total,
      COUNT(p.id) FILTER (WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'lecturer')) AS students,
      COUNT(p.id) FILTER (WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'lecturer')) AS lecturers
    FROM generate_series(
      date_trunc('month', now() - interval '5 months'),
      date_trunc('month', now()),
      interval '1 month'
    ) d
    LEFT JOIN public.profiles p ON date_trunc('month', p.created_at) = d
    GROUP BY d
    ORDER BY d
  ) month_data;

  IF v_user_growth IS NULL THEN
    v_user_growth := '[]'::jsonb;
  END IF;

  -- Recent activity items
  SELECT jsonb_agg(sub) INTO v_submissions
  FROM (
    SELECT id, submitted_at, student_id
    FROM public.assignment_submissions
    ORDER BY submitted_at DESC
    LIMIT 5
  ) sub;

  SELECT jsonb_agg(qz) INTO v_quizzes
  FROM (
    SELECT id, title, created_at, class_id
    FROM public.quizzes
    ORDER BY created_at DESC
    LIMIT 5
  ) qz;

  SELECT jsonb_agg(usr) INTO v_new_users
  FROM (
    SELECT user_id, full_name, email, created_at
    FROM public.profiles
    ORDER BY created_at DESC
    LIMIT 5
  ) usr;

  v_recent_activity := jsonb_build_object(
    'submissions', COALESCE(v_submissions, '[]'::jsonb),
    'quizzes', COALESCE(v_quizzes, '[]'::jsonb),
    'newUsers', COALESCE(v_new_users, '[]'::jsonb)
  );

  -- Build final output object
  RETURN jsonb_build_object(
    'totalStudents', v_total_students,
    'activeStudents', v_active_students,
    'suspendedStudents', v_suspended_students,
    'totalLecturers', v_total_lecturers,
    'activeLecturers', v_active_lecturers,
    'totalAdmins', v_total_admins,
    'totalCourses', v_total_courses,
    'totalClasses', v_total_classes,
    'totalAssignments', v_total_assignments,
    'totalQuizzes', v_total_quizzes,
    'totalMessages', v_total_messages,
    'newUsersLast30Days', v_new_users_30d,
    'userGrowth', v_user_growth,
    'userDistribution', v_user_distribution,
    'activitySummary', v_activity_summary,
    'recentActivity', v_recent_activity
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated, anon;

-- Helper to fetch platform maintenance mode securely across all user roles
CREATE OR REPLACE FUNCTION public.get_maintenance_status()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT details
  FROM public.admin_audit_logs
  WHERE action = 'SET_MAINTENANCE_MODE'
  ORDER BY created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_maintenance_status() TO authenticated, anon;
