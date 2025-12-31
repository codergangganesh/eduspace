import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2, Upload, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { CreateAssignmentDTO, Assignment } from "@/hooks/useLecturerAssignments";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignment: Assignment | null;
    onUpdate: (id: string, data: Partial<CreateAssignmentDTO>) => Promise<{ success: boolean; error?: string }>;
}

export function EditAssignmentDialog({ open, onOpenChange, assignment, onUpdate }: Props) {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>();
    const [file, setFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subjectId: "", // Matches subject_name text field logic
    });

    // Populate form when assignment changes
    useEffect(() => {
        if (assignment) {
            setFormData({
                title: assignment.title,
                description: assignment.description || "",
                subjectId: assignment.subject_name || "",
            });
            if (assignment.due_date) {
                setDate(new Date(assignment.due_date));
            }
            setFile(null); // Reset file on new open
        }
    }, [assignment]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment) return;

        // Validation
        if (!formData.title || !formData.subjectId || !date) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            let attachmentUrl = assignment.attachment_url;
            let attachmentName = assignment.attachment_name;

            // Upload new file if selected
            if (file) {
                const uploadResult = await uploadToCloudinary(file);
                attachmentUrl = uploadResult.url;
                attachmentName = file.name;
            }

            const updateData: Partial<CreateAssignmentDTO> = {
                title: formData.title,
                description: formData.description,
                subject_id: formData.subjectId,
                due_date: date,
                attachment_url: attachmentUrl || "",
                attachment_name: attachmentName || "",
            };

            const result = await onUpdate(assignment.id, updateData);

            if (result.success) {
                onOpenChange(false);
                setFile(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update assignment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Assignment</DialogTitle>
                    <DialogDescription>
                        Update details for {assignment?.title}. Note: Course cannot be changed.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Assignment Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Data Structures Project 1"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    {/* Course field removed as requested */}

                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            placeholder="e.g. Data Structures, DBMS, etc."
                            value={formData.subjectId}
                            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Due Date *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    // Allow past dates if editing? Usually no, but let's keep it safe.
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Instructions / Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Enter detailed instructions..."
                            className="min-h-[100px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Attachment</Label>
                        {!file && assignment?.attachment_name && (
                            <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                                <span className="font-semibold">Current:</span>
                                <a href={assignment.attachment_url || "#"} target="_blank" className="underline hover:text-primary">
                                    {assignment.attachment_name}
                                </a>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="size-4 mr-2" />
                                {file ? "Change File" : "Replace File"}
                            </Button>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                            />
                            {file && (
                                <div className="flex items-center gap-2 text-sm bg-secondary px-3 py-1 rounded-full">
                                    <span className="truncate max-w-[200px]">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Assignment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
