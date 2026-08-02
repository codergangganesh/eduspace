-- Add Chess.com integration fields to user_coding_profiles table
ALTER TABLE IF EXISTS public.user_coding_profiles
  ADD COLUMN IF NOT EXISTS chess_username TEXT,
  ADD COLUMN IF NOT EXISTS chess_data JSONB,
  ADD COLUMN IF NOT EXISTS chess_error TEXT;

-- Add Chess.com social link fields to profiles table
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS chess_username TEXT,
  ADD COLUMN IF NOT EXISTS chess_url TEXT;

-- Comments for documentation
COMMENT ON COLUMN public.user_coding_profiles.chess_username IS 'Chess.com public username handle';
COMMENT ON COLUMN public.user_coding_profiles.chess_data IS 'Cached Chess.com profile, rating modes, overall statistics, and recent activity';
COMMENT ON COLUMN public.user_coding_profiles.chess_error IS 'Last fetch error message for Chess.com API';
