-- Enable pgvector extension for RAG (Retrieval-Augmented Generation)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add content_text and content_embedding columns to knowledge_nodes
ALTER TABLE public.knowledge_nodes 
ADD COLUMN IF NOT EXISTS content_text TEXT,
ADD COLUMN IF NOT EXISTS content_embedding vector(1536); -- Standard dimension for OpenAI or common embedding models

-- Create a function for vector search (Cosine Similarity)
-- This will be used by the AI Coach to find relevant context
CREATE OR REPLACE FUNCTION match_knowledge_nodes (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  entity_type text,
  label text,
  content_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kn.id,
    kn.entity_type,
    kn.label,
    kn.content_text,
    1 - (kn.content_embedding <=> query_embedding) AS similarity
  FROM public.knowledge_nodes kn
  WHERE kn.user_id = p_user_id
    AND kn.content_embedding IS NOT NULL
    AND 1 - (kn.content_embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
