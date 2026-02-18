import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { CalendarIcon, Loader2, Upload, X, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadAssignmentFile, validateAssignmentFile } from '@/lib/supabaseStorage';
import { useClassAssignments, CreateClassAssignmentDTO } from '@/hooks/useClassAssignments';
import { Subject } from '@/hooks/useClassSubjects';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
    classId: string;
    subjects: Subject[];
    onManageSubjects: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showTrigger?: boolean;
}

export function CreateClassAssignmentDialog({
    classId,
    subjects,
    onManageSubjects,
    open: externalOpen,
    onOpenChange: setExternalOpen,
    showTrigger = true
}: Props) {
    const { createAssignment } = useClassAssignments(classId);
    const { user } = useAuth();
    const [internalOpen, setInternalOpen] = useState(false);
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.subjectId || !date) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!file) {
            toast.error('Attachment is required. Please upload a file.');
            return;
        }

        setLoading(true);
        try {
            // Validate file
            const validation = validateAssignmentFile(file);
            if (!validation.valid) {
                toast.error(validation.error || 'Invalid file');
                setLoading(false);
                return;
            }

            // Upload file to Supabase Storage
            const uploadResult = await uploadAssignmentFile(
                file,
                user?.id || 'unknown',
                'new-assignment' // Placeholder, will be updated after creation
            );

            if (!uploadResult.success || !uploadResult.url) {
                throw new Error(uploadResult.error || 'Upload failed');
            }

            const assignmentData: CreateClassAssignmentDTO = {
                title: formData.title,
                description: formData.description,
                subject_id: formData.subjectId,
                topic: formData.topic || undefined,
                due_date: date,
                attachment_url: uploadResult.url,
                attachment_name: file.name,
            };

            const result = await createAssignment(assignmentData);

            if (result.success) {
                setOpen(false);
                // Reset form
                setFormData({ title: '', description: '', subjectId: '', topic: '' });
                setDate(undefined);
                setFile(null);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload attachment or create assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button className="hidden sm:flex gap-2">
                        <Plus className="size-4" />
                        Create Assignment
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden w-[calc(100vw-2rem)] sm:w-auto">
                <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                        Post a new assignment for this class. All fields marked with * are required.
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

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="subject">Subject *</Label>
                            <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={onManageSubjects}
                            >
                                Manage Subjects
                            </Button>
                        </div>
                        {subjects.length === 0 ? (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    No subjects found. Please add subjects first.
                                </AlertDescription>
                            </Alert>
                        ) : (
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
                        )}
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
                        <Label>Attachment *</Label>
                        {!file && (
                            <Alert variant="destructive" className="mb-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Attachment is mandatory. Please upload a file.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="size-4 mr-2" />
                                {file ? 'Change File' : 'Select File'}
                            </Button>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                            />
                            {file && (
                                <div className="flex items-center gap-2 text-sm bg-secondary px-3 py-1.5 rounded-lg sm:rounded-full w-full sm:w-auto min-w-0 justify-between sm:justify-start">
                                    <span className="truncate min-w-0 flex-1">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
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
                        <Button type="submit" disabled={loading || !file || subjects.length === 0}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Assignment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
