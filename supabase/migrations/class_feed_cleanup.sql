-- ============================================================
-- CLEANUP: Run this FIRST if you already created the old tables
-- Then run class_feed_tables.sql
-- ============================================================

-- Remove from realtime publication (ignore errors if not added)
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS class_feed_seen;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS class_feed_reactions;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS class_feed_posts;

-- Drop tables (cascading removes policies + indexes automatically)
DROP TABLE IF EXISTS class_feed_seen CASCADE;
DROP TABLE IF EXISTS class_feed_reactions CASCADE;
DROP TABLE IF EXISTS class_feed_posts CASCADE;

-- ============================================================
-- Now run class_feed_tables.sql to recreate with fixed RLS
-- ============================================================
