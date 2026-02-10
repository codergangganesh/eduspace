-- Migration: Add individual auto-delete messages feature
-- 1. Add auto_delete_settings column to conversations table (replacing previous boolean if any)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'auto_delete_enabled') THEN
        ALTER TABLE public.conversations DROP COLUMN auto_delete_enabled;
    END IF;
END $$;

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS auto_delete_settings JSONB DEFAULT '{}'::jsonb;

-- 2. Create function to delete old messages from DB (ONLY if both/all participants agree)
CREATE OR REPLACE FUNCTION delete_old_chat_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages older than 15 days if ALL participants of the conversation have enabled auto-delete.
  -- Logic: If the conversation has N participants, and auto_delete_settings contains N entries with 'true'.
  DELETE FROM public.messages m
  WHERE m.created_at < NOW() - INTERVAL '15 days'
  AND EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = m.conversation_id
    -- This checks if every user in visible_to (participants) has a 'true' entry in settings
    AND (
      SELECT bool_and((val)::boolean)
      FROM jsonb_each_text(c.auto_delete_settings) AS j(key, val)
      WHERE j.key = ANY(c.visible_to)
    )
    -- Also ensure everyone is actually in the settings object
    AND (
      SELECT count(*) = array_length(c.visible_to, 1)
      FROM jsonb_each_text(c.auto_delete_settings) AS j(key, val)
      WHERE j.key = ANY(c.visible_to)
    )
  );
END;
$$;

-- 3. Update pg_cron schedule
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
    PERFORM cron.unschedule('auto-delete-chat-messages');
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'auto-delete-chat-messages', 
  '0 2 * * *', 
  'SELECT delete_old_chat_messages()'
);
