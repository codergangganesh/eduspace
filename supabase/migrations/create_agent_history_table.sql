-- Migration: Create Agent History Table for EduSpace Agent
-- This table stores conversation messages that are automatically deleted after 7 days.

CREATE TABLE IF NOT EXISTS public.agent_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'agent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own agent history"
    ON public.agent_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent history"
    ON public.agent_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Auto-deletion function
CREATE OR REPLACE FUNCTION public.delete_old_agent_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.agent_history
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Schedule the task using pg_cron (ensure extension exists)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule existing job if it exists to avoid duplicates
DO $$
BEGIN
    PERFORM cron.unschedule('auto-delete-agent-history');
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Schedule the job to run EVERY DAY at 02:00 AM
SELECT cron.schedule(
  'auto-delete-agent-history', 
  '0 2 * * *', 
  'SELECT public.delete_old_agent_history()'
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_agent_history_user_id ON public.agent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_history_created_at ON public.agent_history(created_at);
