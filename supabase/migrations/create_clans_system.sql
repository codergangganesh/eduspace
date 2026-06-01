-- ==========================================
-- Migration: Classroom Guilds (Clans) System
-- ==========================================

-- 1. Clans Core Table
CREATE TABLE IF NOT EXISTS public.clans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL CHECK (char_length(tag) >= 2 AND char_length(tag) <= 4),
    banner_style JSONB DEFAULT '{"bgColor": "#6366f1", "icon": "shield", "pattern": "stars"}'::jsonb,
    leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1,
    total_cxp INTEGER DEFAULT 0,
    trophies_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Clan Members Table
CREATE TABLE IF NOT EXISTS public.clan_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, -- A student can only be in one clan globally
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
    joined_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Clan Battles Table
CREATE TABLE IF NOT EXISTS public.clan_battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    clan_a_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    clan_b_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    clan_a_score NUMERIC(10, 2) DEFAULT 0.00,
    clan_b_score NUMERIC(10, 2) DEFAULT 0.00,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    winner_id UUID REFERENCES public.clans(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT different_clans CHECK (clan_a_id <> clan_b_id)
);

-- 4. Enable RLS
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_battles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Clans
CREATE POLICY "Users can view clans in their classes" 
ON public.clans FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.class_students cs 
        WHERE cs.class_id = clans.class_id AND cs.student_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = clans.class_id AND c.lecturer_id = auth.uid()
    )
);

CREATE POLICY "Students can create clans if they're enrolled" 
ON public.clans FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.class_students cs 
        WHERE cs.class_id = clans.class_id AND cs.student_id = auth.uid()
    )
);

CREATE POLICY "Leaders can edit their clan banner or details" 
ON public.clans FOR UPDATE 
USING (auth.uid() = leader_id);

CREATE POLICY "Leaders can delete their clan" 
ON public.clans FOR DELETE 
USING (auth.uid() = leader_id);

-- RLS Policies for Clan Members
CREATE POLICY "Users can view clan members" 
ON public.clan_members FOR SELECT 
USING (true);

CREATE POLICY "Users can join a clan" 
ON public.clan_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave or leaders can manage roles" 
ON public.clan_members FOR ALL 
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.clans c 
        WHERE c.id = clan_members.clan_id AND c.leader_id = auth.uid()
    )
);

-- RLS Policies for Battles
CREATE POLICY "Users can view battles" 
ON public.clan_battles FOR SELECT 
USING (true);

CREATE POLICY "Lecturers or trigger functions can manage battles" 
ON public.clan_battles FOR ALL 
USING (true)
WITH CHECK (true);

-- 6. Trigger: Synchronize CXP and Levels when students perform activities
CREATE OR REPLACE FUNCTION public.sync_clan_cxp_on_activity()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
    v_clan_id UUID;
    v_cxp_gain INTEGER := 20; -- Default CXP granted for any daily logged activity
    v_total_cxp INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Locate the student's clan
    SELECT clan_id INTO v_clan_id 
    FROM public.clan_members 
    WHERE user_id = NEW.user_id;

    IF v_clan_id IS NOT NULL THEN
        -- Add CXP and update Level
        UPDATE public.clans
        SET total_cxp = total_cxp + v_cxp_gain,
            level = FLOOR(POWER((total_cxp + v_cxp_gain)::numeric / 1000, 0.66))::integer + 1,
            updated_at = NOW()
        WHERE id = v_clan_id
        RETURNING total_cxp, level INTO v_total_cxp, v_new_level;
        
        -- Also update scores in active battles where this clan participates
        UPDATE public.clan_battles
        SET clan_a_score = clan_a_score + (v_cxp_gain::numeric / 10),
            updated_at = NOW()
        WHERE clan_a_id = v_clan_id AND status = 'active';

        UPDATE public.clan_battles
        SET clan_b_score = clan_b_score + (v_cxp_gain::numeric / 10),
            updated_at = NOW()
        WHERE clan_b_id = v_clan_id AND status = 'active';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_clan_cxp ON public.user_activity_log;
CREATE TRIGGER tr_sync_clan_cxp
    AFTER INSERT OR UPDATE ON public.user_activity_log
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_clan_cxp_on_activity();

-- 7. High-Performance Matchmaking & Battle resolution RPC
CREATE OR REPLACE FUNCTION public.conclude_weekly_clan_battles()
RETURNS VOID SECURITY DEFINER AS $$
BEGIN
    UPDATE public.clan_battles
    SET status = 'completed',
        winner_id = CASE 
            WHEN clan_a_score > clan_b_score THEN clan_a_id
            WHEN clan_b_score > clan_a_score THEN clan_b_id
            ELSE NULL -- Tie
        END,
        updated_at = NOW()
    WHERE status = 'active' AND NOW() > expires_at;

    -- Award trophies to the winning clans
    UPDATE public.clans c
    SET trophies_count = trophies_count + 1,
        total_cxp = total_cxp + 500,
        level = FLOOR(POWER((total_cxp + 500)::numeric / 1000, 0.66))::integer + 1
    FROM public.clan_battles cb
    WHERE cb.status = 'completed' 
      AND cb.winner_id = c.id 
      AND cb.updated_at >= NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- 8. Enable Realtime for clans, members and battles
ALTER PUBLICATION supabase_realtime ADD TABLE public.clans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_battles;
