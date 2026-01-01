// Cloudinary upload utility for handling image uploads
// Uses Cloudinary's unsigned upload preset

interface CloudinaryResponse {
    secure_url: string;
    public_id: string;
    format: string;
    width: number;
    height: number;
}

interface UploadResult {
    success: boolean;
    url?: string;
    publicId?: string;
    error?: string;
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Validate file before upload
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload JPG, PNG, or WebP images only.',
        };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File size too large. Maximum size is 5MB.',
        };
    }

    return { valid: true };
};

// Upload image to Cloudinary
export const uploadToCloudinary = async (file: File): Promise<UploadResult> => {
    // Validate environment variables
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        return {
            success: false,
            error: 'Cloudinary configuration missing. Please check environment variables.',
        };
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error,
        };
    }

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data: CloudinaryResponse = await response.json();

        return {
            success: true,
            url: data.secure_url,
            publicId: data.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: 'Failed to upload image. Please try again.',
        };
    }
};

// Delete image from Cloudinary (requires backend implementation for security)
// For now, we'll just remove the URL from database
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
    // Note: Actual deletion requires server-side implementation with API secret
    // For now, we just return true and remove URL from database
    // The image will remain in Cloudinary but won't be referenced
    console.log('Image marked for deletion:', publicId);
    return true;
};

// Get optimized image URL with transformations
export const getOptimizedImageUrl = (
    url: string,
    options?: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'auto' | 'jpg' | 'png' | 'webp';
    }
): string => {
    if (!url || !url.includes('cloudinary.com')) {
        return url;
    }

    const { width, height, quality = 80, format = 'auto' } = options || {};

    // Build transformation string
    const transformations = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);

    const transformString = transformations.join(',');

    // Insert transformation into URL
    return url.replace('/upload/', `/upload/${transformString}/`);
};
