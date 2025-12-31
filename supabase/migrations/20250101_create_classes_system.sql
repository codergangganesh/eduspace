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
