-- =====================================================
-- Add submission_text Column to assignment_submissions
-- =====================================================

-- Add submission_text column if it doesn't exist
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS submission_text TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.assignment_submissions.submission_text IS 'Text content or notes submitted by the student';
