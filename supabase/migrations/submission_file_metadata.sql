-- =====================================================
-- Add File Metadata Columns to assignment_submissions
-- =====================================================

-- Add file_size column (in bytes)
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add file_type column (MIME type)
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.assignment_submissions.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.assignment_submissions.file_type IS 'MIME type of the submitted file (e.g., application/pdf)';
