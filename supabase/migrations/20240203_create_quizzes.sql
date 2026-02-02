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
  student_id uuid references auth.users(id) not null,
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
