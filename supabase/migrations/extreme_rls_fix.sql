-- EXTREME FIX: Forcefully reset all call_sessions security
DO $$ 
DECLARE 
    pol record;
BEGIN
    -- Drop all policies on the table regardless of name
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'call_sessions' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.call_sessions', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS (should be already enabled)
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can see calls they participated in AND haven't hidden
CREATE POLICY "allow_select_own_calls" ON public.call_sessions
FOR SELECT TO authenticated
USING (
    (auth.uid() = caller_id AND is_hidden_by_caller = false) OR 
    (auth.uid() = receiver_id AND is_hidden_by_receiver = false)
);

-- 2. INSERT: Users can initiate calls
CREATE POLICY "allow_insert_own_calls" ON public.call_sessions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = caller_id);

-- 3. UPDATE: Users can modify their own calls (IMPORTANT: No is_hidden check here)
CREATE POLICY "allow_update_own_calls" ON public.call_sessions
FOR UPDATE TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- 4. DELETE: Not strictly needed since we hide, but good to have
CREATE POLICY "allow_delete_own_calls" ON public.call_sessions
FOR DELETE TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Confirm column defaults
ALTER TABLE public.call_sessions 
ALTER COLUMN is_hidden_by_caller SET DEFAULT false,
ALTER COLUMN is_hidden_by_receiver SET DEFAULT false;
