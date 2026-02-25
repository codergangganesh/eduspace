
-- Create agora_comments table
CREATE TABLE IF NOT EXISTS public.agora_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.agora_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agora_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Comments are viewable by everyone" 
ON public.agora_comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.agora_comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.agora_comments FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.agora_comments FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create a view index for performance
CREATE INDEX IF NOT EXISTS idx_agora_comments_post_id ON public.agora_comments(post_id);
