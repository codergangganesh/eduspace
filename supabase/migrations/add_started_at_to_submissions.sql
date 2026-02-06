-- Add started_at and time_taken columns to quiz_submissions if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'quiz_submissions' and column_name = 'started_at') then
    alter table public.quiz_submissions add column started_at timestamp with time zone;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'quiz_submissions' and column_name = 'time_taken') then
    alter table public.quiz_submissions add column time_taken integer; -- Store duration in seconds
  end if;
end $$;
