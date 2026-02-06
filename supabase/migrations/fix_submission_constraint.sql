-- Drop the strict constraint that strictly prevents multiple submissions per version
-- This constraint blocks retakes even if the previous attempt is archived.
ALTER TABLE public.quiz_submissions DROP CONSTRAINT IF EXISTS quiz_submissions_version_attempt_key;

-- Also try dropping it as an index just in case it was created as a unique index
DROP INDEX IF EXISTS quiz_submissions_version_attempt_key;

-- Ensure we have the PARTIAL index that allows retakes
-- This ensures uniqueness only for ACTIVE (non-archived) submissions.
-- So you can have 10 archived submissions, and 1 active one.
CREATE UNIQUE INDEX IF NOT EXISTS quiz_submissions_active_attempt_key
ON public.quiz_submissions(quiz_id, student_id)
WHERE (is_archived = false);
