-- ==========================================
-- Migration: Streak Duels Score & Streak Automation
-- ==========================================

-- 1. Function to cleanly conclude all expired duels in a single transaction
CREATE OR REPLACE FUNCTION public.check_and_conclude_expired_duels()
RETURNS VOID SECURITY DEFINER AS $$
BEGIN
    UPDATE public.streak_duels
    SET 
        status = 'completed',
        winner_id = CASE 
            WHEN challenger_score > defender_score THEN challenger_id
            WHEN defender_score > challenger_score THEN defender_id
            ELSE NULL -- Tie
        END,
        updated_at = NOW()
    WHERE status = 'active' 
      AND NOW() > expires_at;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger Function: Automatically update duel scores whenever a student logs daily activity
CREATE OR REPLACE FUNCTION public.sync_streak_duel_score_on_activity()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
    -- Update duels where the active student is the challenger
    UPDATE public.streak_duels
    SET 
        challenger_score = (
            SELECT COUNT(DISTINCT action_date) 
            FROM public.user_activity_log 
            WHERE user_id = NEW.user_id 
              AND action_date >= started_at::date 
              AND action_date <= expires_at::date
        ),
        updated_at = NOW()
    WHERE challenger_id = NEW.user_id 
      AND status = 'active';

    -- Update duels where the active student is the defender
    UPDATE public.streak_duels
    SET 
        defender_score = (
            SELECT COUNT(DISTINCT action_date) 
            FROM public.user_activity_log 
            WHERE user_id = NEW.user_id 
              AND action_date >= started_at::date 
              AND action_date <= expires_at::date
        ),
        updated_at = NOW()
    WHERE defender_id = NEW.user_id 
      AND status = 'active';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hook Trigger onto user_activity_log
DROP TRIGGER IF EXISTS tr_sync_streak_duel_score ON public.user_activity_log;
CREATE TRIGGER tr_sync_streak_duel_score
    AFTER INSERT OR UPDATE ON public.user_activity_log
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_streak_duel_score_on_activity();

-- 3. Trigger Function: Automatically sync current streaks in active duels when user_streaks update
CREATE OR REPLACE FUNCTION public.sync_streak_duel_streaks()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
    -- Challenger side
    UPDATE public.streak_duels
    SET 
        challenger_current_streak = NEW.current_streak,
        updated_at = NOW()
    WHERE challenger_id = NEW.user_id 
      AND status = 'active';

    -- Defender side
    UPDATE public.streak_duels
    SET 
        defender_current_streak = NEW.current_streak,
        updated_at = NOW()
    WHERE defender_id = NEW.user_id 
      AND status = 'active';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hook Trigger onto user_streaks
DROP TRIGGER IF EXISTS tr_sync_streak_duel_streaks ON public.user_streaks;
CREATE TRIGGER tr_sync_streak_duel_streaks
    AFTER INSERT OR UPDATE ON public.user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_streak_duel_streaks();

-- 4. High-Performance Bulk Sync RPC called from frontend on load
CREATE OR REPLACE FUNCTION public.sync_user_active_duels(p_user_id UUID)
RETURNS VOID SECURITY DEFINER AS $$
BEGIN
    -- 1. First conclude any expired duels
    PERFORM public.check_and_conclude_expired_duels();

    -- 2. Bulk sync challenger streaks
    UPDATE public.streak_duels sd
    SET 
        challenger_current_streak = COALESCE(us.current_streak, 0),
        updated_at = NOW()
    FROM public.user_streaks us
    WHERE sd.challenger_id = us.user_id
      AND sd.status = 'active'
      AND (sd.challenger_id = p_user_id OR sd.defender_id = p_user_id);

    -- 3. Bulk sync defender streaks
    UPDATE public.streak_duels sd
    SET 
        defender_current_streak = COALESCE(us.current_streak, 0),
        updated_at = NOW()
    FROM public.user_streaks us
    WHERE sd.defender_id = us.user_id
      AND sd.status = 'active'
      AND (sd.challenger_id = p_user_id OR sd.defender_id = p_user_id);

    -- 4. Bulk sync challenger activity scores
    UPDATE public.streak_duels sd
    SET 
        challenger_score = (
            SELECT COUNT(DISTINCT ual.action_date)
            FROM public.user_activity_log ual
            WHERE ual.user_id = sd.challenger_id
              AND ual.action_date >= sd.started_at::date
              AND ual.action_date <= sd.expires_at::date
        ),
        updated_at = NOW()
    WHERE sd.status = 'active'
      AND (sd.challenger_id = p_user_id OR sd.defender_id = p_user_id);

    -- 5. Bulk sync defender activity scores
    UPDATE public.streak_duels sd
    SET 
        defender_score = (
            SELECT COUNT(DISTINCT ual.action_date)
            FROM public.user_activity_log ual
            WHERE ual.user_id = sd.defender_id
              AND ual.action_date >= sd.started_at::date
              AND ual.action_date <= sd.expires_at::date
        ),
        updated_at = NOW()
    WHERE sd.status = 'active'
      AND (sd.challenger_id = p_user_id OR sd.defender_id = p_user_id);
END;
$$ LANGUAGE plpgsql;
