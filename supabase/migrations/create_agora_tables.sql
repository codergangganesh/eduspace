
-- 1. Create Agora Post Types
-- Using a check constraint if enum creation is restricted in some environments, 
-- but traditionally Supabase supports enums.
DO $$ BEGIN
    CREATE TYPE agora_post_type AS ENUM ('note', 'question', 'video', 'canvas');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Agora Posts Table
CREATE TABLE IF NOT EXISTS public.agora_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  post_type agora_post_type NOT NULL DEFAULT 'note',
  bounty INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Agora Votes Table (Handling Likes/Dislikes)
CREATE TABLE IF NOT EXISTS public.agora_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.agora_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)), -- 1 for like (up), -1 for dislike (down)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 4. RLS Policies
ALTER TABLE public.agora_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agora_votes ENABLE ROW LEVEL SECURITY;

-- Post Policies
DROP POLICY IF EXISTS "Agora posts are viewable by everyone" ON public.agora_posts;
CREATE POLICY "Agora posts are viewable by everyone" 
ON public.agora_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.agora_posts;
CREATE POLICY "Authenticated users can create posts" 
ON public.agora_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors can update their own posts" ON public.agora_posts;
CREATE POLICY "Authors can update their own posts" 
ON public.agora_posts FOR UPDATE USING (auth.uid() = user_id);

-- Vote Policies
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.agora_votes;
CREATE POLICY "Votes are viewable by everyone" 
ON public.agora_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can vote" ON public.agora_votes;
CREATE POLICY "Authenticated users can vote" 
ON public.agora_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can change their own vote" ON public.agora_votes;
CREATE POLICY "Users can change their own vote" 
ON public.agora_votes FOR UPDATE USING (auth.uid() = user_id);

-- 5. Helper Functions for Counts
-- Function to get vote counts for a post
CREATE OR REPLACE FUNCTION get_post_vote_counts(p_id UUID)
RETURNS TABLE (likes BIGINT, dislikes BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE vote_type = 1) as likes,
        COUNT(*) FILTER (WHERE vote_type = -1) as dislikes
    FROM public.agora_votes
    WHERE post_id = p_id;
END;
$$ LANGUAGE plpgsql;
