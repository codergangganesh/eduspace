-- Enhance notifications table with sender tracking and action types
-- This migration adds fields needed for comprehensive bidirectional notifications

-- Add sender_id to track who triggered the notification
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id);

-- Add action_type for specific action tracking
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS action_type TEXT;

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

-- Add helpful comments
COMMENT ON COLUMN public.notifications.sender_id IS 'User who triggered this notification';
COMMENT ON COLUMN public.notifications.action_type IS 'Specific action: created, updated, submitted, accepted, rejected, etc.';

-- Update RLS policies to handle sender_id (policies already exist, just ensuring they work with new field)
-- No changes needed to existing policies as they filter by recipient_id
