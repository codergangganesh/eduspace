import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Calendar,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Download,
    ChevronRight,
    Edit,
    Trash2,
    MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getCardColor, getCardColorByIndex } from "@/lib/card-styles";
// ... imports

interface Assignment {
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    status: 'active' | 'closed' | 'archived' | 'completed' | 'graded' | 'submitted' | 'late' | 'pending' | 'overdue' | 'draft' | 'published';
    points?: number;
    attachment_url?: string;
    attachment_name?: string;
    created_at?: string;
    submission_count?: number;
    total_students?: number;
    course_code?: string;
    lecturer_name?: string;
    submission?: {
        submitted_at?: string;
        file_url?: string;
    };
}

interface AssignmentCardProps {
    assignment: Assignment;
    onView?: (id: string) => void;
    onEdit?: (assignment: Assignment) => void;
    onDelete?: (id: string) => void;
    role?: 'lecturer' | 'student';
    className?: string;
    onSubmit?: (assignment: Assignment) => void;
    index?: number;
}

export function AssignmentCard({
    assignment,
    onView,
    onEdit,
    onDelete,
    onSubmit,
    role = 'lecturer',
    className,
    index
}: AssignmentCardProps) {
    const colors = index !== undefined ? getCardColorByIndex(index) : getCardColor(assignment.id);

    // Status config
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active':
            case 'pending':
                return { color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icon: Clock, label: "Active" };
            case 'closed':
            case 'archived':
                return { color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800", icon: XCircle, label: "Closed" };
            case 'submitted':
                return { color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800", icon: CheckCircle2, label: "Submitted" };
            case 'graded':
            case 'completed':
                return { color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800", icon: CheckCircle2, label: "Graded" };
            case 'late':
            case 'overdue':
                return { color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800", icon: AlertCircle, label: "Overdue" };
            case 'draft':
                return { color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800", icon: FileText, label: "Draft" };
            case 'published':
                return { color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2, label: "Published" };
            default:
                return { color: "bg-slate-500/10 text-slate-600 border-slate-200", icon: FileText, label: status };
        }
    };

    const statusConfig = getStatusConfig(assignment.status);
    const StatusIcon = statusConfig.icon;

    return (
        <Card
            className={cn(
                "relative overflow-hidden border rounded-2xl transition-all duration-300 group",
                colors.bg,
                colors.border,
                "shadow-sm hover:shadow-md hover:scale-[1.01]",
                onView ? "cursor-pointer" : "",
                className
            )}
            onClick={() => onView?.(assignment.id)}
        >
            {/* Subtle textured overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: '16px 16px',
                color: 'inherit'
            }} />

            <CardContent className="p-0 relative z-10 flex flex-col h-full">
                <div className="p-5 flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "p-2.5 rounded-xl border shadow-sm backdrop-blur-sm shrink-0",
                                colors.iconBg,
                                colors.border
                            )}>
                                <FileText className={cn("size-5", colors.accent)} />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground line-clamp-2">
                                    {assignment.title}
                                </h3>
                                {/* Mobile Status Badge */}
                                <Badge variant="outline" className={cn("mt-2 sm:hidden text-[10px] px-2 py-0.5 border h-fit gap-1", statusConfig.color)}>
                                    <StatusIcon className="size-3" />
                                    {statusConfig.label}
                                </Badge>
                            </div>
                        </div>

                        {/* Actions Dropdown for Lecturer */}
                        {role === 'lecturer' && (onEdit || onDelete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onEdit && (
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(assignment);
                                        }}>
                                            <Edit className="size-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {onDelete && (
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(assignment.id);
                                        }} className="text-destructive">
                                            <Trash2 className="size-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Course Context (for Student View mainly) */}
                    {(assignment.course_code || assignment.lecturer_name) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {assignment.course_code && (
                                <Badge variant="secondary" className="text-[10px] h-5 rounded-md px-1.5 font-bold">
                                    {assignment.course_code}
                                </Badge>
                            )}
                            {assignment.lecturer_name && (
                                <span className="line-clamp-1">
                                    • {assignment.lecturer_name}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Description - Truncated */}
                    {assignment.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {assignment.description}
                        </p>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground pt-1">
                        {/* Due Date */}
                        <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                            <Calendar className="size-3.5 opacity-70" />
                            <span>
                                {assignment.due_date
                                    ? format(new Date(assignment.due_date), "MMM d, yyyy")
                                    : "No due date"}
                            </span>
                        </div>

                        {/* Points */}
                        {assignment.points !== undefined && (
                            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                                <span className={cn("font-medium", colors.accent)}>
                                    {assignment.points} Points
                                </span>
                            </div>
                        )}

                        {/* Status (Desktop) */}
                        <div className="hidden sm:flex items-center gap-2 col-span-2">
                            <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 border h-fit gap-1", statusConfig.color)}>
                                <StatusIcon className="size-3" />
                                {statusConfig.label}
                            </Badge>
                        </div>
                    </div>

                    {/* Student Submission Date */}
                    {role === 'student' && (assignment.status === 'submitted' || assignment.status === 'graded') && assignment.submission?.submitted_at && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 pl-0.5">
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                            <span>
                                Submitted on {format(new Date(assignment.submission.submitted_at), "MMM d, h:mm a")}
                            </span>
                        </div>
                    )}

                    {/* Lecturer Stats / Progress */}
                    {role === 'lecturer' && assignment.total_students !== undefined && (
                        <div className="space-y-1.5 pt-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Submissions</span>
                                <span className="font-medium text-foreground">
                                    {assignment.submission_count || 0} / {assignment.total_students || 0}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-500 bg-current", colors.accent)}
                                    style={{
                                        width: `${Math.min(100, ((assignment.submission_count || 0) / (assignment.total_students || 1)) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className={cn(
                    "px-5 py-3 border-t bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm flex items-center justify-between gap-3",
                    colors.border
                )}>
                    {assignment.attachment_url && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground text-xs h-8 gap-1.5 px-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(assignment.attachment_url, '_blank');
                            }}
                        >
                            <Download className="size-3.5" />
                            View File
                        </Button>
                    )}

                    <div className="flex gap-2 ml-auto">
                        {role === 'student' && onSubmit && (assignment.status === 'pending' || assignment.status === 'late') && (
                            <Button
                                size="sm"
                                className={cn(
                                    "h-8 gap-1.5 text-xs rounded-lg shadow-sm font-semibold",
                                    assignment.status === 'late' ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSubmit(assignment);
                                }}
                            >
                                {assignment.status === 'late' ? "Late Submit" : "Submit Now"}
                                <ChevronRight className="size-3.5" />
                            </Button>
                        )}

                        {onView && (
                            <Button
                                size="sm"
                                className={cn(
                                    "h-8 gap-1.5 text-xs rounded-lg shadow-none",
                                    colors.iconBg,
                                    colors.accent,
                                    "hover:opacity-80 transition-opacity bg-opacity-100"
                                )}
                                variant="secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView(assignment.id);
                                }}
                            >
                                {role === 'lecturer' ? 'Submission' : 'View'}
                                <ChevronRight className="size-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
