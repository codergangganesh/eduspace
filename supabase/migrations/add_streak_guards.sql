-- Add a monthly Streak Guard budget to each user's streak.
ALTER TABLE public.user_streaks
ADD COLUMN IF NOT EXISTS streak_guards_remaining INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS last_guard_reset_month VARCHAR(7);

UPDATE public.user_streaks
SET streak_guards_remaining = 3,
    last_guard_reset_month = to_char(CURRENT_DATE, 'YYYY-MM')
WHERE last_guard_reset_month IS NULL;
