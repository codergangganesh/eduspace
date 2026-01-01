-- =====================================================
-- Fix class_students table to allow null student_id
-- This allows adding students before they register/accept
-- =====================================================

-- Make student_id nullable
ALTER TABLE public.class_students 
ALTER COLUMN student_id DROP NOT NULL;

-- Update unique constraint to allow multiple null student_ids
-- Drop existing constraint
ALTER TABLE public.class_students 
DROP CONSTRAINT IF EXISTS class_students_class_id_student_id_key;

-- Add new constraint that only applies when student_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS class_students_class_student_unique 
ON public.class_students(class_id, student_id) 
WHERE student_id IS NOT NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
