
export const uploadToCloudinary = async (file: File): Promise<{ url: string; name: string; type: string; size: string }> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    // Check if it's an image or other type
    const resourceType = file.type.startsWith('image/') ? 'image' : 'auto';

    try {
        console.log(`Uploading to Cloudinary: ${cloudName}, resourceType: ${resourceType}`);
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
            {
                method: "POST",
                body: formData,
                // These options are critical for mobile browsers/ngrok to avoid "Failed to fetch" CORS errors
                mode: 'cors',
                credentials: 'omit',
                referrerPolicy: 'no-referrer'
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cloudinary API error response:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: { message: `Status ${response.status}: ${errorText.substring(0, 100)}` } };
            }
            throw new Error(errorData.error?.message || `Upload failed with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Cloudinary upload success:', data.secure_url);

        return {
            url: data.secure_url,
            name: file.name,
            type: file.type,
            size: (file.size / 1024).toFixed(1) + " KB",
        };
    } catch (error: any) {
        console.error('Cloudinary upload catch:', error);
        
        // Specific help for the user's reported mobile/ngrok issue
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            const msg = "Network error: 'Failed to fetch'. This is usually caused by network instability on mobile or file size limits in the ngrok tunnel. Please try a smaller file or a more stable connection.";
            console.warn(msg);
            throw new Error(msg);
        }
        
        throw error;
    }
};
