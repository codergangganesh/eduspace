CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    device_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own tokens
CREATE POLICY "Users can manage their own FCM tokens"
ON public.fcm_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow service role access
CREATE POLICY "Service role can manage all FCM tokens"
ON public.fcm_tokens
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
