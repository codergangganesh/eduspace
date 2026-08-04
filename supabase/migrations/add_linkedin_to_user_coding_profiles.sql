-- Add LinkedIn integration fields to user_coding_profiles table
ALTER TABLE IF EXISTS public.user_coding_profiles
  ADD COLUMN IF NOT EXISTS linkedin_username TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_data JSONB,
  ADD COLUMN IF NOT EXISTS linkedin_error TEXT;
  ALTER TABLE IF EXISTS public.user_coding_profiles
  ADD COLUMN IF NOT EXISTS linkedin_user_id TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_access_token TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linkedin_connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linkedin_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linkedin_oauth_state TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_oauth_state_created_at TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN public.user_coding_profiles.linkedin_username IS 'LinkedIn profile URL or handle stored for caching purposes';
COMMENT ON COLUMN public.user_coding_profiles.linkedin_data IS 'Cached LinkedIn public profile data scraped from the public profile page';
COMMENT ON COLUMN public.user_coding_profiles.linkedin_error IS 'Last fetch error message for LinkedIn profile scraping';
COMMENT ON COLUMN public.user_coding_profiles.linkedin_user_id IS 'LinkedIn account ID stored for OAuth-connected users';
COMMENT ON COLUMN public.user_coding_profiles.linkedin_access_token IS 'LinkedIn OAuth access token stored securely on the backend';
COMMENT ON COLUMN public.user_coding_profiles.linkedin_refresh_token IS 'LinkedIn OAuth refresh token stored securely on the backend';
COMMENT ON COLUMN public.user_coding_profiles.linkedin_token_expires_at IS 'Expiration time for the LinkedIn OAuth access token';
COMMENT ON COLUMN public.user_coding_profiles.linkedin_connected_at IS 'Timestamp when the LinkedIn account was first connected';
COMMENT ON COLUMN public.user_coding_profiles.linkedin_last_synced_at IS 'Timestamp when the LinkedIn profile data was last synced';
COMMENT ON COLUMN public.user_coding_profiles.linkedin_oauth_state IS 'Temporary LinkedIn OAuth state value for CSRF protection';
COMMENT ON COLUMN public.user_coding_profiles.linkedin_oauth_state_created_at IS 'Timestamp when the LinkedIn OAuth state value was created';
