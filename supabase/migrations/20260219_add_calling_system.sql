-- =====================================================
-- Call System Migration
-- Adds institution_id, call_sessions table, and policies
-- =====================================================

-- 1. Add institution_id to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'institution_id'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN institution_id UUID DEFAULT gen_random_uuid(); 
        -- Using a random UUID as default so existing users get assigned *something*, 
        -- but ideally this should be set properly. 
        -- For now, this allows strict equality checks (everyone gets their own unless updated).
        -- Wait, if everyone gets a random one, nobody can call anyone.
        -- Let's set a default '00000000-0000-0000-0000-000000000000' for existing users so they are in the same 'default' institution.
        
        ALTER TABLE public.profiles 
        ALTER COLUMN institution_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
        
        UPDATE public.profiles SET institution_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE institution_id IS NULL;
    END IF;
END $$;

-- 2. Create Call Sessions Table
CREATE TYPE call_status AS ENUM ('initiated', 'ringing', 'accepted', 'rejected', 'completed', 'missed', 'cancelled', 'failed');
CREATE TYPE call_type AS ENUM ('audio', 'video');

CREATE TABLE IF NOT EXISTS public.call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL, -- To enforce institution boundary
    status call_status NOT NULL DEFAULT 'initiated',
    call_type call_type NOT NULL DEFAULT 'video',
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    duration INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Policies
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view calls where they are caller or receiver
CREATE POLICY "Users can view their own calls"
ON public.call_sessions
FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Only logic (Edge Function) should insert, but if we allow client insert (with RLS checks):
-- Allow insert if users match and institution matches
CREATE POLICY "Users can initiate calls within institution"
ON public.call_sessions
FOR INSERT
WITH CHECK (
    auth.uid() = caller_id AND
    EXISTS (
        SELECT 1 FROM public.profiles receiver
        WHERE receiver.user_id = call_sessions.receiver_id
        AND receiver.institution_id = (
            SELECT institution_id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
);

-- Users can update status of their own calls (e.g. answer, end)
CREATE POLICY "Users can update their own calls"
ON public.call_sessions
FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON public.call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_receiver ON public.call_sessions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON public.call_sessions(status);
