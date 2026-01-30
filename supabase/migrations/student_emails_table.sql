-- =====================================================
-- Student Emails Table Migration
-- Tracks email-based student records before account creation
-- =====================================================

-- Create student_emails table
CREATE TABLE IF NOT EXISTS public.student_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    register_number TEXT,
    department TEXT,
    course TEXT,
    year TEXT,
    section TEXT,
    phone TEXT,
    linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_emails_email ON public.student_emails(email);
CREATE INDEX IF NOT EXISTS idx_student_emails_linked_user ON public.student_emails(linked_user_id);
CREATE INDEX IF NOT EXISTS idx_student_emails_register_number ON public.student_emails(register_number) WHERE register_number IS NOT NULL;

-- Enable RLS
ALTER TABLE public.student_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Lecturers can view student emails for their classes
CREATE POLICY "Lecturers can view student emails in their classes"
ON public.student_emails FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.class_students cs
        JOIN public.classes c ON c.id = cs.class_id
        WHERE cs.email = student_emails.email
        AND c.lecturer_id = auth.uid()
    )
);

-- Students can view their own email record
CREATE POLICY "Students can view their own email record"
ON public.student_emails FOR SELECT
USING (
    linked_user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Lecturers can insert student emails for their classes
CREATE POLICY "Lecturers can insert student emails"
ON public.student_emails FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.lecturer_profiles
        WHERE user_id = auth.uid()
    )
);

-- System can update linked_user_id when student signs up
CREATE POLICY "System can link student emails to users"
ON public.student_emails FOR UPDATE
USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_student_emails_updated_at
BEFORE UPDATE ON public.student_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_emails;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================----
