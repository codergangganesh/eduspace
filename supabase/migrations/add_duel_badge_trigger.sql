-- ==============================================================
-- Migration: Secure Server-Side Duel Badge Automation & Indexes
-- ==============================================================

-- 1. Create High-Performance Indices
CREATE INDEX IF NOT EXISTS idx_streak_duels_winner_status_perf
ON public.streak_duels (winner_id, status)
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_streak_duels_challenger_defender
ON public.streak_duels (challenger_id, defender_id);

CREATE INDEX IF NOT EXISTS idx_user_duel_badges_user_type
ON public.user_duel_badges (user_id, badge_type);


-- 2. Core PL/pgSQL Function: Safely compute and unlock eligible duel badges
CREATE OR REPLACE FUNCTION public.check_and_unlock_duel_badges_for_user(p_user_id UUID)
RETURNS VOID SECURITY DEFINER AS $$
DECLARE
    v_wins INT;
    v_challenges INT;
    v_completed_count INT;
    v_challenger_wins INT;
    v_longest_unbeaten INT := 0;
    v_current_unbeaten INT := 0;
    v_rank INT;
    r RECORD;
BEGIN
    -- A. Calculate Core Stats
    -- Total Wins
    SELECT COUNT(*) INTO v_wins
    FROM public.streak_duels
    WHERE status = 'completed' AND winner_id = p_user_id;

    -- Total Challenges Initiated
    SELECT COUNT(*) INTO v_challenges
    FROM public.streak_duels
    WHERE challenger_id = p_user_id;

    -- Total Completed Duels
    SELECT COUNT(*) INTO v_completed_count
    FROM public.streak_duels
    WHERE status = 'completed' AND (challenger_id = p_user_id OR defender_id = p_user_id);

    -- Wins as Challenger
    SELECT COUNT(*) INTO v_challenger_wins
    FROM public.streak_duels
    WHERE status = 'completed' AND winner_id = p_user_id AND challenger_id = p_user_id;

    -- Longest Unbeaten Streak
    FOR r IN (
        SELECT winner_id
        FROM public.streak_duels
        WHERE status = 'completed' AND (challenger_id = p_user_id OR defender_id = p_user_id)
        ORDER BY updated_at ASC
    ) LOOP
        IF r.winner_id = p_user_id OR r.winner_id IS NULL THEN
            v_current_unbeaten := v_current_unbeaten + 1;
            IF v_current_unbeaten > v_longest_unbeaten THEN
                v_longest_unbeaten := v_current_unbeaten;
            END IF;
        ELSE
            v_current_unbeaten := 0;
        END IF;
    END LOOP;

    -- B. Compute Ranks Podium Position (Dynamic Rank)
    WITH player_wins AS (
        SELECT 
            p_id,
            COUNT(CASE WHEN winner_id = p_id THEN 1 END) AS wins,
            COUNT(*) AS total
        FROM (
            SELECT challenger_id AS p_id, winner_id, status FROM public.streak_duels
            UNION ALL
            SELECT defender_id AS p_id, winner_id, status FROM public.streak_duels
        ) sub
        WHERE status = 'completed'
        GROUP BY p_id
    ),
    ranked_players AS (
        SELECT 
            p_id,
            ROW_NUMBER() OVER (
                ORDER BY wins DESC, total DESC, p_id ASC
            ) AS rank
        FROM player_wins
    )
    SELECT COALESCE((SELECT rank FROM ranked_players WHERE p_id = p_user_id), 999) INTO v_rank;

    -- C. Automated Badge Unlock Assertions
    -- 1. first-victory
    IF v_wins >= 1 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, 'first-victory', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 2. 5-wins
    IF v_wins >= 5 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, '5-wins', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 3. 10-wins
    IF v_wins >= 10 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, '10-wins', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 4. 25-wins
    IF v_wins >= 25 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, '25-wins', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 5. duel-champion
    IF v_wins >= 50 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, 'duel-champion', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 6. grand-master-duelist
    IF v_wins >= 100 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, 'grand-master-duelist', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 7. top-challenger
    IF v_challenges >= 10 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, 'top-challenger', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 8. rank-climber
    IF v_rank <= 3 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, 'rank-climber', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 9. unbeaten-streak
    IF v_longest_unbeaten >= 5 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, 'unbeaten-streak', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 10. elite-competitor
    IF v_wins >= 15 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, 'elite-competitor', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 11. duel-veteran
    IF v_completed_count >= 30 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, 'duel-veteran', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

    -- 12. fast-challenger
    IF v_challenger_wins >= 3 THEN
        INSERT INTO public.user_duel_badges (user_id, badge_type, wins_count)
        VALUES (p_user_id, 'fast-challenger', v_wins)
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;

END;
$$ LANGUAGE plpgsql;


-- 3. Trigger Handler Function: Syncs badges after a duel change
CREATE OR REPLACE FUNCTION public.trigger_sync_user_duel_badges()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
    -- Re-evaluate badges for both challenger and defender
    IF NEW.challenger_id IS NOT NULL THEN
        PERFORM public.check_and_unlock_duel_badges_for_user(NEW.challenger_id);
    END IF;

    IF NEW.defender_id IS NOT NULL THEN
        PERFORM public.check_and_unlock_duel_badges_for_user(NEW.defender_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 4. Hook Trigger
DROP TRIGGER IF EXISTS tr_sync_user_duel_badges ON public.streak_duels;
CREATE TRIGGER tr_sync_user_duel_badges
    AFTER INSERT OR UPDATE ON public.streak_duels
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_sync_user_duel_badges();
