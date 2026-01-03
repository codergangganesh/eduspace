-- =====================================================
-- Enhance Classes and Access Requests Tables
-- Adds lecturer metadata and email-based invitation tracking
-- =====================================================

-- Add lecturer metadata to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS lecturer_name TEXT,
ADD COLUMN IF NOT EXISTS lecturer_department TEXT;

-- Populate lecturer metadata from existing lecturer_profiles
UPDATE public.classes c
SET 
    lecturer_name = lp.full_name,
    lecturer_department = lp.department
FROM public.lecturer_profiles lp
WHERE c.lecturer_id = lp.user_id
AND c.lecturer_name IS NULL;

-- Modify access_requests to support nullable student_id (for pre-registration invitations)
-- Note: student_id is already nullable in the existing schema, but we'll ensure it
ALTER TABLE public.access_requests 
ALTER COLUMN student_id DROP NOT NULL;

-- Add invitation_email_sent tracking field
ALTER TABLE public.access_requests
ADD COLUMN IF NOT EXISTS invitation_email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invitation_email_sent_at TIMESTAMPTZ;

-- Modify class_students to support nullable student_id (for email-based tracking)
ALTER TABLE public.class_students
ALTER COLUMN student_id DROP NOT NULL;

-- Add index for faster email-based lookups
CREATE INDEX IF NOT EXISTS idx_class_students_email ON public.class_students(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON public.access_requests(student_email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status_email ON public.access_requests(status, student_email);

-- Update RLS policies for access_requests to support email-based matching
DROP POLICY IF EXISTS "Students can view and respond to their access requests" ON public.access_requests;

CREATE POLICY "Students can view and respond to their access requests"
ON public.access_requests FOR ALL
USING (
    auth.uid() = student_id OR
    student_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Update RLS policies for class_students to support email-based matching
DROP POLICY IF EXISTS "Students can view their own class enrollments" ON public.class_students;

CREATE POLICY "Students can view their own class enrollments"
ON public.class_students FOR SELECT
USING (
    auth.uid() = student_id OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Create function to auto-populate lecturer metadata on class creation
CREATE OR REPLACE FUNCTION public.populate_lecturer_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Populate lecturer name and department from lecturer_profiles
    SELECT full_name, department
    INTO NEW.lecturer_name, NEW.lecturer_department
    FROM public.lecturer_profiles
    WHERE user_id = NEW.lecturer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-populate lecturer metadata
DROP TRIGGER IF EXISTS trigger_populate_lecturer_metadata ON public.classes;
CREATE TRIGGER trigger_populate_lecturer_metadata
BEFORE INSERT ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.populate_lecturer_metadata();

-- Create function to link student account to email-based records
CREATE OR REPLACE FUNCTION public.link_student_to_email_records()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get the user's email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Link student_emails records
    UPDATE public.student_emails
    SET linked_user_id = NEW.user_id
    WHERE email = user_email
    AND linked_user_id IS NULL;
    
    -- Link class_students records
    UPDATE public.class_students
    SET student_id = NEW.user_id
    WHERE email = user_email
    AND student_id IS NULL;
    
    -- Link access_requests records
    UPDATE public.access_requests
    SET student_id = NEW.user_id
    WHERE student_email = user_email
    AND student_id IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-link student records on profile creation
DROP TRIGGER IF EXISTS trigger_link_student_records ON public.student_profiles;
CREATE TRIGGER trigger_link_student_records
AFTER INSERT ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.link_student_to_email_records();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
