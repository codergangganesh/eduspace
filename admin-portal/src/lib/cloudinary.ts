export const uploadToCloudinary = async (
  file: File
): Promise<{ url: string; name: string; type: string; size: string }> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dnrjkqila";
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "eduspace_uploads";

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary configuration missing. Please check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const resourceType = file.type.startsWith("image/") ? "image" : "auto";

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
        mode: "cors",
        credentials: "omit",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: `Status ${response.status}: ${errorText.substring(0, 100)}` } };
      }
      throw new Error(errorData.error?.message || `Upload failed with status: ${response.status}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      name: file.name,
      type: file.type,
      size: (file.size / 1024).toFixed(1) + " KB",
    };
  } catch (error: any) {
    console.error("Cloudinary upload catch:", error);
    throw error;
  }
};
