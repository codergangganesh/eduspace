import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClassStudent } from "@/hooks/useClassStudents";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOptimizedImageUrl } from "@/utils/cloudinaryUpload";
import { Loader2 } from "lucide-react";
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

interface EditStudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: ClassStudent | null;
    onSave: (studentId: string, data: Record<string, string>) => Promise<void>;
    onImageUpload?: (studentId: string, imageUrl: string) => Promise<void>;
    onImageRemove?: (studentId: string) => Promise<void>;
}

export function EditStudentModal({
    open,
    onOpenChange,
    student,
    onSave,
    onImageUpload,
    onImageRemove,
}: EditStudentModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);

    const handleRemoveImage = async () => {
        if (!onImageRemove || !student) return;
        try {
            await onImageRemove(student.id);
            toast.success("Profile photo removed successfully");
            setShowRemoveDialog(false);
        } catch {
            toast.error("Failed to remove photo");
        }
    };
    const [formData, setFormData] = useState({
        student_name: "",
        register_number: "",
        email: "",
        department: "",
        course: "",
        year: "",
        section: "",
        phone: "",
    });

    useEffect(() => {
        if (student) {
            setFormData({
                student_name: student.student_name,
                register_number: student.register_number,
                email: student.email,
                department: student.department || "",
                course: student.course || "",
                year: student.year || "",
                section: student.section || "",
                phone: student.phone || "",
            });
        }
    }, [student, open]);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { uploadToCloudinary } = await import("@/utils/cloudinaryUpload");
            const result = await uploadToCloudinary(file);

            if (result.success && result.url) {
                if (onImageUpload && student) {
                    await onImageUpload(student.id, result.url);
                    toast.success("Profile photo updated successfully");
                }
            } else {
                toast.error(result.error || "Failed to upload image");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("An error occurred while uploading the image");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSave = async () => {
        // Validation
        if (!formData.student_name || !formData.register_number || !formData.email) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!student) {
            toast.error("No student selected");
            return;
        }

        setSaving(true);
        try {
            await onSave(student.id, formData);
            toast.success("Student updated successfully");
            onOpenChange(false);
        } catch {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Student</DialogTitle>
                    <DialogDescription>
                        Update student information. Changes will be saved immediately.
                    </DialogDescription>
                </DialogHeader>

                {/* Photo Editor */}
                {student && (
                    <div className="flex flex-col items-center justify-center p-6 border border-border bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl gap-3">
                        <Avatar className="size-20 border-4 border-background shadow-xl">
                            <AvatarImage src={student.student_image_url ? getOptimizedImageUrl(student.student_image_url, { width: 150, height: 150 }) : undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xl font-bold flex items-center justify-center">
                                {student.student_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        {/* Text Action Links */}
                        <div className="flex items-center gap-3 mt-1 h-6">
                            {uploading ? (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold animate-pulse">
                                    <Loader2 className="size-3 animate-spin text-primary" />
                                    <span>Uploading photo...</span>
                                </div>
                            ) : (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-bold text-primary hover:underline hover:text-primary/95 transition-all"
                                    >
                                        Change Photo
                                    </button>
                                    {student.student_image_url && onImageRemove && (
                                        <>
                                            <span className="text-muted-foreground/30 text-xs">•</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowRemoveDialog(true)}
                                                className="text-xs font-bold text-destructive hover:underline hover:text-destructive/95 transition-all"
                                            >
                                                Remove Photo
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="text-center mt-1">
                            <p className="text-sm font-bold text-foreground">{student.student_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{student.register_number}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="student_name">
                                Student Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="student_name"
                                value={formData.student_name}
                                onChange={(e) => handleChange("student_name", e.target.value)}
                                placeholder="Enter student name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="register_number">
                                Register Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="register_number"
                                value={formData.register_number}
                                onChange={(e) => handleChange("register_number", e.target.value)}
                                placeholder="e.g., 2024001"
                                disabled
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                placeholder="student@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                placeholder="+1234567890"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                value={formData.department}
                                onChange={(e) => handleChange("department", e.target.value)}
                                placeholder="e.g., Computer Science"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="course">Course</Label>
                            <Input
                                id="course"
                                value={formData.course}
                                onChange={(e) => handleChange("course", e.target.value)}
                                placeholder="e.g., B.Tech CS"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="year">Year</Label>
                            <Input
                                id="year"
                                value={formData.year}
                                onChange={(e) => handleChange("year", e.target.value)}
                                placeholder="e.g., 2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="section">Section</Label>
                            <Input
                                id="section"
                                value={formData.section}
                                onChange={(e) => handleChange("section", e.target.value)}
                                placeholder="e.g., A"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Update Student"}
                    </Button>
                </div>

                {/* Remove Confirmation Dialog */}
                <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove Image</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to remove this student's profile image? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleRemoveImage}
                                className="bg-destructive hover:bg-destructive/90 text-white"
                            >
                                Remove
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    );
}
