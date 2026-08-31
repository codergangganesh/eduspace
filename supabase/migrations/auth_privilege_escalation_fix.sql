-- ==============================================================================
-- EDUSPACE SECURITY HARDENING: PRIVILEGE ESCALATION & AUTHORIZATION FIX
-- Run this in your Supabase Dashboard -> SQL Editor (or via CLI migrations)
-- ==============================================================================

-- 1. Ensure primary administrator account is present in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'mannamganeshbabu8@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Harden the public signup trigger: handle_new_user()
-- Guarantees that public self-signups can ONLY ever receive 'student' or 'lecturer' roles.
-- Any client-side attempt to inject 'admin' in user_metadata is safely neutralized.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_requested_role TEXT;
  v_final_role app_role;
BEGIN
  -- Extract requested role from raw_user_meta_data safely
  v_requested_role := lower(COALESCE(new.raw_user_meta_data ->> 'role', 'student'));

  -- Enforce strict role restriction: self-signup is limited to student or lecturer.
  IF v_requested_role = 'lecturer' THEN
    v_final_role := 'lecturer'::app_role;
  ELSE
    v_final_role := 'student'::app_role;
  END IF;

  -- 1. Insert or update base profile
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    v_final_role::text
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;

  -- 2. Insert into authoritative user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_final_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;

-- Ensure trigger is active on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Harden is_admin() Security Definer Function
-- Removes arbitrary email substring checks (e.g. ILIKE '%admin%') and client-controlled user_metadata.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Direct role check in authoritative user_roles table
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
    OR
    -- Direct role check in profiles table (if assigned by admin)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (user_id = auth.uid() OR id = auth.uid()) AND role = 'admin'
    )
    OR
    -- Verified primary owner account override
    (auth.jwt()->>'email' = 'mannamganeshbabu8@gmail.com')
    OR
    -- Supabase service role token (Edge Functions / Cron)
    (auth.jwt()->>'role' = 'service_role')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
