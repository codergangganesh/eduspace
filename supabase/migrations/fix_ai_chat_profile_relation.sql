-- Migration: Fix relationship between ai_conversations and profiles for joined queries
-- This allows Supabase to understand the link between a conversation and the user's profile

-- Drop the existing foreign key to auth.users if it exists (it might have a default name)
-- We'll replace it with a foreign key to public.profiles which is better for public-facing joins
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'ai_conversations' AND constraint_name = 'ai_conversations_user_id_fkey'
    ) THEN
        ALTER TABLE public.ai_conversations DROP CONSTRAINT ai_conversations_user_id_fkey;
    END IF;
END $$;

-- Add the foreign key to profiles table
-- Assuming profiles table uses user_id as its identifier
ALTER TABLE public.ai_conversations
ADD CONSTRAINT ai_conversations_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
