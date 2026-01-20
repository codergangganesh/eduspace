-- Add attachment_size column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_size TEXT;
