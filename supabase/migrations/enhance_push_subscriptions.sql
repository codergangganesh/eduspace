-- Enhance push_subscriptions table with notification_enabled toggle
-- This allows users to disable push without deleting their subscription

-- Add notification_enabled column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'push_subscriptions' 
        AND column_name = 'notification_enabled'
    ) THEN
        ALTER TABLE public.push_subscriptions
        ADD COLUMN notification_enabled BOOLEAN DEFAULT true NOT NULL;
    END IF;
END $$;

-- Add index for faster queries on enabled subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled 
ON public.push_subscriptions(user_id, notification_enabled) 
WHERE notification_enabled = true;

-- Add policy for users to update their own subscription settings
DROP POLICY IF EXISTS "Users can update their own subscription settings" ON public.push_subscriptions;
CREATE POLICY "Users can update their own subscription settings"
ON public.push_subscriptions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.push_subscriptions.notification_enabled IS 
'Controls whether push notifications are sent to this subscription. When false, subscription is kept but no pushes are delivered.';

-- Function to automatically disable expired subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_push_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function can be called by a cron job to clean up old subscriptions
    -- For now, we rely on the Edge Function to clean up 410/404 responses
    DELETE FROM public.push_subscriptions
    WHERE updated_at < NOW() - INTERVAL '90 days';
END;
$$;

COMMENT ON FUNCTION cleanup_expired_push_subscriptions() IS 
'Removes push subscriptions that have not been updated in 90 days. Should be called periodically via cron.';
