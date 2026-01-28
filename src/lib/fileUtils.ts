/**
 * Format bytes to human-readable file size
 */
export function formatFileSize(bytes: number | undefined): string {
    if (!bytes || bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string | undefined): string {
    if (!filename) return '';

    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
}

/**
 * Get file type display name from MIME type
 */
export function getFileTypeDisplay(mimeType: string | undefined): string {
    if (!mimeType) return '';

    const typeMap: Record<string, string> = {
        'application/pdf': 'PDF',
        'application/msword': 'DOC',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'application/vnd.ms-excel': 'XLS',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
        'application/vnd.ms-powerpoint': 'PPT',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
        'text/plain': 'TXT',
        'image/jpeg': 'JPG',
        'image/png': 'PNG',
        'image/gif': 'GIF',
        'application/zip': 'ZIP',
        'application/x-rar-compressed': 'RAR',
    };

    return typeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || '';
}
