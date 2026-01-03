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
