
-- Fix RLS for Students to join classes and see attendance
-- This migration ensures that invited students can see their invitations and link their accounts correctly.

-- 1. FIX ACCESS REQUESTS RLS
DROP POLICY IF EXISTS "Students can view and respond to their access requests" ON public.access_requests;
CREATE POLICY "Students can view and respond to their access requests"
ON public.access_requests FOR ALL
USING (
    auth.uid() = student_id 
    OR 
    student_email = (auth.jwt() ->> 'email')
);

-- 2. FIX CLASS STUDENTS RLS
DROP POLICY IF EXISTS "Students can view their own class enrollments" ON public.class_students;
CREATE POLICY "Students can view their own class enrollments"
ON public.class_students FOR SELECT
USING (
    auth.uid() = student_id 
    OR 
    email = (auth.jwt() ->> 'email')
);

-- Allow students to UPDATE their enrollment to link their student_id
DROP POLICY IF EXISTS "Students can link their accounts to enrollments" ON public.class_students;
CREATE POLICY "Students can link their accounts to enrollments"
ON public.class_students FOR UPDATE
USING (email = (auth.jwt() ->> 'email'))
WITH CHECK (student_id = auth.uid());

-- 3. FIX ATTENDANCE SESSIONS RLS
-- Students should be able to see sessions for classes they are enrolled in (by email)
DROP POLICY IF EXISTS "Students can view attendance sessions for their classes" ON public.attendance_sessions;
CREATE POLICY "Students can view attendance sessions for their classes"
ON public.attendance_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.class_students cs
        WHERE cs.class_id = attendance_sessions.class_id
        AND (cs.student_id = auth.uid() OR cs.email = (auth.jwt() ->> 'email'))
    )
);

-- 4. FIX ATTENDANCE RECORDS RLS
DROP POLICY IF EXISTS "Students can view their own attendance records" ON public.attendance_records;
CREATE POLICY "Students can view their own attendance records"
ON public.attendance_records FOR SELECT
USING (
    attendance_records.student_id = auth.uid() 
    OR 
    EXISTS (
        SELECT 1 FROM public.class_students cs 
        WHERE cs.id = attendance_records.enrollment_id 
        AND (cs.student_id = auth.uid() OR cs.email = (auth.jwt() ->> 'email'))
    )
);
