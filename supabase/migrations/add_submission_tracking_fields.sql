-- Add tracking fields to assignment_submissions
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS register_number TEXT;

-- Update comments for clarity
COMMENT ON COLUMN public.assignment_submissions.class_id IS 'Reference to the class the student belongs to for this assignment';
COMMENT ON COLUMN public.assignment_submissions.register_number IS 'Snapshot of the student register number at submission time';

-- Ensure existing records have class_id populated from assignment
UPDATE public.assignment_submissions sub
SET class_id = (SELECT class_id FROM public.assignments a WHERE a.id = sub.assignment_id)
WHERE class_id IS NULL;
