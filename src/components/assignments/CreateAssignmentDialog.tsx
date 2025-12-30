import { useState, useRef } from "react";
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
import { CalendarIcon, Loader2, Upload, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { CreateAssignmentDTO } from "@/hooks/useLecturerAssignments";
import { toast } from "sonner";

interface Props {
    courses: { id: string; title: string; course_code: string }[];
    onCreate: (data: CreateAssignmentDTO) => Promise<{ success: boolean; error?: string }>;
}

export function CreateAssignmentDialog({ courses, onCreate }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>();
    const [file, setFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        courseId: "",
        maxPoints: "100",
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.courseId || !date) {
            toast.error("Please fill in all required fields (Title, Course, Due Date)");
            return;
        }

        setLoading(true);
        try {
            let attachmentUrl = undefined;
            let attachmentName = undefined;

            // Upload file to Cloudinary if selected
            if (file) {
                const uploadResult = await uploadToCloudinary(file);
                attachmentUrl = uploadResult.secure_url;
                attachmentName = file.name;
            }

            const assignmentData: CreateAssignmentDTO = {
                title: formData.title,
                description: formData.description,
                course_id: formData.courseId,
                due_date: date,
                max_points: parseInt(formData.maxPoints) || 100,
                attachment_url: attachmentUrl,
                attachment_name: attachmentName,
            };

            const result = await onCreate(assignmentData);

            if (result.success) {
                setOpen(false);
                // Reset form
                setFormData({ title: "", description: "", courseId: "", maxPoints: "100" });
                setDate(undefined);
                setFile(null);
            } else {
                toast.error(result.error || "Failed to create assignment");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                        Post a new assignment for your students.
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
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Course *</Label>
                            <Select
                                value={formData.courseId}
                                onValueChange={(val) => setFormData({ ...formData, courseId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Course" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.course_code} - {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Max Points</Label>
                            <Input
                                type="number"
                                value={formData.maxPoints}
                                onChange={(e) => setFormData({ ...formData, maxPoints: e.target.value })}
                            />
                        </div>
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
                        <Label>Attachment (Optional)</Label>
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="size-4 mr-2" />
                                Select File
                            </Button>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
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
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Assignment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
