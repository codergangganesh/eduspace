-- Migration: Allow JSON content in AI messages for multimodal support
ALTER TABLE public.ai_messages 
ALTER COLUMN content TYPE JSONB USING content::JSONB;

-- Fallback for existing text content that might not be valid JSON
-- (Though since it's a new feature, most will be text strings which are valid JSON scalar values)
