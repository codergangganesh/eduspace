-- Enhance notifications table with action tracking
-- This migration adds fields needed for comprehensive bidirectional notifications
-- Note: sender_id and recipient_id already exist from previous migrations

-- Add action_type for specific action tracking (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'action_type'
    ) THEN
        ALTER TABLE public.notifications 
        ADD COLUMN action_type TEXT;
    END IF;
END $$;

-- Update type constraint to include submission type
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('assignment', 'grade', 'announcement', 'message', 'schedule', 'access_request', 'submission', 'general'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON public.notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_action_type ON public.notifications(action_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Add helpful comments
COMMENT ON COLUMN public.notifications.sender_id IS 'User who triggered this notification';
COMMENT ON COLUMN public.notifications.action_type IS 'Specific action: created, updated, submitted, accepted, rejected, etc.';

-- Update RLS policies to use recipient_id (if they still use user_id)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = recipient_id);

-- Ensure system can create notifications (already exists but recreate to be safe)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);
