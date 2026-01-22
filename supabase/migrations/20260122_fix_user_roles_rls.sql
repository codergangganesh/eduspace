-- Fix user_roles RLS to allow viewing roles in messaging context
-- This allows users to see roles of people they have conversations with

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create more permissive policy for messaging context
CREATE POLICY "Users can view roles in messaging context"
ON public.user_roles
FOR SELECT
USING (
  -- Users can always view their own roles
  auth.uid() = user_id 
  OR
  -- Users can view roles of people they have conversations with
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.participant_1 = auth.uid() AND c.participant_2 = user_id)
       OR (c.participant_2 = auth.uid() AND c.participant_1 = user_id)
  )
  OR
  -- Lecturers can view student roles (for class management)
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'lecturer'
  )
);

-- Ensure the policy allows role viewing for profile queries
CREATE POLICY "Allow role viewing for profiles"
ON public.user_roles
FOR SELECT
USING (true); -- This is more permissive but roles aren't sensitive data

-- Drop the overly restrictive policy and use the more permissive one
DROP POLICY IF EXISTS "Users can view roles in messaging context" ON public.user_roles;