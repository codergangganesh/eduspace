import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        // Generate unique filename to prevent overwrites and caching issues
        const timestamp = Date.now();
        // Sanitize filename but keep extension
        const fileExt = file.name.split('.').pop();
        const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
        const sanitizedName = fileNameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Construct new filename with timestamp
        const fileName = `${timestamp}_${sanitizedName}.${fileExt}`;
        const filePath = `${userId}/${assignmentId}/${fileName}`;

        console.log('Uploading file:', { fileName, filePath, size: file.size, type: file.type });

        // Convert file to ArrayBuffer to prevent "Failed to fetch" on mobile PWAs
        // Mobile WebViews/PWAs often fail to process 'FormData' with large 'File' objects,
        // causing arbitrary connection resets or network failures over tunnels (ngrok).
        const arrayBuffer = await file.arrayBuffer();

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('assignment-submissions')
            .upload(filePath, arrayBuffer, {
                contentType: file.type,
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
export const downloadAssignmentFile = async (filePath: string, originalFileName: string = 'assignment-file', defaultBucket: string = 'assignments') => {
    try {
        if (!filePath) return;
        
        let blob: Blob;

        if (filePath.startsWith('http')) {
            // If it's a full URL (Cloudinary or Supabase Public/Signed), fetch it directly
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Failed to fetch file');
            blob = await response.blob();
        } else {
            let bucket = defaultBucket;
            let finalPath = filePath;

            // Detect bucket from path if present (e.g., "assignment-submissions/guid/file.pdf")
            const knownBuckets = ['assignments', 'assignment-submissions', 'message-attachments', 'avatars'];
            for (const b of knownBuckets) {
                if (filePath.startsWith(`${b}/`)) {
                    bucket = b;
                    finalPath = filePath.substring(b.length + 1);
                    break;
                }
            }

            // Use Supabase Storage for relative paths
            const { data, error } = await supabase.storage
                .from(bucket)
                .download(finalPath);

            if (error) throw error;
            blob = data;
        }

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error: any) {
        console.error('Download error:', error);
        toast.error('Failed to download file', {
            description: error.message || 'Please try again later',
        });
    }
};

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
 * Resolve any storage string (path or legacy URL) to a working signed URL
 */
export async function resolveAnyStorageUrl(urlOrPath: string | null | undefined): Promise<string> {
    if (!urlOrPath) return '';
    
    // If it's already a signed URL (contains token), return as is
    if (urlOrPath.includes('token=')) return urlOrPath;

    let path = urlOrPath;
    let bucket = 'assignment-submissions'; // Default bucket

    console.log('[resolveAnyStorageUrl] Input:', urlOrPath);

    // 1. Determine bucket and extract relative path
    if (urlOrPath.startsWith('http')) {
        if (urlOrPath.includes('/message-attachments/')) {
            bucket = 'message-attachments';
            path = urlOrPath.split('/message-attachments/').pop() || '';
            // If it still has object/public prefix segments, clean them
            if (path.includes('object/public/')) {
                path = path.split('object/public/').pop()?.split('/').slice(1).join('/') || path;
            }
        } else if (urlOrPath.includes('/assignment-submissions/')) {
            bucket = 'assignment-submissions';
            path = urlOrPath.split('/assignment-submissions/').pop() || '';
        } else if (urlOrPath.includes('.supabase.co/storage/v1/object/')) {
            // General supabase storage URL
            const parts = urlOrPath.split('/object/public/');
            if (parts.length > 1) {
                const subParts = parts[1].split('/');
                bucket = subParts[0];
                path = subParts.slice(1).join('/');
            } else {
                const signParts = urlOrPath.split('/object/sign/');
                if (signParts.length > 1) {
                    const subParts = signParts[1].split('/');
                    bucket = subParts[0];
                    path = subParts.slice(1).join('/').split('?')[0];
                }
            }
        } else {
            // Not a recognized Supabase Storage URL
            return urlOrPath;
        }
    }

    // Sanitize path (remove query params if any)
    path = path.split('?')[0];
    
    console.log('[resolveAnyStorageUrl] Path resolved to:', { bucket, path });

    // 2. Try to get a signed URL (required for private/restricted buckets)
    try {
        // Use download: false to ensure disposition is 'inline' when possible
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 7200, { download: false });
        if (error) {
            console.error(`[resolveAnyStorageUrl] Signed URL error for ${bucket}/${path}:`, error.message);
            throw error;
        }
        if (data?.signedUrl) {
            console.log('[resolveAnyStorageUrl] SIGNED URL CREATED:', data.signedUrl);
            return data.signedUrl;
        }
    } catch (e) {
        console.warn('[resolveAnyStorageUrl] Failed to sign, falling back to public URL', e);
        // 3. Fallback: Return public URL
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }
    
    return urlOrPath;
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
