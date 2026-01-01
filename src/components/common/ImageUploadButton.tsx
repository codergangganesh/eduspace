import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { useState, useRef } from "react";
import { uploadToCloudinary } from "@/utils/cloudinaryUpload";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImageUploadButtonProps {
    currentImageUrl?: string | null;
    onImageUpload: (imageUrl: string) => Promise<void>;
    onImageRemove?: () => Promise<void>;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function ImageUploadButton({
    currentImageUrl,
    onImageUpload,
    onImageRemove,
    className = "",
    size = "md",
}: ImageUploadButtonProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            const result = await uploadToCloudinary(file);

            if (result.success && result.url) {
                await onImageUpload(result.url);
                toast({
                    title: "Image Uploaded",
                    description: "Image has been successfully uploaded",
                });
            } else {
                toast({
                    title: "Upload Failed",
                    description: result.error || "Failed to upload image",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "Upload Error",
                description: "An error occurred while uploading the image",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveImage = async () => {
        if (!onImageRemove) return;

        try {
            await onImageRemove();
            toast({
                title: "Image Removed",
                description: "Image has been successfully removed",
            });
            setShowRemoveDialog(false);
        } catch (error) {
            console.error("Remove error:", error);
            toast({
                title: "Remove Error",
                description: "Failed to remove image",
                variant: "destructive",
            });
        }
    };

    const sizeClasses = {
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
    };

    return (
        <>
            <div className={`relative inline-block ${className}`}>
                {/* Upload Button */}
                <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className={`${sizeClasses[size]} rounded-full bg-primary/10 hover:bg-primary/20 border-2 border-primary/20`}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                        <Camera className="size-4 text-primary" />
                    )}
                </Button>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Remove Button (shown if image exists) */}
                {currentImageUrl && onImageRemove && !uploading && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="size-6 rounded-full absolute -top-1 -right-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowRemoveDialog(true);
                        }}
                    >
                        <X className="size-3" />
                    </Button>
                )}
            </div>

            {/* Remove Confirmation Dialog */}
            <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Image</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this image? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveImage}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
