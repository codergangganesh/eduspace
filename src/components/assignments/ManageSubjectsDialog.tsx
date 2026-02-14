import { useState } from 'react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { useClassSubjects, Subject } from '@/hooks/useClassSubjects';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/layout/DeleteConfirmDialog';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classId: string;
}

export function ManageSubjectsDialog({ open, onOpenChange, classId }: Props) {
    const { subjects, loading, createSubject, updateSubject, deleteSubject } =
        useClassSubjects(classId);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
    });
    const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!formData.name) {
            toast.error('Subject name is required');
            return;
        }

        try {
            await createSubject(formData);
            setFormData({ name: '', code: '', description: '' });
            setIsAdding(false);
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleEdit = (subject: Subject) => {
        setEditingId(subject.id);
        setFormData({
            name: subject.name,
            code: subject.code || '',
            description: subject.description || '',
        });
    };

    const handleUpdate = async () => {
        if (!editingId || !formData.name) {
            toast.error('Subject name is required');
            return;
        }

        try {
            await updateSubject(editingId, formData);
            setEditingId(null);
            setFormData({ name: '', code: '', description: '' });
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleDelete = (subjectId: string) => {
        setSubjectToDelete(subjectId);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', code: '', description: '' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Subjects</DialogTitle>
                    <DialogDescription>
                        Add, edit, or remove subjects for this class. These subjects will be used
                        when creating assignments.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Add Subject Button */}
                    {!isAdding && !editingId && (
                        <Button onClick={() => setIsAdding(true)} className="gap-2">
                            <Plus className="size-4" />
                            Add Subject
                        </Button>
                    )}

                    {/* Add/Edit Form */}
                    {(isAdding || editingId) && (
                        <div className="border rounded-lg p-4 space-y-3">
                            <h4 className="font-semibold">
                                {isAdding ? 'Add New Subject' : 'Edit Subject'}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Subject Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Data Structures"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Subject Code</Label>
                                    <Input
                                        id="code"
                                        placeholder="e.g. CS201"
                                        value={formData.code}
                                        onChange={(e) =>
                                            setFormData({ ...formData, code: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Optional description..."
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={2}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={isAdding ? handleAdd : handleUpdate}
                                    disabled={!formData.name}
                                >
                                    {isAdding ? 'Add Subject' : 'Update Subject'}
                                </Button>
                                <Button variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Subjects Responsive List/Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : subjects.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
                            No subjects added yet. Click "Add Subject" to get started.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Desktop Table View */}
                            <div className="hidden md:block border rounded-2xl overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="font-bold">Subject Name</TableHead>
                                            <TableHead className="font-bold">Code</TableHead>
                                            <TableHead className="font-bold">Description</TableHead>
                                            <TableHead className="text-right font-bold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subjects.map((subject) => (
                                            <TableRow key={subject.id}>
                                                <TableCell className="font-bold text-slate-700 dark:text-slate-200">
                                                    {subject.name}
                                                </TableCell>
                                                <TableCell className="font-medium text-muted-foreground">{subject.code || '-'}</TableCell>
                                                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                                    {subject.description || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(subject)}
                                                            disabled={isAdding || editingId !== null}
                                                            className="h-8 w-8 rounded-full"
                                                        >
                                                            <Edit className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(subject.id)}
                                                            disabled={isAdding || editingId !== null}
                                                            className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {subjects.map((subject) => (
                                    <div key={subject.id} className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-black text-slate-800 dark:text-white">{subject.name}</p>
                                                {subject.code && <p className="text-[10px] font-bold text-muted-foreground uppercase">{subject.code}</p>}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(subject)}
                                                    disabled={isAdding || editingId !== null}
                                                    className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 shadow-sm"
                                                >
                                                    <Edit className="size-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(subject.id)}
                                                    disabled={isAdding || editingId !== null}
                                                    className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 shadow-sm text-destructive"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        {subject.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                                                {subject.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>

            <DeleteConfirmDialog
                open={!!subjectToDelete}
                onOpenChange={(open) => !open && setSubjectToDelete(null)}
                onConfirm={async () => {
                    if (subjectToDelete) {
                        try {
                            await deleteSubject(subjectToDelete);
                        } catch (error) {
                            // Error handled in hook
                        }
                        setSubjectToDelete(null);
                    }
                }}
                title="Delete Subject?"
                description="This will permanently delete the subject and its association with assignments. This cannot be undone."
            />
        </Dialog>
    );
}
