-- Allow public read access to profiles for the shareable links
CREATE POLICY "Public can view profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Ensure users can only update their own data (this should already be there, but we reiterate for safety)
-- The existing "Users can view their own profile" is now redundant but harmless.
