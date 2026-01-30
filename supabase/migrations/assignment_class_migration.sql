-- =====================================================
-- Migrate Assignments to Support Class-Based System
-- =====================================================

-- Add new columns to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS topic TEXT;

ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;

-- =====================================================
-- UPDATE EXISTING POLICIES
-- =====================================================

-- Drop old assignment policies if they exist
DROP POLICY IF EXISTS "Lecturers can manage their own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can view published assignments for their courses" ON public.assignments;
DROP POLICY IF EXISTS "Lecturers can manage assignments for their classes" ON public.assignments;
DROP POLICY IF EXISTS "Students can view assignments for enrolled classes" ON public.assignments;

-- Create new class-scoped policy for lecturers
CREATE POLICY "Lecturers can manage assignments for their classes"
ON public.assignments FOR ALL
USING (
    -- Allow if lecturer owns the class
    (
        assignments.class_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = assignments.class_id
            AND c.lecturer_id = auth.uid()
        )
    )
    OR
    -- Also allow if lecturer created the assignment (backward compatibility)
    (assignments.lecturer_id = auth.uid())
);

-- Create new class-scoped policy for students
CREATE POLICY "Students can view assignments for enrolled classes"
ON public.assignments FOR SELECT
USING (
    assignments.status = 'published' AND
    (
        -- New class-based assignments
        (
            assignments.class_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.class_students cs
                JOIN public.access_requests ar ON ar.class_id = cs.class_id AND ar.student_id = cs.student_id
                WHERE cs.class_id = assignments.class_id
                AND cs.student_id = auth.uid()
                AND ar.status = 'accepted'
            )
        )
        OR
        -- Old assignments without class_id (show to all students - backward compatibility)
        (assignments.class_id IS NULL)
    )
);

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Note: This migration adds class_id, subject_id, and topic columns
-- Existing assignments will have NULL class_id and will still work
-- New assignments created through the class-first UI will have class_id set
