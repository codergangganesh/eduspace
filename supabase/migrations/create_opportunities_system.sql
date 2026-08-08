-- Migration: create_opportunities_system.sql
-- Create Opportunities, Saved Opportunities, Applied Opportunities, and Sync Logs tables

-- 1. Create opportunities table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  source TEXT NOT NULL, -- e.g., 'arbeitnow', 'remoteok', 'devpost', 'hackerearth', 'devfolio'
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('job', 'remote_job', 'internship', 'hackathon', 'hiring_challenge')),
  work_arrangement TEXT NOT NULL DEFAULT 'remote' CHECK (work_arrangement IN ('remote', 'hybrid', 'onsite')),
  location TEXT DEFAULT 'Global / Remote',
  description TEXT,
  requirements TEXT[],
  skills TEXT[] DEFAULT '{}',
  salary_range TEXT,
  stipend TEXT,
  prize_pool TEXT,
  deadline TIMESTAMPTZ,
  apply_url TEXT NOT NULL,
  is_remote BOOLEAN DEFAULT true,
  posted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create saved_opportunities table
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

-- 3. Create applied_opportunities table
CREATE TABLE IF NOT EXISTS public.applied_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'interviewing', 'offered', 'rejected')),
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

-- 4. Create opportunity_sync_logs table
CREATE TABLE IF NOT EXISTS public.opportunity_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  items_fetched INT DEFAULT 0,
  items_inserted INT DEFAULT 0,
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for ultra-fast query performance
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON public.opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_work_arrangement ON public.opportunities(work_arrangement);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON public.opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_skills ON public.opportunities USING GIN (skills);

CREATE INDEX IF NOT EXISTS idx_saved_opp_user ON public.saved_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_applied_opp_user ON public.applied_opportunities(user_id);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applied_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Opportunities: Viewable by all authenticated users & anon
CREATE POLICY "Allow public read access to opportunities"
  ON public.opportunities FOR SELECT
  USING (true);

-- Opportunities: Insert/Update allowed by service role or authenticated users for client sync
CREATE POLICY "Allow write access to opportunities for authenticated users"
  ON public.opportunities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Saved Opportunities: Users manage their own saved opportunities
CREATE POLICY "Users can view own saved opportunities"
  ON public.saved_opportunities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved opportunities"
  ON public.saved_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved opportunities"
  ON public.saved_opportunities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Applied Opportunities: Users manage their own applied opportunities
CREATE POLICY "Users can view own applied opportunities"
  ON public.applied_opportunities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applied opportunities"
  ON public.applied_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applied opportunities"
  ON public.applied_opportunities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applied opportunities"
  ON public.applied_opportunities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sync Logs: Viewable by authenticated users
CREATE POLICY "Authenticated users can read sync logs"
  ON public.opportunity_sync_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sync logs"
  ON public.opportunity_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
