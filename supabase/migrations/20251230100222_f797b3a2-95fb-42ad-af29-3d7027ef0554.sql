-- Create courses table for lecturers to manage
CREATE TABLE public.courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lecturer_id UUID NOT NULL,
    course_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT,
    credits INTEGER DEFAULT 3,
    semester TEXT,
    schedule_info TEXT,
    max_students INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_enrollments table
CREATE TABLE public.course_enrollments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
    grade TEXT,
    UNIQUE(course_id, student_id)
);

-- Create assignments table
CREATE TABLE public.assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lecturer_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_points INTEGER DEFAULT 100,
    attachment_url TEXT,
    attachment_name TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignment_submissions table
CREATE TABLE public.assignment_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    submission_text TEXT,
    attachment_url TEXT,
    attachment_name TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    grade INTEGER,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
    UNIQUE(assignment_id, student_id)
);

-- Create schedules table for class schedules
CREATE TABLE public.schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    lecturer_id UUID NOT NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'lecture' CHECK (type IN ('lecture', 'lab', 'tutorial', 'exam', 'office_hours', 'event')),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    is_recurring BOOLEAN DEFAULT true,
    specific_date DATE,
    notes TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table for messaging
CREATE TABLE public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_1 UUID NOT NULL,
    participant_2 UUID NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(participant_1, participant_2)
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('assignment', 'grade', 'announcement', 'message', 'schedule', 'general')),
    related_id TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Lecturers can manage their own courses"
ON public.courses FOR ALL
USING (auth.uid() = lecturer_id);

CREATE POLICY "Students can view active courses"
ON public.courses FOR SELECT
USING (is_active = true);

-- Course enrollments policies
CREATE POLICY "Lecturers can view enrollments for their courses"
ON public.course_enrollments FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.lecturer_id = auth.uid()
));

CREATE POLICY "Lecturers can manage enrollments for their courses"
ON public.course_enrollments FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.lecturer_id = auth.uid()
));

CREATE POLICY "Students can view their own enrollments"
ON public.course_enrollments FOR SELECT
USING (auth.uid() = student_id);

-- Assignments policies
CREATE POLICY "Lecturers can manage their own assignments"
ON public.assignments FOR ALL
USING (auth.uid() = lecturer_id);

CREATE POLICY "Students can view published assignments for their courses"
ON public.assignments FOR SELECT
USING (
    status = 'published' AND
    EXISTS (
        SELECT 1 FROM public.course_enrollments e 
        WHERE e.course_id = assignments.course_id AND e.student_id = auth.uid()
    )
);

-- Assignment submissions policies
CREATE POLICY "Students can manage their own submissions"
ON public.assignment_submissions FOR ALL
USING (auth.uid() = student_id);

CREATE POLICY "Lecturers can view and grade submissions for their assignments"
ON public.assignment_submissions FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.lecturer_id = auth.uid()
));

-- Schedules policies
CREATE POLICY "Lecturers can manage their own schedules"
ON public.schedules FOR ALL
USING (auth.uid() = lecturer_id);

CREATE POLICY "Students can view schedules for their enrolled courses"
ON public.schedules FOR SELECT
USING (
    course_id IS NULL OR
    EXISTS (
        SELECT 1 FROM public.course_enrollments e 
        WHERE e.course_id = schedules.course_id AND e.student_id = auth.uid()
    )
);

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for messaging and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;

-- Create updated_at triggers
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();