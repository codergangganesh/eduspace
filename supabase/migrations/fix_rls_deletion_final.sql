-- Migration to fix RLS violation when hiding call history records
-- The error "new row violates row-level security policy" occurs when a user updates 
-- a record to a state where it no longer satisfies the visibility (SELECT) policy 
-- OR the current UPDATE policy.

-- 1. Redefine the UPDATE policy to ensure users can set the is_hidden flags 
-- without violating the security check for the "new row".
DROP POLICY IF EXISTS "Users can update their own calls" ON public.call_sessions;

CREATE POLICY "Users can update their own calls"
ON public.call_sessions
FOR UPDATE
TO authenticated
USING (
    auth.uid() = caller_id OR 
    auth.uid() = receiver_id
)
WITH CHECK (
    auth.uid() = caller_id OR 
    auth.uid() = receiver_id
);

-- 2. Redefine the SELECT policy to ensure it remains focused on visibility
DROP POLICY IF EXISTS "Users can view their own calls" ON public.call_sessions;

CREATE POLICY "Users can view their own calls"
ON public.call_sessions
FOR SELECT
TO authenticated
USING (
    (auth.uid() = caller_id AND is_hidden_by_caller = false) OR 
    (auth.uid() = receiver_id AND is_hidden_by_receiver = false)
);

-- 3. Ensure columns have the correct defaults so the policies don't fail on nulls
ALTER TABLE public.call_sessions 
ALTER COLUMN is_hidden_by_caller SET NOT NULL,
ALTER COLUMN is_hidden_by_caller SET DEFAULT false,
ALTER COLUMN is_hidden_by_receiver SET NOT NULL,
ALTER COLUMN is_hidden_by_receiver SET DEFAULT false;
