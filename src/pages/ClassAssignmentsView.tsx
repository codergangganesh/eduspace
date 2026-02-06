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

    const handleDeleteClick = async (assignmentId: string) => {
        if (confirm('Are you sure you want to delete this assignment?')) {
            await deleteAssignment(assignmentId);
        }
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
                {/* Breadcrumb & Header */}
                <div className="flex flex-col gap-4">
                    <Button
                        variant="ghost"
                        className="w-fit gap-2"
                        onClick={() => navigate('/lecturer/assignments')}
                    >
                        <ArrowLeft className="size-4" />
                        Back to Classes
                    </Button>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                {currentClass.class_name || currentClass.course_code}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {currentClass.course_code} • {currentClass.lecturer_department}
                                {currentClass.semester && ` • ${currentClass.semester}`}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsSubjectsOpen(true)}>
                                Manage Subjects
                            </Button>
                            <CreateClassAssignmentDialog
                                classId={classId!}
                                subjects={subjects}
                                onManageSubjects={() => setIsSubjectsOpen(true)}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <CheckCircle className="size-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active</p>
                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                    {assignments.filter((a) => a.status === 'active').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-slate-500/10 rounded-xl border border-slate-500/20">
                                <XCircle className="size-6 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Closed</p>
                                <p className="text-2xl font-bold text-slate-700 dark:text-slate-400">
                                    {assignments.filter((a) => a.status === 'closed').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <Users className="size-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Students</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{currentClass.student_count || 0}</p>
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
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssignments.map((assignment, index) => (
                            <AssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                role="lecturer"
                                index={index}
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
        </DashboardLayout >
    );
}
