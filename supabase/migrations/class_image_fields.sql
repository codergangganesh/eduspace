-- =====================================================
-- Add Image URL Fields to Classes and Students
-- Adds class_image_url and student_image_url for Cloudinary integration
-- =====================================================

-- Add image URL to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS class_image_url TEXT;

-- Add image URL to class_students table
ALTER TABLE public.class_students 
ADD COLUMN IF NOT EXISTS student_image_url TEXT;

-- Create indexes for faster image queries
CREATE INDEX IF NOT EXISTS idx_classes_with_images ON public.classes(class_image_url) WHERE class_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_with_images ON public.class_students(student_image_url) WHERE student_image_url IS NOT NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
