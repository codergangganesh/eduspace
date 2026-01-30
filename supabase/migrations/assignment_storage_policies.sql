-- =====================================================
-- Supabase Storage Policies for Assignment Submissions
-- =====================================================
-- Note: Run this AFTER creating the 'assignment-submissions' bucket in Supabase Dashboard

-- Students can upload their own submissions
-- Path format: {userId}/{assignmentId}/{timestamp}_{filename}
CREATE POLICY "Students can upload their submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assignment-submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can read their own submissions
CREATE POLICY "Students can read their submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignment-submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Lecturers can read all submissions for their assignments
CREATE POLICY "Lecturers can read assignment submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignment-submissions' AND
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.lecturer_id = auth.uid()
    )
);

-- Lecturers can delete submissions if needed (optional)
CREATE POLICY "Lecturers can delete submissions for their assignments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'assignment-submissions' AND
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.lecturer_id = auth.uid()
    )
);
