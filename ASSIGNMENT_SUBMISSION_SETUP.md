# Assignment Submission Workflow - Setup Guide

## Prerequisites

Before testing the assignment submission workflow, you need to set up Supabase Storage.

---

## Step 1: Create Storage Bucket

1. Open Supabase Dashboard
2. Navigate to **Storage** section
3. Click **Create Bucket**
4. Enter bucket name: `assignment-submissions`
5. Set bucket as **Private** (not public)
6. Click **Create Bucket**

---

## Step 2: Apply Database Migrations

Run these migrations in Supabase SQL Editor in order:

### 1. Add Attachment Columns
```sql
-- File: 20260127_add_attachment_name_to_submissions.sql
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS attachment_name TEXT;
```

### 2. Add File Metadata Columns
```sql
-- File: 20260127_add_submission_file_metadata.sql
ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS file_size BIGINT;

ALTER TABLE public.assignment_submissions 
ADD COLUMN IF NOT EXISTS file_type TEXT;
```

### 3. Apply Storage Policies
```sql
-- File: 20260127_storage_policies_assignments.sql
-- Students can upload their own submissions
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

-- Lecturers can read all submissions
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
```

---

## Step 3: Test Student Submission

1. **Login as Student**
2. Navigate to **Assignments** page
3. Click on an assignment
4. Click **Submit Assignment**
5. Fill in details:
   - Student Name
   - Register Number
   - Upload file (PDF, DOC, PPT, ZIP, images, or text)
   - Add notes (optional)
6. Click **Submit Assignment**
7. Verify success message appears
8. Check assignment status changes to "Submitted"

---

## Step 4: Test Lecturer View

1. **Login as Lecturer**
2. Check notification bell for new submission notification
3. Click notification to navigate to submissions
4. Verify submission appears with:
   - Student name
   - File name
   - File size
   - Submission timestamp
5. Click download to test file retrieval
6. Verify downloaded file opens correctly

---

## Supported File Formats

- **Documents**: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
- **Archives**: ZIP, RAR, 7Z
- **Images**: JPG, JPEG, PNG, GIF, WEBP, SVG
- **Text**: TXT, CSV, HTML, CSS, JS, JSON

**Max file size**: 50MB

---

## Features Implemented

✅ **File Upload**: Supabase Storage integration
✅ **File Validation**: Type and size checks
✅ **All File Formats**: Support for documents, archives, images, text
✅ **File Metadata**: Size, type, name stored in database
✅ **Real-Time Updates**: Submission status updates instantly
✅ **Notifications**: Lecturer receives instant notification
✅ **File Download**: Reliable download with original content
✅ **Unique Naming**: Prevents file overwrites
✅ **Class-Scoped**: Notifications filtered by class enrollment

---

## Troubleshooting

### Upload Fails
- Check Supabase Storage bucket exists
- Verify storage policies are applied
- Check file size is under 50MB
- Verify file type is supported

### Download Fails
- Verify lecturer has permission to view submissions
- Check file path is stored correctly in database
- Verify storage policies allow lecturer access

### Notification Not Received
- Check notification RLS policies
- Verify `class_id` is set in notification
- Check lecturer is enrolled in the class

---

## File Storage Structure

Files are stored in Supabase Storage with this path format:
```
assignment-submissions/
  └── {student_id}/
      └── {assignment_id}/
          └── {timestamp}_{filename}
```

Example:
```
assignment-submissions/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 789e4567-e89b-12d3-a456-426614174001/
          └── 1706345678901_my_assignment.pdf
```

This structure:
- Organizes files by student
- Groups by assignment
- Prevents overwrites with timestamps
- Allows easy cleanup if needed
