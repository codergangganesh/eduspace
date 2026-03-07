-- Allow authenticated users to set their own initial role during OAuth onboarding
-- but block privilege escalation to admin through client-side inserts.
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;

CREATE POLICY "Users can insert their own role on signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('student', 'lecturer')
);
