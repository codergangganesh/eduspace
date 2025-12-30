-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');

CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');

CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');
