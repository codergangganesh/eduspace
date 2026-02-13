-- Migration: Auto-delete AI chats after 10 days
-- This script sets up a background task to keep the ai_conversations table clean.

-- 1. Create the function that performs the deletion
CREATE OR REPLACE FUNCTION public.delete_old_ai_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We delete from ai_conversations. ON DELETE CASCADE will handle ai_messages.
  DELETE FROM public.ai_conversations
  WHERE updated_at < NOW() - INTERVAL '10 days';
END;
$$;

-- 2. Schedule the task using pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule existing job if it exists to avoid duplicates
DO $$
BEGIN
    PERFORM cron.unschedule('auto-delete-ai-chats');
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Schedule the job to run EVERY DAY at 01:00 AM
SELECT cron.schedule(
  'auto-delete-ai-chats', 
  '0 1 * * *', 
  'SELECT public.delete_old_ai_chats()'
);
