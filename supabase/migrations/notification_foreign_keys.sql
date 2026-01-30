-- Fix notifications table foreign key constraint
-- The existing constraint notifications_recipient_id_fkey incorrectly references profiles.id instead of profiles.user_id
-- This causes inserts to fail when using auth.users.id (which matches profiles.user_id but not profiles.id)

DO $$ 
BEGIN
    -- Only proceed if the table and constraint exist/need fixing
    -- We'll try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_recipient_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_recipient_id_fkey;
    END IF;

    -- Add the correct constraint referencing profiles(user_id)
    -- We assume the column is named 'recipient_id' based on the error message
    -- If the column is 'user_id', we might need to adjust, but the error specified 'recipient_id'
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

    -- If the column is named 'user_id' but the constraint was named 'notifications_recipient_id_fkey' (unlikely but possible)
    -- We handle that case too just to be safe if 'recipient_id' doesn't exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'user_id'
        AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'recipient_id'
        )
    ) THEN
        -- Check if we need to fix a constraint on user_id
        -- We won't blindly add it, usually user_id references auth.users
    END IF;

END $$;
