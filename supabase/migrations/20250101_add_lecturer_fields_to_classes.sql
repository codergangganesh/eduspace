-- =====================================================
-- Add Lecturer Fields to Classes Table
-- Adds lecturer_name, lecturer_department, and lecturer_profile_image
-- to classes table for easier display without additional joins
-- =====================================================

-- Add lecturer fields to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS lecturer_name TEXT,
ADD COLUMN IF NOT EXISTS lecturer_department TEXT,
ADD COLUMN IF NOT EXISTS lecturer_profile_image TEXT;

-- Create index for faster queries by department
CREATE INDEX IF NOT EXISTS idx_classes_lecturer_department ON public.classes(lecturer_department);

-- Update existing classes with lecturer data from lecturer_profiles
UPDATE public.classes c
SET 
    lecturer_name = lp.full_name,
    lecturer_department = lp.department,
    lecturer_profile_image = lp.profile_image
FROM public.lecturer_profiles lp
WHERE c.lecturer_id = lp.user_id
AND (c.lecturer_name IS NULL OR c.lecturer_department IS NULL);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
