-- ============================================================
-- Class Feed Feature - Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. POSTS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS class_feed_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_feed_posts_class ON class_feed_posts(class_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON class_feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_pinned ON class_feed_posts(class_id, is_pinned DESC, created_at DESC);

-- RLS Policies
ALTER TABLE class_feed_posts ENABLE ROW LEVEL SECURITY;

-- Students can read posts from their enrolled classes
-- Checks BOTH class_students AND access_requests (status=accepted) for enrollment
CREATE POLICY "Students can view posts from enrolled classes"
ON class_feed_posts FOR SELECT
USING (
    -- Student enrolled via class_students table
    EXISTS (
        SELECT 1 FROM class_students
        WHERE class_students.class_id = class_feed_posts.class_id
        AND class_students.student_id = auth.uid()
    )
    OR
    -- Student enrolled via access_requests (accepted)
    EXISTS (
        SELECT 1 FROM access_requests
        WHERE access_requests.class_id = class_feed_posts.class_id
        AND access_requests.student_id = auth.uid()
        AND access_requests.status = 'accepted'
    )
    OR
    -- Lecturer who owns the class
    EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = class_feed_posts.class_id
        AND classes.lecturer_id = auth.uid()
    )
);

-- Lecturers can insert posts in their classes
CREATE POLICY "Lecturers can create posts in their classes"
ON class_feed_posts FOR INSERT
WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = class_feed_posts.class_id
        AND classes.lecturer_id = auth.uid()
    )
);

-- Lecturers can update their own posts (pin/unpin)
CREATE POLICY "Lecturers can update posts in their classes"
ON class_feed_posts FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = class_feed_posts.class_id
        AND classes.lecturer_id = auth.uid()
    )
);

-- Lecturers can delete posts in their classes, authors can delete their own
CREATE POLICY "Lecturers can delete posts in their classes"
ON class_feed_posts FOR DELETE
USING (
    auth.uid() = author_id
    OR EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = class_feed_posts.class_id
        AND classes.lecturer_id = auth.uid()
    )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE class_feed_posts;


-- 2. REACTIONS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS class_feed_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES class_feed_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- One emoji type per user per post
    UNIQUE(post_id, user_id, emoji)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_reactions_post ON class_feed_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user ON class_feed_reactions(user_id);

-- RLS Policies
ALTER TABLE class_feed_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone in the class can see reactions
-- Checks BOTH class_students AND access_requests for enrollment
CREATE POLICY "Class members can view reactions"
ON class_feed_reactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM class_feed_posts
        JOIN class_students ON class_students.class_id = class_feed_posts.class_id
        WHERE class_feed_posts.id = class_feed_reactions.post_id
        AND class_students.student_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM class_feed_posts
        JOIN access_requests ON access_requests.class_id = class_feed_posts.class_id
        WHERE class_feed_posts.id = class_feed_reactions.post_id
        AND access_requests.student_id = auth.uid()
        AND access_requests.status = 'accepted'
    )
    OR EXISTS (
        SELECT 1 FROM class_feed_posts
        JOIN classes ON classes.id = class_feed_posts.class_id
        WHERE class_feed_posts.id = class_feed_reactions.post_id
        AND classes.lecturer_id = auth.uid()
    )
);

-- Anyone in the class can add reactions
-- Checks BOTH class_students AND access_requests for enrollment
CREATE POLICY "Class members can add reactions"
ON class_feed_reactions FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND (
        EXISTS (
            SELECT 1 FROM class_feed_posts
            JOIN class_students ON class_students.class_id = class_feed_posts.class_id
            WHERE class_feed_posts.id = class_feed_reactions.post_id
            AND class_students.student_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM class_feed_posts
            JOIN access_requests ON access_requests.class_id = class_feed_posts.class_id
            WHERE class_feed_posts.id = class_feed_reactions.post_id
            AND access_requests.student_id = auth.uid()
            AND access_requests.status = 'accepted'
        )
        OR EXISTS (
            SELECT 1 FROM class_feed_posts
            JOIN classes ON classes.id = class_feed_posts.class_id
            WHERE class_feed_posts.id = class_feed_reactions.post_id
            AND classes.lecturer_id = auth.uid()
        )
    )
);

-- Users can delete their own reactions
CREATE POLICY "Users can remove own reactions"
ON class_feed_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE class_feed_reactions;


-- 3. SEEN TABLE (Read Receipts)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS class_feed_seen (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES class_feed_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seen_at TIMESTAMPTZ DEFAULT NOW(),
    -- One seen record per user per post
    UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_seen_post ON class_feed_seen(post_id);

-- RLS Policies
ALTER TABLE class_feed_seen ENABLE ROW LEVEL SECURITY;

-- Lecturers can see who viewed posts in their classes, users can see own
CREATE POLICY "Lecturers can view seen records"
ON class_feed_seen FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM class_feed_posts
        JOIN classes ON classes.id = class_feed_posts.class_id
        WHERE class_feed_posts.id = class_feed_seen.post_id
        AND classes.lecturer_id = auth.uid()
    )
    OR auth.uid() = user_id
);

-- Users can mark posts as seen (both class_students and access_requests enrollment)
CREATE POLICY "Users can mark posts as seen"
ON class_feed_seen FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND (
        EXISTS (
            SELECT 1 FROM class_feed_posts
            JOIN class_students ON class_students.class_id = class_feed_posts.class_id
            WHERE class_feed_posts.id = class_feed_seen.post_id
            AND class_students.student_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM class_feed_posts
            JOIN access_requests ON access_requests.class_id = class_feed_posts.class_id
            WHERE class_feed_posts.id = class_feed_seen.post_id
            AND access_requests.student_id = auth.uid()
            AND access_requests.status = 'accepted'
        )
        OR EXISTS (
            SELECT 1 FROM class_feed_posts
            JOIN classes ON classes.id = class_feed_posts.class_id
            WHERE class_feed_posts.id = class_feed_seen.post_id
            AND classes.lecturer_id = auth.uid()
        )
    )
);

-- ============================================================
-- DONE! Your Class Feed tables are ready.
-- ============================================================
