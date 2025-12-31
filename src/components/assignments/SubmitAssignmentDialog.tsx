import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SubmitAssignmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: any;
    onSubmit: (assignmentId: string, data: any) => Promise<{ success: boolean; error?: string }>;
}

export function SubmitAssignmentDialog({ isOpen, onClose, assignment, onSubmit }: SubmitAssignmentDialogProps) {
    const { profile } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [studentName, setStudentName] = useState(profile?.full_name || "");
    const [regNumber, setRegNumber] = useState(profile?.student_id || ""); // Assuming student_id is reg number
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== "application/pdf") {
                toast.error("Only PDF files are allowed.");
                return;
            }
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error("File size must be less than 10MB");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            toast.error("Please upload your assignment (PDF only).");
            return;
        }
        if (!studentName || !regNumber) {
            toast.error("Please fill in your details.");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Upload File (Cloudinary or Supabase Storage)
            // Using Cloudinary as per context from previous prompts (curl check)
            // But if I don't have the cloud name/preset easily, I should use `uploadFile` util if it existed.
            // Since we need to be robust, I'll simulate upload or use a direct fetch to the cloudinary url from env var (if accessible).
            // Actually, best practice: assume Supabase Storage or just base64 if small? No, PDF.
            // I'll check if there is an existing upload utility.

            // Re-use logic: The previous task mentioned Enable Profile Image Upload which used Cloudinary. I'll stick to a simple upload logic.
            // For now, I'll assume we have a function or I'll implement a direct upload here.

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "eduspace_uploads"); // Fallback

            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Upload failed");


            // 2. Submit to DB
            const result = await onSubmit(assignment.id, {
                submission_text: notes,
                attachment_url: uploadData.secure_url,
                attachment_name: file.name,
                // store metadata in description or logic?
                // The requirements asked to SUBMIT name/reg number. 
                // However, the `assignment_submissions` table doesn't have columns for that (it uses student_id).
                // We can append it to the content text.
                content: `Student: ${studentName}\nReg No: ${regNumber}\n\nNotes: ${notes}`
            });

            if (result.success) {
                toast.success("Assignment submitted successfully!");
                onClose();
            } else {
                toast.error(result.error || "Submission failed");
            }

        } catch (error: any) {
            console.error(error);
            toast.error("Error submitting assignment: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Submit Assignment</DialogTitle>
                    <DialogDescription>
                        Submit your work for <strong>{assignment.title}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Read-only info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground block">Subject</span>
                            <span className="font-medium">{assignment.subject_name || assignment.course_title}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">Lecturer</span>
                            <span className="font-medium">{assignment.lecturer_name}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Student Name</Label>
                        <Input
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="Your Full Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Register Number</Label>
                        <Input
                            value={regNumber}
                            onChange={(e) => setRegNumber(e.target.value)}
                            placeholder="e.g. REG12345"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Assignment File (PDF)</Label>
                        <div
                            className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex flex-col items-center justify-center text-center"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="application/pdf"
                                onChange={handleFileChange}
                            />
                            {file ? (
                                <div className="flex items-center gap-2 text-primary">
                                    <FileText className="size-6" />
                                    <span className="font-medium">{file.name}</span>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="size-8 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">Click to upload PDF</p>
                                    <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Additional Notes (Optional)</Label>
                        <Textarea
                            placeholder="Any comments for the lecturer..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !file}>
                        {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Submit Assignment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
