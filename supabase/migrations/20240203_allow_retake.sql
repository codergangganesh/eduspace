
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
