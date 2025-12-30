
export const uploadToCloudinary = async (file: File): Promise<{ url: string; name: string; type: string; size: string }> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    // Add resource_type 'auto' to support pdfs, images, etc.
    // Cloudinary API defaults to 'image', so for PDFs we might need 'auto'

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Upload failed");
        }

        const data = await response.json();

        return {
            url: data.secure_url,
            name: file.name,
            type: file.type,
            size: (file.size / 1024).toFixed(1) + " KB", // Simple separate size formatting
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};
