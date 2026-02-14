-- Create Knowledge Map table to store AI-extracted keywords and connections
CREATE TABLE IF NOT EXISTS public.knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('chat', 'note', 'quiz', 'assignment')),
    source_id UUID NOT NULL, -- Logical ID to the source table
    label TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own knowledge nodes"
    ON public.knowledge_nodes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own knowledge nodes"
    ON public.knowledge_nodes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Secondary table for explicitly defined links if needed (though usually we'll derive them from sharing keywords)
CREATE TABLE IF NOT EXISTS public.knowledge_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_node_id UUID REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
    target_node_id UUID REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
    weight FLOAT DEFAULT 1.0,
    link_type TEXT DEFAULT 'keyword_match',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.knowledge_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge links"
    ON public.knowledge_links FOR SELECT
    USING (auth.uid() = user_id);

-- Indices
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_user_id ON public.knowledge_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_source_id ON public.knowledge_nodes(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_keywords ON public.knowledge_nodes USING GIN (keywords);
