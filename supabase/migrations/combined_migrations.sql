
-- ==================================================
-- START OF FILE: user_profiles_and_roles.sql
-- ==================================================
-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'lecturer', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  bio TEXT,
  student_id TEXT,
  program TEXT,
  year TEXT,
  department TEXT,
  gpa DECIMAL(3,2),
  credits_completed INTEGER DEFAULT 0,
  credits_required INTEGER DEFAULT 120,
  advisor TEXT,
  enrollment_date DATE,
  expected_graduation DATE,
  avatar_url TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'United States',
  verified BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  assignment_reminders BOOLEAN DEFAULT true,
  grade_updates BOOLEAN DEFAULT true,
  course_announcements BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'America/New_York',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  
  -- Default to student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, COALESCE((new.raw_user_meta_data ->> 'role')::app_role, 'student'));
  
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- END OF FILE: user_profiles_and_roles.sql

-- ==================================================
-- START OF FILE: lms_initial_core_schema.sql
-- ==================================================
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

-- END OF FILE: lms_initial_core_schema.sql

-- ==================================================
-- START OF FILE: core_classes_system.sql
-- ==================================================
-- =====================================================
-- Class Management System Migration
-- Creates role-specific profiles, classes, and notification system
-- =====================================================

-- =====================================================
-- 1. ROLE-SPECIFIC PROFILE TABLES
-- =====================================================

-- Lecturer Profiles Table
CREATE TABLE IF NOT EXISTS public.lecturer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT NOT NULL,
    profile_image TEXT,
    phone TEXT,
    office_location TEXT,
    office_hours TEXT,
    bio TEXT,
    specialization TEXT,
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT true,
    assignment_notifications BOOLEAN DEFAULT true,
    submission_notifications BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Student Profiles Table
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    register_number TEXT UNIQUE,
    department TEXT,
    course TEXT,
    year TEXT,
    section TEXT,
    phone TEXT,
    profile_image TEXT,
    bio TEXT,
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT true,
    assignment_reminders BOOLEAN DEFAULT true,
    grade_updates BOOLEAN DEFAULT true,
    schedule_updates BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. CLASS MANAGEMENT TABLES
-- =====================================================

-- Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    class_name TEXT, -- e.g., "Section A", "Morning Batch"
    semester TEXT,
    academic_year TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Class Students Table (Maps students to classes)
CREATE TABLE IF NOT EXISTS public.class_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    register_number TEXT NOT NULL,
    student_name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT,
    course TEXT,
    year TEXT,
    section TEXT,
    phone TEXT,
    import_source TEXT DEFAULT 'manual', -- 'manual' or 'excel'
    added_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, student_id),
    UNIQUE(class_id, register_number)
);

-- Access Requests Table
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    sent_at TIMESTAMPTZ DEFAULT now(),
    responded_at TIMESTAMPTZ,
    UNIQUE(class_id, student_id)
);

-- =====================================================
-- 3. UPDATE EXISTING TABLES
-- =====================================================

-- Add class_id to conversations table (if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations' 
        AND column_name = 'class_id'
    ) THEN
        ALTER TABLE public.conversations 
        ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
        ADD COLUMN is_class_conversation BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update notifications table for class-scoped notifications
DO $$ 
BEGIN
    -- Add class_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'class_id'
    ) THEN
        ALTER TABLE public.notifications 
        ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;
    END IF;

    -- Add sender_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'sender_id'
    ) THEN
        ALTER TABLE public.notifications 
        ADD COLUMN sender_id UUID REFERENCES auth.users(id);
    END IF;

    -- Rename user_id to recipient_id for clarity (if not already done)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE public.notifications 
        RENAME COLUMN user_id TO recipient_id;
    END IF;
END $$;

-- Update notification type constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('assignment', 'grade', 'announcement', 'message', 'schedule', 'access_request', 'general'));

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lecturer_profiles_user_id ON public.lecturer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_register_number ON public.student_profiles(register_number);

CREATE INDEX IF NOT EXISTS idx_classes_lecturer_id ON public.classes(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON public.classes(is_active);

CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON public.class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON public.class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_register_number ON public.class_students(register_number);

CREATE INDEX IF NOT EXISTS idx_access_requests_class_id ON public.access_requests(class_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_student_id ON public.access_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);

CREATE INDEX IF NOT EXISTS idx_conversations_class_id ON public.conversations(class_id);
CREATE INDEX IF NOT EXISTS idx_notifications_class_id ON public.notifications(class_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.lecturer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Lecturer Profiles Policies
CREATE POLICY "Lecturers can view their own profile"
ON public.lecturer_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Lecturers can update their own profile"
ON public.lecturer_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Lecturers can insert their own profile"
ON public.lecturer_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Student Profiles Policies
CREATE POLICY "Students can view their own profile"
ON public.student_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can update their own profile"
ON public.student_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own profile"
ON public.student_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Lecturers can view student profiles in their classes
CREATE POLICY "Lecturers can view students in their classes"
ON public.student_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.class_students cs
        JOIN public.classes c ON c.id = cs.class_id
        WHERE cs.student_id = student_profiles.user_id
        AND c.lecturer_id = auth.uid()
    )
);

-- Classes Policies
CREATE POLICY "Lecturers can manage their own classes"
ON public.classes FOR ALL
USING (auth.uid() = lecturer_id);

CREATE POLICY "Students can view classes they're enrolled in"
ON public.classes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.class_students cs
        WHERE cs.class_id = classes.id
        AND cs.student_id = auth.uid()
    )
);

-- Class Students Policies
CREATE POLICY "Lecturers can manage students in their classes"
ON public.class_students FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = class_students.class_id
        AND c.lecturer_id = auth.uid()
    )
);

CREATE POLICY "Students can view their own class enrollments"
ON public.class_students FOR SELECT
USING (auth.uid() = student_id);

-- Access Requests Policies
CREATE POLICY "Lecturers can manage access requests for their classes"
ON public.access_requests FOR ALL
USING (auth.uid() = lecturer_id);

CREATE POLICY "Students can view and respond to their access requests"
ON public.access_requests FOR ALL
USING (auth.uid() = student_id);

-- =====================================================
-- 6. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_lecturer_profiles_updated_at
BEFORE UPDATE ON public.lecturer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
BEFORE UPDATE ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. REAL-TIME SUBSCRIPTIONS
-- =====================================================

-- Enable real-time for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_requests;

-- =====================================================
-- 8. DATA MIGRATION (Optional - for existing users)
-- =====================================================

-- Migrate existing lecturer data from profiles to lecturer_profiles
INSERT INTO public.lecturer_profiles (
    user_id, full_name, email, department, profile_image, phone, bio,
    email_notifications, created_at, updated_at
)
SELECT 
    p.user_id, 
    p.full_name, 
    p.email, 
    COALESCE(p.department, 'Not Specified'),
    p.avatar_url,
    p.phone,
    p.bio,
    COALESCE(p.email_notifications, true),
    p.created_at,
    p.updated_at
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.user_id
WHERE ur.role = 'lecturer'
ON CONFLICT (user_id) DO NOTHING;

-- Migrate existing student data from profiles to student_profiles
INSERT INTO public.student_profiles (
    user_id, full_name, email, register_number, department, year, phone, profile_image, bio,
    email_notifications, assignment_reminders, grade_updates,
    created_at, updated_at
)
SELECT 
    p.user_id, 
    p.full_name, 
    p.email,
    p.student_id,
    p.department,
    p.year,
    p.phone,
    p.avatar_url,
    p.bio,
    COALESCE(p.email_notifications, true),
    COALESCE(p.assignment_reminders, true),
    COALESCE(p.grade_updates, true),
    p.created_at,
    p.updated_at
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.user_id
WHERE ur.role = 'student'
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- END OF FILE: core_classes_system.sql

-- ==================================================
-- START OF FILE: subjects_management.sql
-- ==================================================
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

-- END OF FILE: subjects_management.sql

-- ==================================================
-- START OF FILE: allow_retake.sql
-- ==================================================

-- Add is_archived column to quiz_submissions
alter table public.quiz_submissions 
add column if not exists is_archived boolean default false;

-- Drop existing unique constraint
alter table public.quiz_submissions 
drop constraint if exists quiz_submissions_quiz_id_student_id_key;

-- Add partial unique index for active submissions only
create unique index if not exists quiz_submissions_active_attempt_key 
on public.quiz_submissions (quiz_id, student_id) 
where is_archived = false;

-- Setup RLS for Lecturers to update submissions (to archive them)
create policy "Lecturers can update submissions for their quizzes"
  on public.quiz_submissions
  for update
  using (
    exists (
      select 1 from public.quizzes
      join public.classes on classes.id = quizzes.class_id
      where quizzes.id = quiz_submissions.quiz_id
      and classes.lecturer_id = auth.uid()
    )
  );

-- END OF FILE: allow_retake.sql

-- ==================================================
-- START OF FILE: assignment_class_migration.sql
-- ==================================================
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

-- END OF FILE: assignment_class_migration.sql

-- ==================================================
-- START OF FILE: assignment_status_updates.sql
-- ==================================================
-- Allow new statuses in the check constraint
ALTER TABLE public.assignments
DROP CONSTRAINT IF EXISTS assignments_status_check;

ALTER TABLE public.assignments
ADD CONSTRAINT assignments_status_check
CHECK (status IN ('draft', 'published', 'active', 'closed', 'completed', 'archived'));

-- Update policy to allow students to see active and completed assignments
DROP POLICY IF EXISTS "Students can view assignments for enrolled classes" ON public.assignments;

CREATE POLICY "Students can view assignments for enrolled classes"
ON public.assignments FOR SELECT
USING (
    status IN ('published', 'active', 'completed') AND
    (
        -- New class-based assignments
        (
            class_id IS NOT NULL AND
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
        (class_id IS NULL)
    )
);

-- END OF FILE: assignment_status_updates.sql

-- ==================================================
-- START OF FILE: assignment_storage_policies.sql
-- ==================================================
-- =====================================================
-- Supabase Storage Policies for Assignment Submissions
-- =====================================================
-- Note: Run this AFTER creating the 'assignment-submissions' bucket in Supabase Dashboard

-- Students can upload their own submissions
-- Path format: {userId}/{assignmentId}/{timestamp}_{filename}
CREATE POLICY "Students can upload their submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assignment-submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can read their own submissions
CREATE POLICY "Students can read their submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignment-submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Lecturers can read all submissions for their assignments
CREATE POLICY "Lecturers can read assignment submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignment-submissions' AND
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.lecturer_id = auth.uid()
    )
);

-- Lecturers can delete submissions if needed (optional)
CREATE POLICY "Lecturers can delete submissions for their assignments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'assignment-submissions' AND
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.lecturer_id = auth.uid()
    )
);

-- END OF FILE: assignment_storage_policies.sql

-- ==================================================
-- START OF FILE: chat_visibility_clearing.sql
-- ==================================================
-- Add chat management fields to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS cleared_at JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS visible_to UUID[] DEFAULT NULL;

-- Initialize visible_to for existing conversations
UPDATE public.conversations
SET visible_to = ARRAY[participant_1, participant_2]
WHERE visible_to IS NULL;

-- Update RLS policies to respect visible_to
-- If a user deletes a chat, they shouldn't see it in the list (but we might need to select it to check for existence/resurrection)
-- The existing policy "Users can view their own conversations" checks participant_1/2.
-- We can keep that for security (ownership) and filter visibility in the application query, 
-- OR strictly enforce it here. 
-- Strict enforcement:
-- CREATE POLICY "Users can view active conversations"
-- ON public.conversations FOR SELECT
-- USING (auth.uid() = ANY(visible_to));
-- However, we likely want to allow fetching "deleted" chats to check if we need to "resurrect" them vs create new.
-- So we'll trust the application query to filter for the UI list, but allow selecting by ID if participant.

-- Comment on columns
COMMENT ON COLUMN public.conversations.cleared_at IS 'JSONB mapping user_id to timestamp. Messages before this timestamp are hidden for that user.';
COMMENT ON COLUMN public.conversations.visible_to IS 'Array of user_ids who have not deleted this conversation. If a user deletes the chat, their ID is removed.';

-- END OF FILE: chat_visibility_clearing.sql

-- ==================================================
-- START OF FILE: class_image_fields.sql
-- ==================================================
-- =====================================================
-- Add Image URL Fields to Classes and Students
-- Adds class_image_url and student_image_url for Cloudinary integration
-- =====================================================

-- Add image URL to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS class_image_url TEXT;

-- Add image URL to class_students table
ALTER TABLE public.class_students 
ADD COLUMN IF NOT EXISTS student_image_url TEXT;

-- Create indexes for faster image queries
CREATE INDEX IF NOT EXISTS idx_classes_with_images ON public.classes(class_image_url) WHERE class_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_with_images ON public.class_students(student_image_url) WHERE student_image_url IS NOT NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- END OF FILE: class_image_fields.sql

-- ==================================================
-- START OF FILE: class_lecturer_fields.sql
-- ==================================================
-- =====================================================
-- Add Lecturer Fields to Classes Table
-- Adds lecturer_name, lecturer_department, and lecturer_profile_image
-- to classes table for easier display without additional joins
-- =====================================================

-- Add lecturer fields to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS lecturer_name TEXT,
ADD COLUMN IF NOT EXISTS lecturer_department TEXT,
ADD COLUMN IF NOT EXISTS lecturer_profile_image TEXT;

-- Create index for faster queries by department
CREATE INDEX IF NOT EXISTS idx_classes_lecturer_department ON public.classes(lecturer_department);

-- Update existing classes with lecturer data from lecturer_profiles
UPDATE public.classes c
SET 
    lecturer_name = lp.full_name,
    lecturer_department = lp.department,
    lecturer_profile_image = lp.profile_image
FROM public.lecturer_profiles lp
WHERE c.lecturer_id = lp.user_id
AND (c.lecturer_name IS NULL OR c.lecturer_department IS NULL);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- END OF FILE: class_lecturer_fields.sql

-- ==================================================
-- START OF FILE: class_notification_privacy.sql
-- ==================================================
-- =====================================================
-- Update RLS Policies for Class-Scoped Notifications
-- =====================================================

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Students see notifications from accepted classes" ON public.notifications;

-- Students can only see notifications from accepted classes or general notifications
CREATE POLICY "Students see notifications from accepted classes"
ON public.notifications FOR SELECT
USING (
    recipient_id = auth.uid() AND
    (
        -- Class-scoped notifications (only if enrolled and accepted)
        (
            class_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.access_requests ar
                WHERE ar.class_id = notifications.class_id
                AND ar.student_id = auth.uid()
                AND ar.status = 'accepted'
            )
        )
        OR
        -- Non-class notifications (general notifications, access requests, etc.)
        class_id IS NULL
    )
);

-- Lecturers can see all their notifications
CREATE POLICY "Lecturers see all their notifications"
ON public.notifications FOR SELECT
USING (
    recipient_id = auth.uid()
);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (recipient_id = auth.uid());

-- =====================================================
-- Ensure Assignments RLS Supports Class-Scoped Access
-- =====================================================

-- Update student assignment viewing policy
DROP POLICY IF EXISTS "Students can view assignments for enrolled classes" ON public.assignments;

CREATE POLICY "Students can view assignments for enrolled classes"
ON public.assignments FOR SELECT
USING (
    (
        -- New class-based assignments (must be accepted)
        class_id IS NOT NULL AND
        (status = 'published' OR status = 'active') AND
        EXISTS (
            SELECT 1 FROM public.access_requests ar
            WHERE ar.class_id = assignments.class_id
            AND ar.student_id = auth.uid()
            AND ar.status = 'accepted'
        )
    )
    OR
    (
        -- Old course-based assignments (backward compatibility)
        class_id IS NULL AND
        status = 'published' AND
        EXISTS (
            SELECT 1 FROM public.course_enrollments e 
            WHERE e.course_id = assignments.course_id 
            AND e.student_id = auth.uid()
        )
    )
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- END OF FILE: class_notification_privacy.sql

-- ==================================================
-- START OF FILE: create_quiz_drafts.sql
-- ==================================================

-- Create quiz_drafts table
create table if not exists public.quiz_drafts (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  user_id uuid references auth.users(id) default auth.uid() not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(class_id, user_id) -- Only one draft per class per user
);

-- Enable RLS
alter table public.quiz_drafts enable row level security;

-- Policies
create policy "Users can manage their own drafts"
  on public.quiz_drafts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.quiz_drafts;

-- END OF FILE: create_quiz_drafts.sql

-- ==================================================
-- START OF FILE: create_quizzes.sql
-- ==================================================
-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Quizzes Table
create table if not exists public.quizzes (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  title text not null,
  description text,
  total_marks integer not null default 0,
  pass_percentage integer not null default 40,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) default auth.uid()
);

-- 2. Quiz Questions Table
create table if not exists public.quiz_questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question_text text not null,
  question_type text default 'multiple_choice',
  marks integer not null default 1,
  options jsonb not null default '[]'::jsonb, -- Array of {id, text}
  correct_answer text not null, -- Option ID
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Quiz Submissions Table
create table if not exists public.quiz_submissions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  student_id uuid references public.profiles(id) not null,
  total_obtained integer not null default 0,
  status text not null default 'pending' check (status in ('passed', 'failed', 'pending')),
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(quiz_id, student_id) -- One attempt per student
);

-- 4. Quiz Answers Table (for detailed record of student answers)
create table if not exists public.quiz_answers (
  id uuid default uuid_generate_v4() primary key,
  submission_id uuid references public.quiz_submissions(id) on delete cascade not null,
  question_id uuid references public.quiz_questions(id) on delete cascade not null,
  selected_option text not null,
  correct_option_id text, -- Store correct option ID for verification/history
  is_correct boolean not null default false
);

-- RLS POLICIES

-- Enable RLS
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_submissions enable row level security;
alter table public.quiz_answers enable row level security;

-- Quizzes Policies
create policy "Lecturers can manage their own class quizzes"
  on public.quizzes
  for all
  using (
    exists (
      select 1 from public.classes
      where classes.id = quizzes.class_id
      and classes.lecturer_id = auth.uid()
    )
  );

create policy "Students can view published quizzes for their classes"
  on public.quizzes
  for select
  using (
    status in ('published', 'closed')
    and exists (
       select 1 from public.class_students
       where class_students.class_id = quizzes.class_id
       and class_students.student_id = auth.uid()
    )
  );

-- Questions Policies
create policy "Lecturers can manage questions for their quizzes"
  on public.quiz_questions
  for all
  using (
    exists (
      select 1 from public.quizzes
      join public.classes on classes.id = quizzes.class_id
      where quizzes.id = quiz_questions.quiz_id
      and classes.lecturer_id = auth.uid()
    )
  );

create policy "Students can view questions for active quizzes"
  on public.quiz_questions
  for select
  using (
    exists (
      select 1 from public.quizzes
      join public.class_students on class_students.class_id = quizzes.class_id
      where quizzes.id = quiz_questions.quiz_id
      and class_students.student_id = auth.uid()
      and quizzes.status = 'published'
    )
  );

-- Submissions Policies
create policy "Lecturers can view all submissions for their quizzes"
  on public.quiz_submissions
  for select
  using (
    exists (
      select 1 from public.quizzes
      join public.classes on classes.id = quizzes.class_id
      where quizzes.id = quiz_submissions.quiz_id
      and classes.lecturer_id = auth.uid()
    )
  );

create policy "Students can insert their own submissions"
  on public.quiz_submissions
  for insert
  with check (auth.uid() = student_id);

create policy "Students can view their own submissions"
  on public.quiz_submissions
  for select
  using (auth.uid() = student_id);

CREATE POLICY "Students can update their own submissions"
  ON public.quiz_submissions FOR UPDATE
  USING (auth.uid() = student_id);
  
-- Answers Policies
create policy "Lecturers can view answers"
  on public.quiz_answers
  for select
  using (
    exists (
      select 1 from public.quiz_submissions
      join public.quizzes on quizzes.id = quiz_submissions.quiz_id
      join public.classes on classes.id = quizzes.class_id
      where quiz_submissions.id = quiz_answers.submission_id
      and classes.lecturer_id = auth.uid()
    )
  );

create policy "Students can insert their own answers"
  on public.quiz_answers
  for insert
  with check (
    exists (
      select 1 from public.quiz_submissions
      where quiz_submissions.id = quiz_answers.submission_id
      and quiz_submissions.student_id = auth.uid()
    )
  );

create policy "Students can view their own answers"
  on public.quiz_answers
  for select
  using (
    exists (
      select 1 from public.quiz_submissions
      where quiz_submissions.id = quiz_answers.submission_id
      and quiz_submissions.student_id = auth.uid()
    )
  );

-- REALTIME setup
alter publication supabase_realtime add table public.quizzes;
alter publication supabase_realtime add table public.quiz_submissions;

-- END OF FILE: create_quizzes.sql

-- ==================================================
-- START OF FILE: enhance_classes_requests.sql
-- ==================================================
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

-- END OF FILE: enhance_classes_requests.sql

-- ==================================================
-- START OF FILE: fix_access_requests_nullability.sql
-- ==================================================
-- =====================================================
-- Fix access_requests table to allow null student_id
-- This allows sending requests to students before they register
-- =====================================================

-- Make student_id nullable in access_requests
ALTER TABLE public.access_requests 
ALTER COLUMN student_id DROP NOT NULL;

-- Update unique constraint to allow multiple null student_ids
-- Drop existing constraint
ALTER TABLE public.access_requests 
DROP CONSTRAINT IF EXISTS access_requests_class_id_student_id_key;

-- Add new constraint that only applies when student_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS access_requests_class_student_unique 
ON public.access_requests(class_id, student_id) 
WHERE student_id IS NOT NULL;

-- Add unique constraint on email to prevent duplicate requests
CREATE UNIQUE INDEX IF NOT EXISTS access_requests_class_email_unique 
ON public.access_requests(class_id, student_email);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- END OF FILE: fix_access_requests_nullability.sql

-- ==================================================
-- START OF FILE: fix_class_students_nullability.sql
-- ==================================================
-- =====================================================
-- Fix class_students table to allow null student_id
-- This allows adding students before they register/accept
-- =====================================================

-- Make student_id nullable
ALTER TABLE public.class_students 
ALTER COLUMN student_id DROP NOT NULL;

-- Update unique constraint to allow multiple null student_ids
-- Drop existing constraint
ALTER TABLE public.class_students 
DROP CONSTRAINT IF EXISTS class_students_class_id_student_id_key;

-- Add new constraint that only applies when student_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS class_students_class_student_unique 
ON public.class_students(class_id, student_id) 
WHERE student_id IS NOT NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- END OF FILE: fix_class_students_nullability.sql

-- ==================================================
-- START OF FILE: fix_profile_linkage.sql
-- ==================================================
-- =====================================================
-- FIX: Add missing linked_user_id column to student_emails
-- This handles the case where the table existed but without the column
-- =====================================================

DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_emails' 
        AND column_name = 'linked_user_id'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.student_emails 
        ADD COLUMN linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added linked_user_id column to student_emails';
    ELSE
        RAISE NOTICE 'Column linked_user_id already exists in student_emails';
    END IF;
END $$;

-- Re-create the index just in case
CREATE INDEX IF NOT EXISTS idx_student_emails_linked_user ON public.student_emails(linked_user_id);

-- Also verify other potentially missing columns from the migration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'lecturer_name'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN lecturer_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'lecturer_department'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN lecturer_department TEXT;
    END IF;
END $$;

-- END OF FILE: fix_profile_linkage.sql

-- ==================================================
-- START OF FILE: flexible_notification_links.sql
-- ==================================================
-- Remove the restrictive foreign key on related_id which forces it to be a conversation
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_related_id_fkey;

-- END OF FILE: flexible_notification_links.sql

-- ==================================================
-- START OF FILE: general_storage_bucket.sql
-- ==================================================
-- Create a new storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

-- Policy to allow everyone to view/download files (since messages are shared)
-- In a stricter app, we might restrict this to conversation participants, 
-- but for now public read is efficient for the messaging UI as long as the URL is known.
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'message-attachments');

-- END OF FILE: general_storage_bucket.sql

-- ==================================================
-- START OF FILE: global_notification_settings.sql
-- ==================================================
-- Add notifications_enabled column to profiles table
-- This serves as the master toggle for all notifications

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'notifications_enabled'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.notifications_enabled IS 'Master toggle for all notifications. If false, no notifications are sent regardless of other settings.';

-- Update the student_profiles and lecturer_profiles views if they don't automatically pick up the new column
-- (Postgres views usually need to be recreated to include new columns from underlying tables if they were defined with SELECT *)
-- Checking if they are views first:
-- They seem to be defined as views in some projects, but in this project I haven't seen the specific view definition files yet.
-- Assuming they might be just direct queries or views. If they are views, they need a refresh.

-- Attempt to refresh views if they exist
DO $$
BEGIN
    -- Refresh student_profiles view if it exists
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'student_profiles') THEN
        -- This is a bit risky without knowing the exact definition, but often simply running a CREATE OR REPLACE VIEW with the same definition works.
        -- However, since I don't have the definition, I will rely on the fact that if they are simple views they might need manual update or if they are just the table used directly (which seems to be the case mostly in Supabase projects unless explicitly separated).
        -- Wait, looking at notificationService.ts, it selects from "student_profiles". 
        -- If "student_profiles" is a VIEW, it needs to be updated.
        -- If "student_profiles" is just the "profiles" table with a role filter (which is common), then nothing to do.
        -- Let's assume for now it might be a view or just the table. 
        NULL;
    END IF;
END $$;

-- END OF FILE: global_notification_settings.sql

-- ==================================================
-- START OF FILE: lecturer_profile_enhancements.sql
-- ==================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS batch text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hod_name text;

-- END OF FILE: lecturer_profile_enhancements.sql

-- ==================================================
-- START OF FILE: message_attachment_size.sql
-- ==================================================
-- Add attachment_size column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_size TEXT;

-- END OF FILE: message_attachment_size.sql

-- ==================================================
-- START OF FILE: message_editing_feature.sql
-- ==================================================
-- Add message editing fields
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- Create RPC function for secure message editing
CREATE OR REPLACE FUNCTION public.edit_message(
    message_id UUID,
    new_content TEXT,
    editing_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    msg RECORD;
BEGIN
    -- Fetch message
    SELECT * INTO msg FROM public.messages WHERE id = message_id;

    -- Check existence
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Message not found');
    END IF;

    -- Check ownership
    IF msg.sender_id != editing_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Check time limit (5 minutes)
    IF msg.created_at < (NOW() - INTERVAL '5 minutes') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Edit time limit exceeded');
    END IF;

    -- Check edit count limit (Max 2)
    IF msg.edit_count >= 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Edit count limit exceeded');
    END IF;

    -- Perform update
    UPDATE public.messages
    SET 
        content = new_content,
        is_edited = true,
        edit_count = edit_count + 1,
        last_edited_at = NOW()
    WHERE id = message_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- END OF FILE: message_editing_feature.sql

-- ==================================================
-- START OF FILE: message_notification_togglables.sql
-- ==================================================
-- Add message_notifications column to profiles table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'message_notifications') THEN 
        ALTER TABLE public.profiles ADD COLUMN message_notifications BOOLEAN DEFAULT true; 
    END IF; 
END $$;

-- END OF FILE: message_notification_togglables.sql

-- ==================================================
-- START OF FILE: messaging_rls_policies.sql
-- ==================================================
-- Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversations;

-- Re-create policies with explicit permissions

-- 1. SELECT: Users can specific rows where they are a participant
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (
    auth.uid() = participant_1 OR 
    auth.uid() = participant_2
);

-- 2. INSERT: Users can insert rows if they are one of the participants
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
    auth.uid() = participant_1 OR 
    auth.uid() = participant_2
);

-- 3. UPDATE: Users can update rows if they are one of the participants
CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
USING (
    auth.uid() = participant_1 OR 
    auth.uid() = participant_2
);

-- END OF FILE: messaging_rls_policies.sql

-- ==================================================
-- START OF FILE: notification_constraints_fix.sql
-- ==================================================
-- Fix notifications table foreign key constraints for sender_id and recipient_id
-- The existing constraints incorrectly reference profiles.id instead of profiles.user_id
-- This causes inserts to fail when using auth.users.id

DO $$ 
BEGIN
    -- 1. Fix sender_id FK
    -- Drop existing incorrect constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_sender_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_sender_id_fkey;
    END IF;

    -- Add correct constraint if column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'sender_id'
    ) THEN
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_sender_id_fkey
        FOREIGN KEY (sender_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE;
    END IF;

    -- 2. Fix recipient_id FK (Re-applying or ensuring it is correct)
    -- Drop existing incorrect constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_recipient_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_recipient_id_fkey;
    END IF;

    -- Add correct constraint if column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_recipient_id_fkey
        FOREIGN KEY (recipient_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- END OF FILE: notification_constraints_fix.sql

-- ==================================================
-- START OF FILE: notification_foreign_keys.sql
-- ==================================================
-- Fix notifications table foreign key constraint
-- The existing constraint notifications_recipient_id_fkey incorrectly references profiles.id instead of profiles.user_id
-- This causes inserts to fail when using auth.users.id (which matches profiles.user_id but not profiles.id)

DO $$ 
BEGIN
    -- Only proceed if the table and constraint exist/need fixing
    -- We'll try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_recipient_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_recipient_id_fkey;
    END IF;

    -- Add the correct constraint referencing profiles(user_id)
    -- We assume the column is named 'recipient_id' based on the error message
    -- If the column is 'user_id', we might need to adjust, but the error specified 'recipient_id'
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_recipient_id_fkey
        FOREIGN KEY (recipient_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE;
    END IF;

    -- If the column is named 'user_id' but the constraint was named 'notifications_recipient_id_fkey' (unlikely but possible)
    -- We handle that case too just to be safe if 'recipient_id' doesn't exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'user_id'
        AND NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'recipient_id'
        )
    ) THEN
        -- Check if we need to fix a constraint on user_id
        -- We won't blindly add it, usually user_id references auth.users
    END IF;

END $$;

-- END OF FILE: notification_foreign_keys.sql

-- ==================================================
-- START OF FILE: notification_tracking.sql
-- ==================================================
-- Enhance notifications table with action tracking
-- This migration adds fields needed for comprehensive bidirectional notifications
-- Note: sender_id and recipient_id already exist from previous migrations

-- Add action_type for specific action tracking (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'action_type'
    ) THEN
        ALTER TABLE public.notifications 
        ADD COLUMN action_type TEXT;
    END IF;
END $$;

-- Update type constraint to include submission type
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('assignment', 'grade', 'announcement', 'message', 'schedule', 'access_request', 'submission', 'general'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON public.notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_action_type ON public.notifications(action_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Add helpful comments
COMMENT ON COLUMN public.notifications.sender_id IS 'User who triggered this notification';
COMMENT ON COLUMN public.notifications.action_type IS 'Specific action: created, updated, submitted, accepted, rejected, etc.';

-- Update RLS policies to use recipient_id (if they still use user_id)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = recipient_id);

-- Ensure system can create notifications (already exists but recreate to be safe)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- END OF FILE: notification_tracking.sql

-- ==================================================
-- START OF FILE: profiles_storage.sql
-- ==================================================
-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');

CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');

CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');

-- END OF FILE: profiles_storage.sql

-- ==================================================
-- START OF FILE: refine_submissions_schema.sql
-- ==================================================
-- =====================================================
-- Complete Fix for assignment_submissions Table
-- =====================================================

-- First, let's check what policies exist
-- Run this to see all policies:
-- SELECT * FROM pg_policies WHERE tablename = 'assignment_submissions';

-- Drop ALL policies on assignment_submissions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'assignment_submissions' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.assignment_submissions';
    END LOOP;
END $$;

-- Drop ALL policies on assignments that might reference course_id
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'assignments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.assignments';
    END LOOP;
END $$;

-- Recreate assignment_submissions policies (simple, no joins)
CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own submissions"
ON public.assignment_submissions FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view all submissions"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments
        WHERE assignments.id = assignment_submissions.assignment_id
        AND assignments.lecturer_id = auth.uid()
    )
);

CREATE POLICY "Lecturers can update all submissions"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments
        WHERE assignments.id = assignment_submissions.assignment_id
        AND assignments.lecturer_id = auth.uid()
    )
);

-- Recreate assignments policies (using class_id, not course_id)
CREATE POLICY "Lecturers can view their assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (lecturer_id = auth.uid());

CREATE POLICY "Lecturers can insert their assignments"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (lecturer_id = auth.uid());

CREATE POLICY "Lecturers can update their assignments"
ON public.assignments FOR UPDATE
TO authenticated
USING (lecturer_id = auth.uid());

CREATE POLICY "Lecturers can delete their assignments"
ON public.assignments FOR DELETE
TO authenticated
USING (lecturer_id = auth.uid());

CREATE POLICY "Students can view published assignments for enrolled classes"
ON public.assignments FOR SELECT
TO authenticated
USING (
    (
        -- New class-based assignments (must be accepted)
        class_id IS NOT NULL AND
        (status = 'published' OR status = 'active') AND
        EXISTS (
            SELECT 1 FROM public.access_requests ar
            WHERE ar.class_id = assignments.class_id
            AND ar.student_id = auth.uid()
            AND ar.status = 'accepted'
        )
    )
);

-- Enable RLS
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- END OF FILE: refine_submissions_schema.sql

-- ==================================================
-- START OF FILE: remove_deprecated_course_id.sql
-- ==================================================
-- =====================================================
-- DEFINITIVE FIX: Remove ALL course_id References
-- =====================================================

-- Step 1: Drop all views that might reference course_id
DROP VIEW IF EXISTS public.assignment_details CASCADE;
DROP VIEW IF EXISTS public.student_assignments CASCADE;
DROP VIEW IF EXISTS public.lecturer_assignments CASCADE;

-- Step 2: Drop all functions that might reference course_id
DROP FUNCTION IF EXISTS public.get_student_assignments CASCADE;
DROP FUNCTION IF EXISTS public.get_lecturer_assignments CASCADE;

-- Step 3: Drop ALL triggers on assignments and assignment_submissions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
        AND event_object_table IN ('assignments', 'assignment_submissions')
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.' || quote_ident(r.event_object_table) || ' CASCADE';
    END LOOP;
END $$;

-- Step 4: Drop ALL policies on assignments
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'assignments' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.assignments CASCADE';
    END LOOP;
END $$;

-- Step 5: Drop ALL policies on assignment_submissions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'assignment_submissions' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.assignment_submissions CASCADE';
    END LOOP;
END $$;

-- Step 6: Recreate SIMPLE policies for assignments (NO JOINS, NO course_id)
CREATE POLICY "Lecturers can manage their own assignments"
ON public.assignments FOR ALL
TO authenticated
USING (lecturer_id = auth.uid())
WITH CHECK (lecturer_id = auth.uid());

CREATE POLICY "Students can view published assignments in their classes"
ON public.assignments FOR SELECT
TO authenticated
USING (
    (status = 'published' OR status = 'active') AND
    class_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.access_requests
        WHERE access_requests.class_id = assignments.class_id
        AND access_requests.student_id = auth.uid()
        AND access_requests.status = 'accepted'
    )
);

-- Step 7: Recreate SIMPLE policies for assignment_submissions (NO JOINS)
CREATE POLICY "Students manage their own submissions"
ON public.assignment_submissions FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Lecturers view submissions for their assignments"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments
        WHERE assignments.id = assignment_submissions.assignment_id
        AND assignments.lecturer_id = auth.uid()
    )
);

CREATE POLICY "Lecturers update submissions for their assignments"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments
        WHERE assignments.id = assignment_submissions.assignment_id
        AND assignments.lecturer_id = auth.uid()
    )
);

-- Step 8: Ensure RLS is enabled
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Step 9: Verify no course_id column exists in assignments
-- If it does exist, we need to know about it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'assignments' 
        AND column_name = 'course_id'
    ) THEN
        RAISE NOTICE 'WARNING: course_id column still exists in assignments table';
    ELSE
        RAISE NOTICE 'SUCCESS: No course_id column in assignments table';
    END IF;
END $$;

-- Step 10: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.assignment_submissions TO authenticated;

-- END OF FILE: remove_deprecated_course_id.sql

-- ==================================================
-- START OF FILE: schedule_class_association.sql
-- ==================================================
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

-- END OF FILE: schedule_class_association.sql

-- ==================================================
-- START OF FILE: standardize_notification_system.sql
-- ==================================================
-- DEFINITIVE FIX FOR RELATED_ID TYPE MISMATCH (UUID vs TEXT)
-- This migration:
-- 1. Drops the problematic triggers
-- 2. Ensures related_id in notifications is TEXT to support composite IDs (flexible)
-- 3. Re-implements the trigger using TEXT-safe operations

-- Part 1: Convert related_id to TEXT if it was changed to UUID
DO $$ 
BEGIN
    -- Only alter if it's currently UUID
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'related_id' 
        AND data_type = 'uuid'
    ) THEN
        -- Drop dependent indexes first
        DROP INDEX IF EXISTS public.idx_unique_notification_per_event;
        
        -- Alter column type
        ALTER TABLE public.notifications ALTER COLUMN related_id TYPE TEXT;
        
        -- Re-create the unique index
        CREATE UNIQUE INDEX idx_unique_notification_per_event
        ON public.notifications (recipient_id, related_id, type)
        WHERE related_id IS NOT NULL;
    END IF;
END $$;

-- Part 2: Drop existing triggers
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
        AND event_object_table = 'messages'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.messages';
    END LOOP;
END $$;

-- Part 3: Re-implement Trigger Function with TEXT related_id
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    recipient_prefs RECORD;
    message_preview TEXT;
    notif_related_id TEXT;
BEGIN
    -- 1. Self-message check
    IF NEW.sender_id = NEW.receiver_id THEN
        RETURN NEW;
    END IF;

    -- 2. Preferences check
    SELECT message_notifications, notifications_enabled
    INTO recipient_prefs
    FROM public.profiles
    WHERE user_id = NEW.receiver_id;

    IF (recipient_prefs.notifications_enabled IS FALSE) OR (recipient_prefs.message_notifications IS FALSE) THEN
        RETURN NEW;
    END IF;

    -- 3. Fetch Sender Name
    SELECT full_name INTO sender_name
    FROM public.profiles
    WHERE user_id = NEW.sender_id;

    IF sender_name IS NULL THEN
        sender_name := 'Someone';
    END IF;

    -- 4. Create Preview
    IF NEW.content IS NULL OR length(trim(NEW.content)) = 0 THEN
        IF NEW.attachment_url IS NOT NULL THEN
            message_preview := 'Sent an attachment';
        ELSE
            message_preview := 'Sent a message';
        END IF;
    ELSE
        IF length(NEW.content) > 100 THEN
            message_preview := substring(NEW.content from 1 for 100) || '...';
        ELSE
            message_preview := NEW.content;
        END IF;
    END IF;

    -- 5. Use Message ID as the related_id (Casted to TEXT for safety)
    notif_related_id := NEW.id::text;

    -- 6. Insert with Conflict Handling
    INSERT INTO public.notifications (
        recipient_id,
        sender_id,
        title,
        message,
        type,
        related_id,
        action_type,
        is_read
    ) VALUES (
        NEW.receiver_id,
        NEW.sender_id,
        'New message from ' || sender_name,
        message_preview,
        'message',
        notif_related_id,
        'sent',
        false
    )
    ON CONFLICT (recipient_id, related_id, type) 
    WHERE related_id IS NOT NULL 
    DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Part 4: Re-apply Trigger
CREATE TRIGGER on_new_message_notification_v3
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message_notification();

-- Ensure index stability
DROP INDEX IF EXISTS public.idx_unique_notification_per_event;
CREATE UNIQUE INDEX idx_unique_notification_per_event
ON public.notifications (recipient_id, related_id, type)
WHERE related_id IS NOT NULL;

COMMENT ON FUNCTION public.handle_new_message_notification IS 'Optimized message notification trigger with UUID/TEXT compatibility.';

-- END OF FILE: standardize_notification_system.sql

-- ==================================================
-- START OF FILE: student_emails_table.sql
-- ==================================================
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

-- END OF FILE: student_emails_table.sql

-- ==================================================
-- START OF FILE: submission_attachment_names.sql
-- ==================================================
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

-- END OF FILE: submission_attachment_names.sql

-- ==================================================
-- START OF FILE: submission_file_metadata.sql
-- ==================================================
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

-- END OF FILE: submission_file_metadata.sql

-- ==================================================
-- START OF FILE: submission_foreign_keys.sql
-- ==================================================
-- =====================================================
-- Fix assignment_submissions Foreign Key Constraints
-- =====================================================

-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.assignment_submissions 
DROP CONSTRAINT IF EXISTS assignment_submissions_student_id_fkey;

-- Add correct foreign key constraint pointing to auth.users
ALTER TABLE public.assignment_submissions
ADD CONSTRAINT assignment_submissions_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the constraint
COMMENT ON CONSTRAINT assignment_submissions_student_id_fkey ON public.assignment_submissions 
IS 'Foreign key to auth.users table for student identification';

-- END OF FILE: submission_foreign_keys.sql

-- ==================================================
-- START OF FILE: submission_rls_policies.sql
-- ==================================================
-- =====================================================
-- Fix RLS Policies for assignment_submissions Table
-- =====================================================

-- Drop all existing policies on assignment_submissions
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can insert their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Lecturers can view submissions for their assignments" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Lecturers can update submissions for their assignments" ON public.assignment_submissions;

-- Students can view their own submissions
CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can insert their own submissions
CREATE POLICY "Students can insert their own submissions"
ON public.assignment_submissions FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- Students can update their own submissions
CREATE POLICY "Students can update their own submissions"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (student_id = auth.uid());

-- Lecturers can view submissions for their assignments
CREATE POLICY "Lecturers can view submissions for their assignments"
ON public.assignment_submissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
        AND a.lecturer_id = auth.uid()
    )
);

-- Lecturers can update (grade) submissions for their assignments
CREATE POLICY "Lecturers can update submissions for their assignments"
ON public.assignment_submissions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
        AND a.lecturer_id = auth.uid()
    )
);

-- END OF FILE: submission_rls_policies.sql

-- ==================================================
-- START OF FILE: submission_text_field.sql
-- ==================================================
-- =====================================================
-- Add submission_text Column to assignment_submissions
-- =====================================================

-- Add submission_text column if it doesn't exist
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS submission_text TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.assignment_submissions.submission_text IS 'Text content or notes submitted by the student';

-- END OF FILE: submission_text_field.sql

-- ==================================================
-- START OF FILE: user_roles_rls_fix.sql
-- ==================================================
-- Fix user_roles RLS to allow viewing roles in messaging context
-- This allows users to see roles of people they have conversations with

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create more permissive policy for messaging context
CREATE POLICY "Users can view roles in messaging context"
ON public.user_roles
FOR SELECT
USING (
  -- Users can always view their own roles
  auth.uid() = user_id 
  OR
  -- Users can view roles of people they have conversations with
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.participant_1 = auth.uid() AND c.participant_2 = user_id)
       OR (c.participant_2 = auth.uid() AND c.participant_1 = user_id)
  )
  OR
  -- Lecturers can view student roles (for class management)
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'lecturer'
  )
);

-- Ensure the policy allows role viewing for profile queries
CREATE POLICY "Allow role viewing for profiles"
ON public.user_roles
FOR SELECT
USING (true); -- This is more permissive but roles aren't sensitive data

-- Drop the overly restrictive policy and use the more permissive one
DROP POLICY IF EXISTS "Users can view roles in messaging context" ON public.user_roles;

-- END OF FILE: user_roles_rls_fix.sql

-- ==================================================
-- START OF FILE: user_roles_setup.sql
-- ==================================================
-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create RLS policy
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- END OF FILE: user_roles_setup.sql

