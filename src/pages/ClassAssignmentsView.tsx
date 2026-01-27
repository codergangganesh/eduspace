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
} from 'lucide-react';
import { format } from 'date-fns';
import { CreateClassAssignmentDialog } from '@/components/assignments/CreateClassAssignmentDialog';
import { EditClassAssignmentDialog } from '@/components/assignments/EditClassAssignmentDialog';
import { ManageSubjectsDialog } from '@/components/assignments/ManageSubjectsDialog';
import { SubmissionDetailsDialog } from '@/components/assignments/SubmissionDetailsDialog';
import { ClassAssignment } from '@/hooks/useClassAssignments';

type FilterType = 'all' | 'active' | 'closed';

export default function ClassAssignmentsView() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const { classes } = useClasses();
    const { assignments, loading, deleteAssignment, updateAssignmentStatus } = useClassAssignments(classId || null);
    const { subjects } = useClassSubjects(classId || null);

    const [filter, setFilter] = useState<FilterType>('all');
    const [editingAssignment, setEditingAssignment] = useState<ClassAssignment | null>(null);
    const [viewSubmissionAssignment, setViewSubmissionAssignment] = useState<ClassAssignment | null>(null);
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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <FileText className="size-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Total Assignments
                                </p>
                                <p className="text-2xl font-bold">{assignments.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <CheckCircle className="size-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Active</p>
                                <p className="text-2xl font-bold">
                                    {assignments.filter((a) => a.status === 'active').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-gray-500/10 rounded-lg">
                                <XCircle className="size-6 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Closed</p>
                                <p className="text-2xl font-bold">
                                    {assignments.filter((a) => a.status === 'closed').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Users className="size-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Students</p>
                                <p className="text-2xl font-bold">{currentClass.student_count || 0}</p>
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
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('active')}
                    >
                        Active
                    </Button>
                    <Button
                        variant={filter === 'closed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('closed')}
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
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {filter === 'all' ? 'No assignments created yet' : `No ${filter} assignments`}
                            </h3>
                            <p className="text-muted-foreground">
                                {filter === 'all'
                                    ? 'Create an assignment to get started'
                                    : 'Try adjusting your filters'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssignments.map((assignment) => (
                            <Card key={assignment.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                                <CardContent className="p-6 flex flex-col h-full gap-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-lg line-clamp-2" title={assignment.title}>
                                                {assignment.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <Badge
                                                    variant={
                                                        assignment.status === 'active'
                                                            ? 'default'
                                                            : assignment.status === 'completed'
                                                                ? 'default' // usage of a success color would be better, but default is fine or custom class
                                                                : 'secondary'
                                                    }
                                                    className={
                                                        assignment.status === 'active'
                                                            ? 'bg-green-600 hover:bg-green-700'
                                                            : assignment.status === 'completed'
                                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                                : ''
                                                    }
                                                >
                                                    {assignment.status === 'completed' ? 'Completed' : assignment.status}
                                                </Badge>
                                                {assignment.subject_name && (
                                                    <Badge variant="outline">{assignment.subject_name}</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditClick(assignment)}>
                                                    <Edit className="size-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusToggle(assignment.id, assignment.status)}
                                                >
                                                    {assignment.status === 'active' ? (
                                                        <>
                                                            <XCircle className="size-4 mr-2" />
                                                            Close
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="size-4 mr-2" />
                                                            Activate
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteClick(assignment.id)}
                                                >
                                                    <Trash2 className="size-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground flex-1">
                                        {assignment.topic && (
                                            <p className="line-clamp-2">Topic: {assignment.topic}</p>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Calendar className="size-4" />
                                            <span>
                                                Due: {assignment.due_date ? format(new Date(assignment.due_date), "MMM d, yyyy") : "No due date"}
                                            </span>
                                        </div>
                                        {assignment.attachment_url && (
                                            <a
                                                href={assignment.attachment_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-primary hover:underline w-fit"
                                            >
                                                <ExternalLink className="size-4" />
                                                Attachment
                                            </a>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="size-4" />
                                                <span>Submissions</span>
                                            </div>
                                            <span className="font-medium">
                                                {assignment.submission_count || 0} / {assignment.total_students || 0}
                                            </span>
                                        </div>

                                        {/* Progress Bar could go here */}
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(100, ((assignment.submission_count || 0) / (assignment.total_students || 1)) * 100)}%`
                                                }}
                                            />
                                        </div>

                                        <Button
                                            className="w-full"
                                            variant="outline"
                                            onClick={() => setViewSubmissionAssignment(assignment)}
                                        >
                                            <Users className="size-4 mr-2" />
                                            Submission Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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

                {viewSubmissionAssignment && (
                    <SubmissionDetailsDialog
                        open={!!viewSubmissionAssignment}
                        onOpenChange={(open) => !open && setViewSubmissionAssignment(null)}
                        assignmentId={viewSubmissionAssignment.id}
                        classId={classId!}
                        assignmentTitle={viewSubmissionAssignment.title}
                        className={currentClass.class_name || currentClass.course_code}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
