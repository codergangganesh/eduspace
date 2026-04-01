-- ─── EduSpace AI Agent — New Tables Migration ──────────────────────────────
-- Run this in your Supabase SQL editor.
-- Filename: supabase/migrations/20260323_create_agent_tables.sql
-- These two tables are completely new. Zero changes to existing tables.

-- 1. agent_sessions: stores chat history per user for multi-turn continuity
CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
  messages    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. agent_actions: audit log — every write action the agent executes
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  session_id     UUID REFERENCES public.agent_sessions(id) ON DELETE SET NULL,
  tool_called    TEXT NOT NULL,
  params         JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_status  TEXT NOT NULL DEFAULT 'success' CHECK (result_status IN ('success', 'error')),
  error_message  TEXT,
  source         TEXT NOT NULL DEFAULT 'ai_agent',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: users can only see their own sessions and actions
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own agent sessions"
  ON public.agent_sessions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own agent actions"
  ON public.agent_actions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON public.agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_user_id  ON public.agent_actions(user_id);
