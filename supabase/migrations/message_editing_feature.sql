-- Add message editing fields
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- Create RPC function for secure message editing
CREATE OR REPLACE FUNCTION public.edit_message(
    message_id UUID,
    new_content TEXT,
    editing_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    msg RECORD;
BEGIN
    -- Fetch message
    SELECT * INTO msg FROM public.messages WHERE id = message_id;

    -- Check existence
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Message not found');
    END IF;

    -- Check ownership
    IF msg.sender_id != editing_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Check time limit (5 minutes)
    IF msg.created_at < (NOW() - INTERVAL '5 minutes') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Edit time limit exceeded');
    END IF;

    -- Check edit count limit (Max 2)
    IF msg.edit_count >= 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Edit count limit exceeded');
    END IF;

    -- Perform update
    UPDATE public.messages
    SET 
        content = new_content,
        is_edited = true,
        edit_count = edit_count + 1,
        last_edited_at = NOW()
    WHERE id = message_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
