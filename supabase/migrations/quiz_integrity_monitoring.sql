create table if not exists public.quiz_integrity_events (
  id uuid default uuid_generate_v4() primary key,
  submission_id uuid references public.quiz_submissions(id) on delete cascade not null,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  student_id uuid references public.profiles(id) not null,
  event_type text not null check (
    event_type in (
      'fullscreen_enter',
      'fullscreen_exit',
      'tab_switch',
      'refresh_attempt',
      'idle_period',
      'multi_session_access',
      'resume_attempt',
      'warning_shown',
      'question_change',
      'submit'
    )
  ),
  details jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quiz_submissions
  add column if not exists progress_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists integrity_summary jsonb not null default '{}'::jsonb,
  add column if not exists last_activity_at timestamp with time zone,
  add column if not exists device_fingerprint text;

create index if not exists idx_quiz_integrity_events_quiz_submission
  on public.quiz_integrity_events (quiz_id, submission_id, created_at desc);

create index if not exists idx_quiz_integrity_events_student
  on public.quiz_integrity_events (student_id, created_at desc);

alter table public.quiz_integrity_events enable row level security;

drop policy if exists "Students can insert their own quiz integrity events" on public.quiz_integrity_events;
create policy "Students can insert their own quiz integrity events"
  on public.quiz_integrity_events
  for insert
  with check (auth.uid() = student_id);

drop policy if exists "Students can view their own quiz integrity events" on public.quiz_integrity_events;
create policy "Students can view their own quiz integrity events"
  on public.quiz_integrity_events
  for select
  using (auth.uid() = student_id);

drop policy if exists "Lecturers can view quiz integrity events" on public.quiz_integrity_events;
create policy "Lecturers can view quiz integrity events"
  on public.quiz_integrity_events
  for select
  using (
    exists (
      select 1
      from public.quizzes
      join public.classes on classes.id = quizzes.class_id
      where quizzes.id = quiz_integrity_events.quiz_id
        and classes.lecturer_id = auth.uid()
    )
  );

grant select, insert on public.quiz_integrity_events to authenticated;
