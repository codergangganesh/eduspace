-- Migration: Add Conversations Table for AI Agent
-- This allows grouping messages into separate threads/chats.

CREATE TABLE IF NOT EXISTS public.agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add conversation_id to agent_history
ALTER TABLE public.agent_history 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE;

-- Enable RLS for conversations
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own agent conversations"
    ON public.agent_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent conversations"
    ON public.agent_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent conversations"
    ON public.agent_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent conversations"
    ON public.agent_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Update auto-deletion for conversations too
CREATE OR REPLACE FUNCTION public.delete_old_agent_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete old messages
  DELETE FROM public.agent_history
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- Delete conversations with no recent messages or that are older than 7 days
  DELETE FROM public.agent_conversations
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Update the cron job to use the new function
SELECT cron.schedule(
  'auto-delete-agent-history', 
  '0 2 * * *', 
  'SELECT public.delete_old_agent_data()'
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_id ON public.agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_history_conversation_id ON public.agent_history(conversation_id);
