-- Add message_notifications column to profiles table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'message_notifications') THEN 
        ALTER TABLE public.profiles ADD COLUMN message_notifications BOOLEAN DEFAULT true; 
    END IF; 
END $$;
