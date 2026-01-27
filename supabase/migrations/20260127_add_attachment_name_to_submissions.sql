-- =====================================================
-- Add Attachment Columns to assignment_submissions
-- =====================================================

-- Add attachment_url column if it doesn't exist
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Add attachment_name column if it doesn't exist
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.assignment_submissions.attachment_url IS 'URL of the submitted attachment (e.g., Cloudinary URL)';
COMMENT ON COLUMN public.assignment_submissions.attachment_name IS 'Original filename of the submitted attachment';
