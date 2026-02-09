-- Add last_selected_class_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_selected_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.profiles.last_selected_class_id IS 'Remembers the last class selected by the student/lecturer for persistence across sessions.';
