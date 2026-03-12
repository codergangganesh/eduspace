import { supabase } from "@/integrations/supabase/client";

export const uploadToSupabaseStorage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Mobile PWAs and strict browsers often corrupt or drop FormData limits over 
    // ngrok tunnels, immediately causing "Failed to fetch".
    // Converting the file to a raw ArrayBuffer bypasses the mobile FormData issues entirely.
    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, arrayBuffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        throw error;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

    return {
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size
    };
};
