import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Upload, X, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { CreateAssignmentDTO, Subject } from "@/hooks/useLecturerAssignments";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface CreateAssignmentDialogProps {
    courses: { id: string; title: string; course_code: string }[];
    onCreate: (data: CreateAssignmentDTO) => Promise<{ success: boolean; error?: string }>;
    fetchSubjects: (classId: string) => Promise<Subject[]>;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CreateAssignmentDialog({ courses, onCreate, fetchSubjects, open: controlledOpen, onOpenChange: setControlledOpen }: CreateAssignmentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>();
    const [file, setFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        courseId: "",
        subjectId: "",
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.courseId || !formData.subjectId || !date) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!file) {
            toast.error("Attachment is required. Please upload a file.");
            return;
        }

        setLoading(true);
        try {
            // Upload file to Cloudinary (mandatory)
            const uploadResult = await uploadToCloudinary(file);

            const assignmentData: CreateAssignmentDTO = {
                title: formData.title,
                description: formData.description,
                course_id: formData.courseId,
                subject_id: formData.subjectId,
                due_date: date,
                attachment_url: uploadResult.url,
                attachment_name: file.name,
            };

            const result = await onCreate(assignmentData);

            if (result.success) {
                setOpen?.(false);
                // Reset form
                setFormData({ title: "", description: "", courseId: "", subjectId: "" });
                setDate(undefined);
                setFile(null);
            } else {
                toast.error(result.error || "Failed to create assignment");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload attachment or create assignment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    Create Assignment
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
                <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                        Post a new assignment for your students. All fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 py-2 sm:py-4">
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

                    <div className="space-y-2">
                        <Label htmlFor="course">Course Name *</Label>
                        <Input
                            id="course"
                            placeholder="e.g. Computer Science Engineering"
                            value={formData.courseId}
                            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                            required
                        />
                    </div>

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
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Instructions / Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Enter detailed instructions for the assignment..."
                            className="min-h-[100px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Attachment *</Label>
                        {/* <Alert variant={file ? "default" : "destructive"} className="mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {file ? "File selected successfully" : "Attachment is mandatory. Please upload a file."}
                            </AlertDescription>
                        </Alert> */}
                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="size-4 mr-2" />
                                {file ? "Change File" : "Select File"}
                            </Button>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                            />
                            {file && (
                                <div className="flex items-center gap-2 text-sm bg-secondary px-3 py-2 rounded-md max-w-full">
                                    <span className="break-all">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="text-muted-foreground hover:text-foreground shrink-0 ml-1 p-0.5"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setOpen?.(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !file}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Assignment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
