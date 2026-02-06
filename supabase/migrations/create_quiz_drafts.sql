
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
