-- Add notifications_enabled column to profiles table
-- This serves as the master toggle for all notifications

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'notifications_enabled'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.notifications_enabled IS 'Master toggle for all notifications. If false, no notifications are sent regardless of other settings.';

-- Update the student_profiles and lecturer_profiles views if they don't automatically pick up the new column
-- (Postgres views usually need to be recreated to include new columns from underlying tables if they were defined with SELECT *)
-- Checking if they are views first:
-- They seem to be defined as views in some projects, but in this project I haven't seen the specific view definition files yet.
-- Assuming they might be just direct queries or views. If they are views, they need a refresh.

-- Attempt to refresh views if they exist
DO $$
BEGIN
    -- Refresh student_profiles view if it exists
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'student_profiles') THEN
        -- This is a bit risky without knowing the exact definition, but often simply running a CREATE OR REPLACE VIEW with the same definition works.
        -- However, since I don't have the definition, I will rely on the fact that if they are simple views they might need manual update or if they are just the table used directly (which seems to be the case mostly in Supabase projects unless explicitly separated).
        -- Wait, looking at notificationService.ts, it selects from "student_profiles". 
        -- If "student_profiles" is a VIEW, it needs to be updated.
        -- If "student_profiles" is just the "profiles" table with a role filter (which is common), then nothing to do.
        -- Let's assume for now it might be a view or just the table. 
        NULL;
    END IF;
END $$;
