-- MASTER FIX FOR DUPLICATE NOTIFICATION ERROR
-- This migration:
-- 1. Drops any conflicting triggers on the messages table
-- 2. Cleanly re-implements the notification trigger with a unique composite ID
-- 3. Corrects the unique constraint and ensures ON CONFLICT works with partial indexes

-- Part 1: Remove all potential conflicting triggers on messages
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
        AND event_object_table = 'messages'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.messages';
    END LOOP;
END $$;

-- Part 2: Re-implement the Trigger Function with explicit ON CONFLICT mapping
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    recipient_prefs RECORD;
    message_preview TEXT;
    composite_id TEXT;
BEGIN
    -- 1. Self-message check
    IF NEW.sender_id = NEW.receiver_id THEN
        RETURN NEW;
    END IF;

    -- 2. Preferences check
    SELECT message_notifications, push_notifications, notifications_enabled
    INTO recipient_prefs
    FROM public.profiles
    WHERE user_id = NEW.receiver_id;

    -- If global or message notifications are explicitly disabled, stop
    IF (recipient_prefs.notifications_enabled IS FALSE) OR (recipient_prefs.message_notifications IS FALSE) THEN
        RETURN NEW;
    END IF;

    -- 3. Fetch Sender Name
    SELECT full_name INTO sender_name
    FROM public.profiles
    WHERE user_id = NEW.sender_id;

    IF sender_name IS NULL THEN
        sender_name := 'Someone';
    END IF;

    -- 4. Create Preview
    IF NEW.content IS NULL OR length(trim(NEW.content)) = 0 THEN
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

    -- 5. UNIQUE COMPOSITE ID (Ensures one notification per specific message)
    -- Format: conv_UUID:msg_UUID
    composite_id := NEW.conversation_id::text || ':' || NEW.id::text;

    -- 6. Insert with EXPLICIT conflict target for partial index
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
    ON CONFLICT (recipient_id, related_id, type) 
    WHERE related_id IS NOT NULL 
    DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 3: Apply NEW Trigger
CREATE TRIGGER on_new_message_notification_v2
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message_notification();

-- Part 4: Cleanup & Re-index
-- Remove duplicates that match our index criteria
DELETE FROM public.notifications n1
USING public.notifications n2
WHERE n1.id > n2.id 
  AND n1.recipient_id = n2.recipient_id
  AND n1.related_id = n2.related_id
  AND n1.type = n2.type
  AND n1.related_id IS NOT NULL;

-- Ensure the Unique Partial Index exists and is correctly defined
DROP INDEX IF EXISTS public.idx_unique_notification_per_event;
CREATE UNIQUE INDEX idx_unique_notification_per_event
ON public.notifications (recipient_id, related_id, type)
WHERE related_id IS NOT NULL;

-- Comment for clarity
COMMENT ON FUNCTION public.handle_new_message_notification IS 'Automatically creates notifications for new messages with conflict prevention.';
