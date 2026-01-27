import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
    success: boolean;
    url?: string;
    path?: string;
    error?: string;
}

/**
 * Upload file to Supabase Storage for assignment submissions
 * Path format: {userId}/{assignmentId}/{timestamp}_{filename}
 */
export async function uploadAssignmentFile(
    file: File,
    userId: string,
    assignmentId: string
): Promise<UploadResult> {
    try {
        // Generate unique filename to prevent overwrites
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${sanitizedName}`;
        const filePath = `${userId}/${assignmentId}/${fileName}`;

        console.log('Uploading file:', { fileName, filePath, size: file.size, type: file.type });

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('assignment-submissions')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false, // Prevent overwrites
            });

        if (error) {
            console.error('Upload error:', error);
            throw error;
        }

        console.log('Upload successful:', data);

        // Get public URL (for private buckets, this will be a signed URL)
        const { data: urlData } = supabase.storage
            .from('assignment-submissions')
            .getPublicUrl(filePath);

        return {
            success: true,
            url: urlData.publicUrl,
            path: filePath,
        };
    } catch (error: any) {
        console.error('File upload error:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload file',
        };
    }
}

/**
 * Download file from Supabase Storage
 */
export async function downloadAssignmentFile(
    filePath: string,
    originalFileName: string
): Promise<void> {
    try {
        console.log('Downloading file:', { filePath, originalFileName });

        const { data, error } = await supabase.storage
            .from('assignment-submissions')
            .download(filePath);

        if (error) {
            console.error('Download error:', error);
            throw error;
        }

        // Create download link
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = originalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('Download successful');
    } catch (error: any) {
        console.error('File download error:', error);
        throw new Error('Failed to download file');
    }
}

/**
 * Validate file before upload
 */
export function validateAssignmentFile(file: File): {
    valid: boolean;
    error?: string;
} {
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_TYPES = [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Archives
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        // Text
        'text/plain',
        'text/csv',
        'text/html',
        'text/css',
        'text/javascript',
        'application/json',
    ];

    if (file.size > MAX_SIZE) {
        return { valid: false, error: 'File size must be less than 50MB' };
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('text/')) {
        return {
            valid: false,
            error: `File type "${file.type}" is not supported. Please upload PDF, DOC, PPT, ZIP, images, or text files.`
        };
    }

    return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}
