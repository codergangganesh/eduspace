-- DEFINITIVE FIX FOR NOTIFICATIONS
-- 1. Sets up the Trigger for automatic notification creation (using composite ID for uniqueness).
-- 2. Enforces Unique Index to prevent duplicates.

-- Part 1: Clean up old objects to ensure no conflicts
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
DROP FUNCTION IF EXISTS public.handle_new_message_notification();
-- We don't drop the table, but we clean up potential duplicates before indexing
DELETE FROM public.notifications n1
USING public.notifications n2
WHERE n1.id > n2.id 
  AND n1.recipient_id = n2.recipient_id
  AND n1.related_id = n2.related_id
  AND n1.type = n2.type
  AND n1.related_id IS NOT NULL;

-- Part 2: Create valid composite-key Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    recipient_prefs RECORD;
    message_preview TEXT;
    composite_id TEXT;
BEGIN
    -- Self-message check
    IF NEW.sender_id = NEW.receiver_id THEN
        RETURN NEW;
    END IF;

    -- Preferences check
    SELECT message_notifications, push_notifications 
    INTO recipient_prefs
    FROM public.profiles
    WHERE user_id = NEW.receiver_id;

    IF (recipient_prefs.message_notifications IS FALSE) THEN
        RETURN NEW;
    END IF;

    -- Sender Name
    SELECT full_name INTO sender_name
    FROM public.profiles
    WHERE user_id = NEW.sender_id;

    IF sender_name IS NULL THEN
        sender_name := 'Someone';
    END IF;

    -- Preview
    IF NEW.content IS NULL OR length(NEW.content) = 0 THEN
        IF NEW.attachment_url IS NOT NULL THEN
            message_preview := 'Sent an attachment';
        ELSE
            message_preview := 'Sent a message';
        END IF;
    ELSE
        IF length(NEW.content) > 100 THEN
            message_preview := substring(NEW.content from 1 for 100) || '...';
        ELSE
            message_preview := NEW.content;
        END IF;
    END IF;

    -- COMPOSITE ID: conversation_id:message_id
    composite_id := NEW.conversation_id::text || ':' || NEW.id::text;

    -- Insert
    INSERT INTO public.notifications (
        recipient_id,
        sender_id,
        title,
        message,
        type,
        related_id,
        action_type,
        is_read
    ) VALUES (
        NEW.receiver_id,
        NEW.sender_id,
        'New message from ' || sender_name,
        message_preview,
        'message',
        composite_id,
        'sent',
        false
    )
    ON CONFLICT DO NOTHING; -- Gracefully handle specific race conditions if any

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 3: Apply Trigger
CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message_notification();

-- Part 4: Enforce Unique Index (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_notification_per_event
ON public.notifications (recipient_id, related_id, type)
WHERE related_id IS NOT NULL;
