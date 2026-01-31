
import { useNavigate } from "react-router-dom";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Assignment } from "@/hooks/useAssignments";
import { FileText, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardAssignmentListProps {
    assignments: Assignment[];
}

export function DashboardAssignmentList({ assignments }: DashboardAssignmentListProps) {
    const navigate = useNavigate();

    // Sort assignments: pending/overdue first, then by due date
    const sortedAssignments = [...assignments].sort((a, b) => {
        // Priority 1: Status (Pending/Overdue > Submitted/Graded)
        const isAPending = a.studentStatus === 'pending' || a.studentStatus === 'overdue';
        const isBPending = b.studentStatus === 'pending' || b.studentStatus === 'overdue';

        if (isAPending && !isBPending) return -1;
        if (!isAPending && isBPending) return 1;

        // Priority 2: Due Date (Earliest first)
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    const getStatusBadge = (status: string | undefined, dueDate: string | null) => {
        const isOverdue = status === 'overdue' || (status === 'pending' && dueDate && new Date(dueDate) < new Date());

        if (isOverdue) {
            return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="size-3" /> Overdue</Badge>;
        }

        switch (status) {
            case 'submitted':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 flex items-center gap-1"><CheckCircle className="size-3" /> Submitted</Badge>;
            case 'graded':
                return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1"><CheckCircle className="size-3" /> Graded</Badge>;
            default:
                return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 flex items-center gap-1"><Clock className="size-3" /> Pending</Badge>;
        }
    };

    if (assignments.length === 0) {
        return (
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        Assignments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <FileText className="size-12 mb-3 opacity-20" />
                        <p>No assignments found.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-2 overflow-hidden border-border bg-card">
            <CardHeader className="border-b bg-muted/40 pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FileText className="size-5 text-primary" />
                    Assignments
                    <Badge variant="outline" className="ml-2 font-normal">
                        {assignments.length} Total
                    </Badge>
                </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-[30%]">Title</TableHead>
                            <TableHead className="hidden md:table-cell">Class / Subject</TableHead>
                            <TableHead className="hidden lg:table-cell">Lecturer</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedAssignments.map((assignment) => (
                            <TableRow
                                key={assignment.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-foreground">{assignment.title}</span>
                                        <span className="text-xs text-muted-foreground md:hidden table-cell">
                                            {assignment.class_name} • {assignment.subject_name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-xs">{assignment.class_name || "Unknown Class"}</span>
                                        <span className="text-xs text-muted-foreground">{assignment.subject_name || "Unknown Subject"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                    {assignment.lecturer_name || "Unknown"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span className={cn(
                                            "font-medium",
                                            assignment.due_date && new Date(assignment.due_date) < new Date() && assignment.studentStatus === 'pending'
                                                ? "text-destructive"
                                                : "text-foreground"
                                        )}>
                                            {assignment.due_date ? format(parseISO(assignment.due_date), "MMM d, yyyy") : "No due date"}
                                        </span>
                                        {assignment.due_date && (
                                            <span className="text-xs text-muted-foreground">
                                                {format(parseISO(assignment.due_date), "h:mm a")}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {getStatusBadge(assignment.studentStatus, assignment.due_date)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
