-- Remove the restrictive foreign key on related_id which forces it to be a conversation
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_related_id_fkey;
