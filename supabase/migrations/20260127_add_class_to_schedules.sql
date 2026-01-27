-- =====================================================
-- Add Class and Subject Columns to Schedules Table
-- =====================================================

-- Add class_id column (foreign key to classes table)
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

-- Add subject_id column (foreign key to subjects table)
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_schedules_class_id ON public.schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_schedules_subject_id ON public.schedules(subject_id);

-- Add comments for documentation
COMMENT ON COLUMN public.schedules.class_id IS 'Class this schedule belongs to (required for class-scoped schedules)';
COMMENT ON COLUMN public.schedules.subject_id IS 'Subject for this schedule event';

-- =====================================================
-- Update RLS Policies for Class-Scoped Access
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS "Students can view schedules for enrolled classes" ON public.schedules;
DROP POLICY IF EXISTS "Lecturers can manage their schedules" ON public.schedules;

-- Students can only see schedules from accepted classes
CREATE POLICY "Students can view schedules for enrolled classes"
ON public.schedules FOR SELECT
TO authenticated
USING (
    class_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.access_requests ar
        WHERE ar.class_id = schedules.class_id
        AND ar.student_id = auth.uid()
        AND ar.status = 'accepted'
    )
);

-- Lecturers can view all their schedules
CREATE POLICY "Lecturers can view their schedules"
ON public.schedules FOR SELECT
TO authenticated
USING (lecturer_id = auth.uid());

-- Lecturers can insert their own schedules
CREATE POLICY "Lecturers can create schedules"
ON public.schedules FOR INSERT
TO authenticated
WITH CHECK (lecturer_id = auth.uid());

-- Lecturers can update their own schedules
CREATE POLICY "Lecturers can update their schedules"
ON public.schedules FOR UPDATE
TO authenticated
USING (lecturer_id = auth.uid());

-- Lecturers can delete their own schedules
CREATE POLICY "Lecturers can delete their schedules"
ON public.schedules FOR DELETE
TO authenticated
USING (lecturer_id = auth.uid());
