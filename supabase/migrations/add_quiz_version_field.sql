-- Add quiz_version field to quiz_submissions table for version-aware retake logic
alter table public.quiz_submissions 
add column if not exists quiz_version integer default 1;

-- Ensure the partial unique constraint exists for active submissions
-- This prevents multiple active submissions per quiz per student
create unique index if not exists quiz_submissions_active_unique 
on public.quiz_submissions (quiz_id, student_id) 
where is_archived = false;

-- Add index for better query performance on version checks
create index if not exists idx_quiz_submissions_quiz_version 
on public.quiz_submissions (quiz_id, student_id, quiz_version);

-- Add index for checking submissions by student
create index if not exists idx_quiz_submissions_student_status 
on public.quiz_submissions (student_id, status) 
where is_archived = false;