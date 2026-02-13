-- Migration: Add pin_conversation function and pin column for ai_conversations
ALTER TABLE public.ai_conversations
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Create function to toggle pin status
CREATE OR REPLACE FUNCTION public.toggle_ai_conversation_pin(conv_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_status boolean;
BEGIN
    SELECT is_pinned INTO current_status
    FROM public.ai_conversations
    WHERE id = conv_id AND user_id = auth.uid();

    UPDATE public.ai_conversations
    SET is_pinned = NOT is_pinned
    WHERE id = conv_id AND user_id = auth.uid();

    RETURN NOT current_status;
END;
$$;
