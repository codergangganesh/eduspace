import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLecturerAssignments, Assignment } from "@/hooks/useLecturerAssignments";
import { CreateAssignmentDialog } from "@/components/assignments/CreateAssignmentDialog";
import { EditAssignmentDialog } from "@/components/assignments/EditAssignmentDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    Edit
} from "lucide-react";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LecturerAssignments() {
    const { assignments, courses, loading, createAssignment, updateAssignment, deleteAssignment, fetchSubjects } = useLecturerAssignments();
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleEditClick = (assignment: Assignment) => {
        setEditingAssignment(assignment);
        setIsEditOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assignment Management</h1>
                        <p className="text-muted-foreground mt-1">Create and manage course assignments</p>
                    </div>
                    <CreateAssignmentDialog courses={courses} onCreate={createAssignment} fetchSubjects={fetchSubjects} />
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

                {/* Assignments Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No assignments created yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    assignments.map((assignment) => (
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
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium capitalize">
                                                    {assignment.status || "Active"}
                                                </span>
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <EditAssignmentDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    assignment={editingAssignment}
                    onUpdate={updateAssignment}
                />
            </div>
        </DashboardLayout>
    );
}
