-- =====================================================
-- Fix access_requests table to allow null student_id
-- This allows sending requests to students before they register
-- =====================================================

-- Make student_id nullable in access_requests
ALTER TABLE public.access_requests 
ALTER COLUMN student_id DROP NOT NULL;

-- Update unique constraint to allow multiple null student_ids
-- Drop existing constraint
ALTER TABLE public.access_requests 
DROP CONSTRAINT IF EXISTS access_requests_class_id_student_id_key;

-- Add new constraint that only applies when student_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS access_requests_class_student_unique 
ON public.access_requests(class_id, student_id) 
WHERE student_id IS NOT NULL;

-- Add unique constraint on email to prevent duplicate requests
CREATE UNIQUE INDEX IF NOT EXISTS access_requests_class_email_unique 
ON public.access_requests(class_id, student_email);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
