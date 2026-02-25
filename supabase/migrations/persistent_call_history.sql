-- Add deletion flags to call_sessions to allow users to hide calls from their history
-- without deleting the record for the other participant.

ALTER TABLE public.call_sessions 
ADD COLUMN IF NOT EXISTS is_hidden_by_caller BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hidden_by_receiver BOOLEAN DEFAULT false;

-- Update RLS policies to respect these hidden flags
DROP POLICY IF EXISTS "Users can view their own calls" ON public.call_sessions;

CREATE POLICY "Users can view their own calls"
ON public.call_sessions
FOR SELECT
USING (
    (auth.uid() = caller_id AND is_hidden_by_caller = false) OR 
    (auth.uid() = receiver_id AND is_hidden_by_receiver = false)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_call_sessions_hidden_caller ON public.call_sessions(caller_id, is_hidden_by_caller);
CREATE INDEX IF NOT EXISTS idx_call_sessions_hidden_receiver ON public.call_sessions(receiver_id, is_hidden_by_receiver);
