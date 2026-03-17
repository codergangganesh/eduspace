
-- Attendance Management System Migration
-- Creates tables for attendance tracking and management

-- 1. ATTENDANCE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME,
    end_time TIME,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES public.class_students(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: link to direct user for easier querying
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(session_id, enrollment_id)
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_id ON public.attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_session_date ON public.attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_class_id ON public.attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records(student_id);

-- 4. ROW LEVEL SECURITY POLICIES

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Attendance Sessions Policies

-- Lecturers can manage sessions for their classes
CREATE POLICY "Lecturers can manage attendance sessions for their classes"
ON public.attendance_sessions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = attendance_sessions.class_id
        AND c.lecturer_id = auth.uid()
    )
);

-- Students can view sessions for their classes
CREATE POLICY "Students can view attendance sessions for their classes"
ON public.attendance_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.class_students cs
        WHERE cs.class_id = attendance_sessions.class_id
        AND cs.student_id = auth.uid()
    )
);

-- Attendance Records Policies

-- Lecturers can manage records for their classes
CREATE POLICY "Lecturers can manage attendance records for their classes"
ON public.attendance_records FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = attendance_records.class_id
        AND c.lecturer_id = auth.uid()
    )
);

-- Students can view only their own attendance records
CREATE POLICY "Students can view their own attendance records"
ON public.attendance_records FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.class_students cs
        WHERE cs.id = attendance_records.enrollment_id
        AND cs.student_id = auth.uid()
    )
);

-- 5. UPDATED_AT TRIGGERS
CREATE TRIGGER update_attendance_sessions_updated_at
BEFORE UPDATE ON public.attendance_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. REAL-TIME SUBSCRIPTIONS
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
