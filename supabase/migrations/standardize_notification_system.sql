-- DEFINITIVE FIX FOR RELATED_ID TYPE MISMATCH (UUID vs TEXT)
-- This migration:
-- 1. Drops the problematic triggers
-- 2. Ensures related_id in notifications is TEXT to support composite IDs (flexible)
-- 3. Re-implements the trigger using TEXT-safe operations

-- Part 1: Convert related_id to TEXT if it was changed to UUID
DO $$ 
BEGIN
    -- Only alter if it's currently UUID
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'related_id' 
        AND data_type = 'uuid'
    ) THEN
        -- Drop dependent indexes first
        DROP INDEX IF EXISTS public.idx_unique_notification_per_event;
        
        -- Alter column type
        ALTER TABLE public.notifications ALTER COLUMN related_id TYPE TEXT;
        
        -- Re-create the unique index
        CREATE UNIQUE INDEX idx_unique_notification_per_event
        ON public.notifications (recipient_id, related_id, type)
        WHERE related_id IS NOT NULL;
    END IF;
END $$;

-- Part 2: Drop existing triggers
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

-- Part 3: Re-implement Trigger Function with TEXT related_id
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    recipient_prefs RECORD;
    message_preview TEXT;
    notif_related_id TEXT;
BEGIN
    -- 1. Self-message check
    IF NEW.sender_id = NEW.receiver_id THEN
        RETURN NEW;
    END IF;

    -- 2. Preferences check
    SELECT message_notifications, notifications_enabled
    INTO recipient_prefs
    FROM public.profiles
    WHERE user_id = NEW.receiver_id;

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

    -- 5. Use Message ID as the related_id (Casted to TEXT for safety)
    notif_related_id := NEW.id::text;

    -- 6. Insert with Conflict Handling
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
        notif_related_id,
        'sent',
        false
    )
    ON CONFLICT (recipient_id, related_id, type) 
    WHERE related_id IS NOT NULL 
    DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 4: Re-apply Trigger
CREATE TRIGGER on_new_message_notification_v3
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message_notification();

-- Ensure index stability
DROP INDEX IF EXISTS public.idx_unique_notification_per_event;
CREATE UNIQUE INDEX idx_unique_notification_per_event
ON public.notifications (recipient_id, related_id, type)
WHERE related_id IS NOT NULL;

COMMENT ON FUNCTION public.handle_new_message_notification IS 'Optimized message notification trigger with UUID/TEXT compatibility.';
