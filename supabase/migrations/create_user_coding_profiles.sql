-- Create user_coding_profiles table for caching LeetCode and Codeforces statistics
CREATE TABLE IF NOT EXISTS public.user_coding_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    leetcode_username TEXT,
    codeforces_handle TEXT,
    leetcode_data JSONB,
    codeforces_data JSONB,
    overall_data JSONB,
    leetcode_error TEXT,
    codeforces_error TEXT,
    last_fetched_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_coding_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own coding profile
CREATE POLICY "Users can view own coding profile"
    ON public.user_coding_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own coding profile
CREATE POLICY "Users can insert own coding profile"
    ON public.user_coding_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own coding profile
CREATE POLICY "Users can update own coding profile"
    ON public.user_coding_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow public viewing of coding profiles for public profile pages
CREATE POLICY "Public can view coding profiles"
    ON public.user_coding_profiles
    FOR SELECT
    USING (true);
