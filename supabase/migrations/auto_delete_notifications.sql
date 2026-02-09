-- Migration: Auto-delete notifications after 7 days
-- This script sets up a background task to keep the notifications table clean.

-- 1. Create the function that performs the deletion
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- 2. Schedule the task using pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule test job if it exists
DO $$
BEGIN
    PERFORM cron.unschedule('test-auto-delete-notifications');
    PERFORM cron.unschedule('auto-delete-notifications');
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Schedule the job to run EVERY DAY at Midnight (00:00)
SELECT cron.schedule(
  'auto-delete-notifications', 
  '0 0 * * *', 
  'SELECT delete_old_notifications()'
);
