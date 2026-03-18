-- Allow users to delete their own notifications
-- This is needed for the "Clear All" functionality in the frontend

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = recipient_id);

-- Also ensure they can delete by user_id if that column name is used based on early schema
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'user_id'
    ) THEN
        -- Add a similar policy but don't conflict with name
        DROP POLICY IF EXISTS "Users can delete their own notifications v2" ON public.notifications;
        CREATE POLICY "Users can delete their own notifications v2"
        ON public.notifications FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END $$;
