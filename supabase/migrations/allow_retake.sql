
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

