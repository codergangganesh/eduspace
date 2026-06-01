import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLecturerAssignments, Assignment } from "@/hooks/useLecturerAssignments";
import { CreateAssignmentDialog } from "@/components/assignments/CreateAssignmentDialog";
import { EditAssignmentDialog } from "@/components/assignments/EditAssignmentDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    FileText,
    MoreVertical,
    Calendar,
    Trash2,
    ExternalLink,
    Edit,
    Plus,
    Users,
    AlertCircle,
    Search,
    Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, isPast, isToday } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { useClasses } from "@/hooks/useClasses";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function LecturerAssignments() {
    const { assignments, courses, loading, createAssignment, updateAssignment, deleteAssignment, fetchSubjects } = useLecturerAssignments();
    const { classes } = useClasses();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'draft'>('all');

    // Client-side filtered assignments
    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => {
            const matchesSearch =
                a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.subject_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.course_code || '').toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === 'all') return true;
            if (statusFilter === 'draft') return a.status === 'draft';
            if (statusFilter === 'overdue') {
                if (!a.due_date) return false;
                const due = new Date(a.due_date);
                return isPast(due) && !isToday(due);
            }
            if (statusFilter === 'active') {
                if (a.status === 'draft') return false;
                if (!a.due_date) return true;
                const due = new Date(a.due_date);
                return !isPast(due) || isToday(due);
            }
            return true;
        });
    }, [assignments, searchQuery, statusFilter]);

    // ...

    const handleEditClick = (assignment: Assignment) => {
        setEditingAssignment(assignment);
        setIsEditOpen(true);
    };

    // Derive assignment status from due_date + stored status
    const getAssignmentStatus = (assignment: Assignment) => {
        if (assignment.status === 'draft') {
            return { label: 'Draft', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
        }
        if (!assignment.due_date) {
            return { label: 'Active', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
        }
        const due = new Date(assignment.due_date);
        if (isPast(due) && !isToday(due)) {
            return { label: 'Overdue', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
        }
        return { label: 'Active', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4 flex items-center gap-4">
                                <Skeleton className="size-12 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <TableSkeleton columns={4} rows={5} />
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assignment Management</h1>
                        <p className="text-muted-foreground mt-1">Create and manage course assignments</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateAssignmentOpen(true)}
                        className="gap-2 shrink-0 hidden sm:flex"
                    >
                        <Plus className="size-4" />
                        Create Assignment
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <FileText className="size-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Total Assignments</p>
                                <p className="text-2xl font-bold">{assignments.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title or subject..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 rounded-xl"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
                        {(['all', 'active', 'overdue', 'draft'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${
                                    statusFilter === f
                                        ? 'bg-white dark:bg-slate-900 text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Assignments Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Submissions</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAssignments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Filter className="size-8 opacity-30" />
                                                <p className="text-sm font-medium">
                                                    {searchQuery || statusFilter !== 'all'
                                                        ? 'No assignments match your search'
                                                        : 'No assignments created yet.'}
                                                </p>
                                                {(searchQuery || statusFilter !== 'all') && (
                                                    <button
                                                        onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAssignments.map((assignment) => {
                                        const statusInfo = getAssignmentStatus(assignment);
                                        return (
                                        <TableRow key={assignment.id}>
                                            <TableCell>
                                                <div className="font-medium text-foreground">{assignment.title}</div>
                                                {assignment.attachment_url && (
                                                    <a href={assignment.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                                                        <ExternalLink className="size-3" />
                                                        View Attachment
                                                    </a>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-sm text-foreground">
                                                    {assignment.subject_name || "General"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="size-4" />
                                                    <span>
                                                        {assignment.due_date ? format(new Date(assignment.due_date), "MMM d, yyyy") : "No due date"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-bold uppercase tracking-wide ${statusInfo.className}`}
                                                >
                                                    {statusInfo.label === 'Overdue' && <AlertCircle className="size-3 mr-1" />}
                                                    {statusInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Users className="size-3.5 text-muted-foreground" />
                                                    <span className="text-sm font-semibold tabular-nums">
                                                        {assignment.submission_count ?? 0}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditClick(assignment)}>
                                                            <Edit className="size-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteAssignment(assignment.id)}>
                                                            <Trash2 className="size-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <CreateAssignmentDialog
                    courses={courses}
                    onCreate={createAssignment}
                    fetchSubjects={fetchSubjects}
                    open={isCreateAssignmentOpen}
                    onOpenChange={setIsCreateAssignmentOpen}
                />

                <EditAssignmentDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    assignment={editingAssignment}
                    onUpdate={updateAssignment}
                />

                {/* Mobile FAB */}
                <div className="fixed bottom-6 right-6 sm:hidden z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Button
                        onClick={() => {
                            if (classes.length === 0) {
                                toast({
                                    title: "No Classes Found",
                                    description: "Please create a class before creating an assignment.",
                                });
                                navigate('/all-students'); // Redirect to Student Management (Create Class) page
                            } else {
                                setIsCreateAssignmentOpen(true);
                            }
                        }}
                        size="icon"
                        className="size-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all active:scale-95 border-4 border-background text-primary-foreground"
                        title="Create Assignment"
                    >
                        <Plus className="size-8 text-white" />
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
