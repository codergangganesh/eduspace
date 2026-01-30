-- =====================================================
-- Create Subjects Table for Class Syllabus Management
-- =====================================================

-- Drop existing table if needed (for clean re-run)
DROP TABLE IF EXISTS public.subjects CASCADE;

-- Subjects Table (linked to classes)
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, code)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_subjects_class_id ON public.subjects(class_id);
CREATE INDEX idx_subjects_code ON public.subjects(code);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Lecturers can manage subjects for their classes
CREATE POLICY "Lecturers can manage subjects for their classes"
ON public.subjects FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = subjects.class_id
        AND c.lecturer_id = auth.uid()
    )
);

-- Students can view subjects for their enrolled classes
CREATE POLICY "Students can view subjects for enrolled classes"
ON public.subjects FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.class_students cs
        JOIN public.access_requests ar ON ar.class_id = cs.class_id AND ar.student_id = cs.student_id
        WHERE cs.class_id = subjects.class_id
        AND cs.student_id = auth.uid()
        AND ar.status = 'accepted'
    )
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS
-- =====================================================

-- Add subjects table to realtime publication
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'subjects'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore if publication doesn't exist or other errors
        NULL;
END $$;
