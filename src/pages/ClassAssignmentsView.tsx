import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useClasses } from '@/hooks/useClasses';
import { useClassAssignments } from '@/hooks/useClassAssignments';
import { useClassSubjects } from '@/hooks/useClassSubjects';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ArrowLeft,
    Plus,
    Calendar,
    Users,
    FileText,
    MoreVertical,
    Edit,
    Trash2,
    ExternalLink,
    CheckCircle,
    XCircle,
    Eye,
    Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { CreateClassAssignmentDialog } from '@/components/assignments/CreateClassAssignmentDialog';
import { EditClassAssignmentDialog } from '@/components/assignments/EditClassAssignmentDialog';
import { ManageSubjectsDialog } from '@/components/assignments/ManageSubjectsDialog';
import { ClassAssignment } from '@/hooks/useClassAssignments';
import { AssignmentCard } from '@/components/assignments/AssignmentCard';
import { DeleteConfirmDialog } from '@/components/layout/DeleteConfirmDialog';
import { GridSkeleton } from '@/components/skeletons/GridSkeleton';

type FilterType = 'all' | 'active' | 'closed';

export default function ClassAssignmentsView() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const { classes } = useClasses();
    const { assignments, loading, deleteAssignment, updateAssignmentStatus } = useClassAssignments(classId || null);
    const { subjects } = useClassSubjects(classId || null);

    const [filter, setFilter] = useState<FilterType>('all');
    const [editingAssignment, setEditingAssignment] = useState<ClassAssignment | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

    const currentClass = classes.find((c) => c.id === classId);

    const filteredAssignments = assignments.filter((assignment) => {
        if (filter === 'all') return true;
        if (filter === 'active') return assignment.status === 'active';
        if (filter === 'closed') return assignment.status === 'closed';
        return true;
    });

    const handleEditClick = (assignment: ClassAssignment) => {
        setEditingAssignment(assignment);
        setIsEditOpen(true);
    };

    const handleDeleteClick = (assignmentId: string) => {
        setAssignmentToDelete(assignmentId);
    };

    const handleStatusToggle = async (assignmentId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'closed' : 'active';
        await updateAssignmentStatus(assignmentId, newStatus);
    };

    if (!currentClass) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">Class not found</p>
                    <Button onClick={() => navigate('/lecturer/assignments')}>
                        <ArrowLeft className="size-4 mr-2" />
                        Back to Classes
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/lecturer/assignments')}
                                className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 group shrink-0"
                            >
                                <ArrowLeft className="size-5 md:size-6 text-slate-600 dark:text-slate-400 group-hover:text-primary" />
                            </Button>
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400">
                                    {currentClass.class_name || currentClass.course_code}
                                </h1>
                                <p className="text-muted-foreground mt-1 text-xs md:text-sm">
                                    {currentClass.course_code} • {currentClass.lecturer_department}
                                    {currentClass.semester && ` • ${currentClass.semester}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsSubjectsOpen(true)}
                                className="hidden sm:flex rounded-xl h-10 px-4 md:h-12 border-slate-200 dark:border-slate-800 font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                            >
                                Manage Subjects
                            </Button>

                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="hidden sm:flex rounded-xl h-10 px-4 md:h-12 border-none font-bold transition-all shadow-lg hover:shadow-primary/20 bg-primary text-white gap-2"
                            >
                                <Plus className="size-5" />
                                <span>Create Assignment</span>
                            </Button>

                            <CreateClassAssignmentDialog
                                classId={classId!}
                                subjects={subjects}
                                onManageSubjects={() => setIsSubjectsOpen(true)}
                                open={isCreateOpen}
                                onOpenChange={setIsCreateOpen}
                                showTrigger={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    <Card className="border-none bg-gradient-to-br from-emerald-600 to-teal-700 shadow-xl rounded-2xl overflow-hidden group">
                        <CardContent className="p-3 sm:p-5 flex items-center gap-2 sm:gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <CheckCircle className="size-12 sm:size-20 text-white" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                <CheckCircle className="size-5 sm:size-7 text-white" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-xs text-emerald-100/80 font-semibold uppercase tracking-wider truncate">
                                    Active
                                </p>
                                <p className="text-xl sm:text-3xl font-black text-white">
                                    {assignments.filter((a) => a.status === 'active').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-gradient-to-br from-slate-600 to-slate-800 shadow-xl rounded-2xl overflow-hidden group">
                        <CardContent className="p-3 sm:p-5 flex items-center gap-2 sm:gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <XCircle className="size-12 sm:size-20 text-white" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                <XCircle className="size-5 sm:size-7 text-white" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-xs text-slate-100/80 font-semibold uppercase tracking-wider truncate">
                                    Closed
                                </p>
                                <p className="text-xl sm:text-3xl font-black text-white">
                                    {assignments.filter((a) => a.status === 'closed').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl rounded-2xl overflow-hidden group col-span-2 sm:col-span-1">
                        <CardContent className="p-3 sm:p-5 flex items-center gap-2 sm:gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Users className="size-12 sm:size-20 text-white" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                <Users className="size-5 sm:size-7 text-white" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-xs text-blue-100/80 font-semibold uppercase tracking-wider truncate">
                                    Students
                                </p>
                                <p className="text-xl sm:text-3xl font-black text-white">{currentClass.student_count || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="rounded-lg"
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('active')}
                        className="rounded-lg"
                    >
                        Active
                    </Button>
                    <Button
                        variant={filter === 'closed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('closed')}
                        className="rounded-lg"
                    >
                        Past / Closed
                    </Button>
                </div>

                {/* Assignments Grid */}
                {loading ? (
                    <GridSkeleton count={6} />
                ) : filteredAssignments.length === 0 ? (
                    <Card className="border-dashed bg-transparent shadow-none">
                        <CardContent className="p-12 text-center">
                            <FileText className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-semibold mb-2">
                                {filter === 'all' ? 'No assignments created yet' : `No ${filter} assignments`}
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                {filter === 'all'
                                    ? 'Create an assignment to get started'
                                    : 'Try adjusting your filters'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                        {filteredAssignments.map((assignment, index) => (
                            <AssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                role="lecturer"
                                index={index}
                                classId={classId!}
                                onView={(id) => navigate(`/lecturer/assignments/${classId}/${id}/submissions`)}
                            />
                        ))}
                    </div >
                )}

                {/* Dialogs */}
                <EditClassAssignmentDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    assignment={editingAssignment}
                    subjects={subjects}
                    classId={classId!}
                />

                <ManageSubjectsDialog
                    open={isSubjectsOpen}
                    onOpenChange={setIsSubjectsOpen}
                    classId={classId!}
                />


            </div >

            {/* Mobile FAB Menu */}
            <div className="fixed bottom-6 right-6 sm:hidden z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="icon"
                            className="size-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all active:scale-95 border-4 border-background text-primary-foreground"
                            title="Create"
                        >
                            <Plus className="size-8 text-white" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-64 p-2 rounded-2xl shadow-2xl border-none backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 mb-4">
                        <DropdownMenuItem onClick={() => setIsCreateOpen(true)} className="h-14 rounded-xl cursor-pointer gap-3 px-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                <FileText className="size-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base">Assignment</span>
                                <span className="text-[11px] text-muted-foreground leading-tight">Create a new class task</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsSubjectsOpen(true)} className="h-14 rounded-xl cursor-pointer gap-3 px-4">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                <Plus className="size-5 text-emerald-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base">Subject</span>
                                <span className="text-[11px] text-muted-foreground leading-tight">Add or edit subjects</span>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <DeleteConfirmDialog
                open={!!assignmentToDelete}
                onOpenChange={(open) => !open && setAssignmentToDelete(null)}
                onConfirm={async () => {
                    if (assignmentToDelete) {
                        await deleteAssignment(assignmentToDelete);
                        setAssignmentToDelete(null);
                    }
                }}
                title="Delete Assignment?"
                description="This will permanently delete the assignment and all student submissions associated with it. This action is irreversible."
            />
        </DashboardLayout >
    );
}
