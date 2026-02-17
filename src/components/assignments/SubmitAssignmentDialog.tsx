import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText, Loader2, CheckCircle, Download, ExternalLink, Calendar, Clock, Trophy, AlertCircle, File, MoreVertical, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { uploadAssignmentFile, validateAssignmentFile } from "@/lib/supabaseStorage";
import { useStreak } from "@/contexts/StreakContext";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface SubmitAssignmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: any;
    onSubmit: (assignmentId: string, data: any) => Promise<{ success: boolean; error?: string }>;
    onDelete?: (submissionId: string) => Promise<void>;
}

export function SubmitAssignmentDialog({ isOpen, onClose, assignment, onSubmit, onDelete }: SubmitAssignmentDialogProps) {
    const { profile } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Form State
    const [studentName, setStudentName] = useState(profile?.full_name || "");
    const [regNumber, setRegNumber] = useState(profile?.student_id || "");
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load: Check if we are viewing an existing submission
    const existingSubmission = assignment.submission;
    const hasSubmission = !!existingSubmission;
    const isGraded = existingSubmission?.status === 'graded';

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            setStudentName(profile?.full_name || "");
            setRegNumber(profile?.student_id || "");
            setFile(null);
            setNotes("");
        }
    }, [isOpen, profile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const validation = validateAssignmentFile(selectedFile);
            if (!validation.valid) {
                toast.error(validation.error || 'Invalid file');
                return;
            }
            setFile(selectedFile);
        }
    };

    const { recordAcademicAction } = useStreak();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        if (!file && !notes) {
            toast.error("Please upload a file or add submission notes.");
            return;
        }

        setSubmitting(true);
        try {
            let attachmentUrl = undefined;
            let attachmentName = undefined;
            let fileType = undefined;
            let fileSize = undefined;

            console.log('[SubmitAssignmentDialog] Starting submission...');
            console.log('[SubmitAssignmentDialog] Has new file:', !!file);
            console.log('[SubmitAssignmentDialog] Has existing submission:', hasSubmission);
            console.log('[SubmitAssignmentDialog] Existing file:', existingSubmission?.attachment_name);

            if (file) {
                console.log('[SubmitAssignmentDialog] Uploading new file:', file.name);
                const uploadResult = await uploadAssignmentFile(
                    file,
                    profile?.user_id || 'unknown',
                    assignment.id
                );

                if (!uploadResult.success || !uploadResult.url) {
                    throw new Error(uploadResult.error || 'Upload failed');
                }
                attachmentUrl = uploadResult.url;
                attachmentName = file.name;
                fileType = file.type;
                fileSize = file.size;
                console.log('[SubmitAssignmentDialog] File uploaded successfully:', attachmentName);
                console.log('[SubmitAssignmentDialog] New file URL:', attachmentUrl);
            } else if (hasSubmission && !file) {
                // If checking for edit but no new file, keep existing
                attachmentUrl = existingSubmission?.attachment_url;
                attachmentName = existingSubmission?.attachment_name;
                fileType = existingSubmission?.file_type;
                fileSize = existingSubmission?.file_size;
                console.log('[SubmitAssignmentDialog] No new file, keeping existing:', attachmentName);
            }

            console.log('[SubmitAssignmentDialog] Submitting to database with file:', attachmentName);
            const result = await onSubmit(assignment.id, {
                submission_text: notes,
                attachment_url: attachmentUrl,
                attachment_name: attachmentName,
                file_type: fileType,
                file_size: fileSize,
            });

            if (result.success) {
                console.log('[SubmitAssignmentDialog] Submission successful!');
                await recordAcademicAction();
                toast.success(hasSubmission ? "Submission updated successfully!" : "Assignment submitted successfully!");

                // Reset form state
                setFile(null);
                setNotes("");

                onClose();
            } else {
                console.error('[SubmitAssignmentDialog] Submission failed:', result.error);
                toast.error(result.error || "Submission failed");
            }

        } catch (error: any) {
            console.error('[SubmitAssignmentDialog] Error:', error);
            toast.error("Error submitting assignment: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete || !existingSubmission?.id) return;

        try {
            await onDelete(existingSubmission.id);
            toast.success("Submission deleted successfully");
            setDeleteDialogOpen(false);
            onClose();
        } catch (error: any) {
            console.error('[SubmitAssignmentDialog] Delete error:', error);
            toast.error("Failed to delete submission");
        }
    };

    // Render View Mode for submitted assignments
    if (hasSubmission) {
        return (
            <>
                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                        <div className="p-6 border-b flex items-start justify-between bg-white dark:bg-slate-950 shrink-0 sticky top-0 z-10">
                            <div className="flex-1 pr-12">
                                <div className="flex flex-wrap items-start gap-3 mb-1.5">
                                    <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight">{assignment.title}</DialogTitle>
                                    <Badge variant={isGraded ? "default" : "secondary"} className={cn("mt-1 shrink-0 px-2 py-0.5 text-[10px] sm:text-xs uppercase tracking-wider font-bold", isGraded ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700")}>
                                        {isGraded ? "Graded" : "Submitted"}
                                    </Badge>
                                </div>
                                <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                                    <span className="font-semibold text-primary">{assignment.course_code}</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground">{assignment.lecturer_name}</span>
                                </DialogDescription>
                            </div>

                            <div className="flex items-center gap-2">
                                {!isGraded && onDelete && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                                <MoreVertical className="size-4" />
                                                <span className="sr-only">More options</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                                onClick={() => setDeleteDialogOpen(true)}
                                            >
                                                <Trash2 className="size-4 mr-2" />
                                                Delete Submission
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}

                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}>
                                    <X className="size-4" />
                                    <span className="sr-only">Close</span>
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            {assignment.due_date && (
                                <div className="flex justify-end mb-6">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md font-medium border border-border/50">
                                        <Clock className="size-3.5" />
                                        Due {format(new Date(assignment.due_date), "MMM d, h:mm a")}
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                                {/* LEFT COLUMN: Lecturer's Assignment */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                            <FileText className="size-4" /> Assignment Details
                                        </div>

                                        <div className="prose prose-sm dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{assignment.description || assignment.instructions || "No description provided."}</p>
                                        </div>
                                    </div>

                                    {assignment.attachment_url && (
                                        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl p-4 transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/20 group">
                                            <Label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-3 block uppercase tracking-wider">Resource Material</Label>
                                            <a
                                                href={assignment.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 group/link"
                                            >
                                                <div className="bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-xl group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                                                    <File className="size-6 text-indigo-600 dark:text-indigo-300" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover/link:underline decoration-indigo-500 underline-offset-2">
                                                        {assignment.attachment_name || "Attached Material"}
                                                    </p>
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                                                        Click to view <ExternalLink className="size-3" />
                                                    </p>
                                                </div>
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20 w-fit">
                                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-500">
                                            <Trophy className="size-4" />
                                        </div>
                                        <span>Max Points: <span className="font-bold text-slate-900 dark:text-white">{assignment.points || 100} Points</span></span>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Student's Work */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                        <CheckCircle className="size-4" /> Your Work
                                    </div>

                                    <Card className="overflow-hidden border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5 shadow-sm">
                                        <CardContent className="p-5 space-y-5">
                                            <div className="flex flex-wrapjustify-between items-start gap-4 border-b border-emerald-500/10 pb-4">
                                                <div>
                                                    <Label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 block">Submitted On</Label>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                        {existingSubmission.submitted_at ? format(new Date(existingSubmission.submitted_at), "MMM d, yyyy 'at' h:mm a") : "Unknown"}
                                                    </p>
                                                </div>
                                                {isGraded && (
                                                    <div className="text-right bg-white dark:bg-slate-950 px-3 py-2 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                                                        <Label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5 block">Grade</Label>
                                                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 leading-none">
                                                            {existingSubmission.grade}<span className="text-xs text-muted-foreground font-normal ml-0.5">/{assignment.points || 100}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {existingSubmission.submission_text && (
                                                <div>
                                                    <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wider">Your Notes</Label>
                                                    <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl text-sm italic border border-emerald-500/5 text-slate-700 dark:text-slate-300">
                                                        "{existingSubmission.submission_text}"
                                                    </div>
                                                </div>
                                            )}

                                            {existingSubmission.attachment_url ? (
                                                <div>
                                                    <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wider">Attached File</Label>
                                                    <a
                                                        href={existingSubmission.attachment_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all group"
                                                    >
                                                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                                                            <FileText className="size-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate block">{existingSubmission.attachment_name || "Your Submission"}</span>
                                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">Download PDF</span>
                                                        </div>
                                                        <Download className="size-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                                    </a>
                                                </div>
                                            ) : (
                                                !existingSubmission.submission_text && <p className="text-sm text-muted-foreground italic text-center py-2">No files attached.</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Feedback Section */}
                                    {existingSubmission.feedback && (
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5 shadow-sm">
                                            <h4 className="text-sm font-black text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                                <AlertCircle className="size-4" /> Lecturer Feedback
                                            </h4>
                                            <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed bg-white/50 dark:bg-black/10 p-3 rounded-xl">
                                                {existingSubmission.feedback}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete your work. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    // Render Form Mode
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{hasSubmission ? "Edit Submission" : "Submit Assignment"}</DialogTitle>
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
                        {hasSubmission && !file && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                Current file: {existingSubmission.attachment_name || "None"}
                            </p>
                        )}
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
                    <Button onClick={handleSubmit} disabled={submitting || (!file && !hasSubmission)}>
                        {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                        {hasSubmission ? "Update Submission" : "Submit Assignment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
