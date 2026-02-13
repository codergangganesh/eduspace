-- Migration: Add sharing functionality to AI Conversations
ALTER TABLE public.ai_conversations
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT NULL;

-- Create an index to look up share tokens quickly
CREATE INDEX IF NOT EXISTS idx_ai_conversations_share_token ON public.ai_conversations(share_token);

-- Update RLS policies to allow public selection via share_token
DROP POLICY IF EXISTS "Anyone can view shared AI conversations" ON public.ai_conversations;
CREATE POLICY "Anyone can view shared AI conversations"
    ON public.ai_conversations FOR SELECT
    USING (share_token IS NOT NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view messages in shared AI conversations" ON public.ai_messages;
CREATE POLICY "Anyone can view messages in shared AI conversations"
    ON public.ai_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.ai_conversations
        WHERE id = ai_messages.conversation_id
        AND (share_token IS NOT NULL OR user_id = auth.uid())
    ));

-- Create function to toggle sharing
CREATE OR REPLACE FUNCTION public.toggle_ai_conversation_share(conv_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_token UUID;
BEGIN
    -- Check if conversation belongs to the user
    IF NOT EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conv_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- If already shared, unshare (set token to NULL)
    -- If not shared, generate new UUID as token
    SELECT 
        CASE 
            WHEN share_token IS NULL THEN gen_random_uuid() 
            ELSE NULL 
        END INTO new_token
    FROM public.ai_conversations
    WHERE id = conv_id;

    UPDATE public.ai_conversations
    SET share_token = new_token
    WHERE id = conv_id;

    RETURN new_token;
END;
$$;
