import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { uploadAssignmentFile, validateAssignmentFile } from "@/lib/supabaseStorage";
import { useStreak } from "@/contexts/StreakContext";

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
            // Validate file using Supabase Storage validator
            const validation = validateAssignmentFile(selectedFile);
            if (!validation.valid) {
                toast.error(validation.error || 'Invalid file');
                return;
            }
            setFile(selectedFile);
        }
    };

    const { recordAcademicAction } = useStreak();

    const handleSubmit = async () => {
        // ... validation ...
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
            // ... upload ...
            const uploadResult = await uploadAssignmentFile(
                file,
                profile?.user_id || 'unknown',
                assignment.id
            );

            if (!uploadResult.success || !uploadResult.url) {
                throw new Error(uploadResult.error || 'Upload failed');
            }

            // Record academic action
            await recordAcademicAction();

            // Submit to DB with file metadata
            const result = await onSubmit(assignment.id, {
                submission_text: notes,
                attachment_url: uploadResult.url,
                attachment_name: file.name,
                file_type: file.type,
                file_size: file.size,
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
