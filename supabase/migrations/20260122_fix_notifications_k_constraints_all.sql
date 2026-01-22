-- Fix notifications table foreign key constraints for sender_id and recipient_id
-- The existing constraints incorrectly reference profiles.id instead of profiles.user_id
-- This causes inserts to fail when using auth.users.id

DO $$ 
BEGIN
    -- 1. Fix sender_id FK
    -- Drop existing incorrect constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_sender_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_sender_id_fkey;
    END IF;

    -- Add correct constraint if column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'sender_id'
    ) THEN
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_sender_id_fkey
        FOREIGN KEY (sender_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE;
    END IF;

    -- 2. Fix recipient_id FK (Re-applying or ensuring it is correct)
    -- Drop existing incorrect constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_recipient_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_recipient_id_fkey;
    END IF;

    -- Add correct constraint if column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_recipient_id_fkey
        FOREIGN KEY (recipient_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE;
    END IF;

END $$;
