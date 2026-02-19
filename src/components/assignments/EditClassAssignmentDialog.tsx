import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useClassAssignments, ClassAssignment } from '@/hooks/useClassAssignments';
import { Subject } from '@/hooks/useClassSubjects';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignment: ClassAssignment | null;
    subjects: Subject[];
    classId: string;
}

export function EditClassAssignmentDialog({
    open,
    onOpenChange,
    assignment,
    subjects,
    classId,
}: Props) {
    const { updateAssignment } = useClassAssignments(classId);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date>();
    const [file, setFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subjectId: '',
        topic: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (assignment) {
            setFormData({
                title: assignment.title,
                description: assignment.description || '',
                subjectId: assignment.subject_id || '',
                topic: assignment.topic || '',
            });
            setDate(assignment.due_date ? new Date(assignment.due_date) : undefined);
            setFile(null);
        }
    }, [assignment]);

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
            toast.error('Please fill in all required fields');
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

            const result = await updateAssignment(assignment.id, {
                title: formData.title,
                description: formData.description,
                subject_id: formData.subjectId,
                topic: formData.topic || undefined,
                due_date: date,
                attachment_url: attachmentUrl || '',
                attachment_name: attachmentName || '',
            });

            if (result.success) {
                onOpenChange(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
                <DialogHeader>
                    <DialogTitle>Edit Assignment</DialogTitle>
                    <DialogDescription>
                        Update assignment details. All fields marked with * are required.
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
                        <Label htmlFor="subject">Subject *</Label>
                        <Select
                            value={formData.subjectId}
                            onValueChange={(value) =>
                                setFormData({ ...formData, subjectId: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id}>
                                        {subject.name}
                                        {subject.code && ` (${subject.code})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="topic">Topic / Unit (Optional)</Label>
                        <Input
                            id="topic"
                            placeholder="e.g. Linked Lists, Trees, etc."
                            value={formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Due Date *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !date && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
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
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Attachment (Optional - leave empty to keep current)</Label>
                        {assignment?.attachment_url && !file && (
                            <div className="text-sm text-muted-foreground mb-2">
                                Current: {assignment.attachment_name}
                            </div>
                        )}
                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="size-4 mr-2" />
                                {file ? 'Change File' : 'Upload New File'}
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
