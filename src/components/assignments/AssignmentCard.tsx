import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
    Trophy,
    Eye,
    UploadCloud,
    MoreVertical,
    Edit,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
    class_name?: string;
    subject_name?: string;
    lecturer_name?: string;
    instructor_avatar?: string; // Added for consistency if available
    submission?: {
        submitted_at?: string;
        file_url?: string;
        status?: string;
        grade?: number;
        feedback?: string;
    };
    studentStatus?: 'pending' | 'submitted' | 'graded' | 'overdue';
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
    classId?: string;
    viewMode?: 'grid' | 'list';
}

export function AssignmentCard({
    assignment,
    onView,
    onSubmit,
    onEdit,
    onDelete,
    role = 'lecturer',
    className,
    viewMode = 'grid'
}: AssignmentCardProps) {

    // Determine status logic (similar to QuizCard)
    const status = assignment.studentStatus || assignment.status || 'pending';
    const isSubmitted = status === 'submitted' || status === 'graded';
    const isGraded = status === 'graded';
    const isOverdue = status === 'overdue';
    const isLate = status === 'late';

    // Helper to get status color/icon
    const getStatusDetails = () => {
        if (isGraded) return { label: 'GRADED', color: 'bg-emerald-400 text-emerald-950', icon: CheckCircle2 };
        if (isSubmitted) return { label: 'SUBMITTED', color: 'bg-blue-400 text-blue-950', icon: CheckCircle2 };
        if (isOverdue || isLate) return { label: 'OVERDUE', color: 'bg-red-400 text-red-950', icon: AlertCircle };
        return { label: 'PENDING', color: 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white', icon: Clock };
    };

    const statusInfo = getStatusDetails();

    if (viewMode === 'list') {
        return (
            <Card className={cn(
                "group relative overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300 w-full rounded-xl bg-white dark:bg-[#3c3744] text-slate-900 dark:text-white border-slate-200 dark:border-white/5",
                className
            )}>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    {/* Left: Status & Course */}
                    <div className="flex items-center gap-3 md:w-48 shrink-0">
                        <div className={cn(
                            "p-3 rounded-xl",
                            status === 'pending'
                                ? "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                                : statusInfo.color.replace('bg-', 'bg-opacity-20 ')
                        )} >
                            <statusInfo.icon className="size-6" />
                        </div>
                        <div className="flex flex-col">
                            <Badge variant="outline" className="w-fit mb-1 border-slate-200 dark:border-slate-700 text-[10px] font-bold truncate max-w-[120px]">
                                {assignment.course_code || assignment.class_name || 'COURSE'}
                            </Badge>
                            <span className="text-xs font-semibold text-muted-foreground uppercase">
                                {statusInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* Middle: Title & Instructor */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                        <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-white truncate mb-1" title={assignment.title}>
                            {assignment.title}
                        </h3>
                        <div className="flex items-center justify-center md:justify-start gap-3 text-xs text-slate-500 dark:text-slate-300">
                            {assignment.lecturer_name && (
                                <span className="flex items-center gap-1">
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage src={assignment.instructor_avatar} />
                                        <AvatarFallback className="text-[8px]">{assignment.lecturer_name[0]}</AvatarFallback>
                                    </Avatar>
                                    {assignment.lecturer_name}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {assignment.due_date ? format(new Date(assignment.due_date), "MMM d") : "No Due Date"}
                            </span>
                        </div>
                    </div>

                    {/* Right: Metrics */}
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-300 shrink-0 border-r border-slate-200 dark:border-white/10 pr-4 mr-2 hidden md:flex">
                        <div className="flex items-center gap-1.5" title="Points">
                            <Trophy className="size-4" />
                            <span className="font-medium text-slate-900 dark:text-white">{assignment.points || 100} Pts</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 w-full md:w-auto flex items-center gap-2">
                        {role === 'student' && !isSubmitted ? (
                            <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSubmit?.(assignment);
                                }}
                                className={cn(
                                    "w-full md:w-auto font-bold shadow-sm",
                                    isOverdue
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                                )}
                            >
                                <UploadCloud className="size-4 mr-2" />
                                {isOverdue ? 'Late' : 'Submit'}
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView?.(assignment.id);
                                }}
                                className="w-full md:w-auto font-semibold"
                            >
                                <Eye className="size-4 mr-2" />
                                Details
                            </Button>
                        )}

                        {(onEdit || onDelete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onEdit && (
                                        <DropdownMenuItem onClick={() => onEdit(assignment)}>
                                            <Edit className="size-4 mr-2" /> Edit
                                        </DropdownMenuItem>
                                    )}
                                    {onDelete && (
                                        <DropdownMenuItem onClick={() => onDelete(assignment.id)} className="text-destructive">
                                            <Trash2 className="size-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "group relative overflow-hidden border shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-sm mx-auto flex flex-col h-full rounded-2xl bg-white dark:bg-[#3c3744] text-slate-900 dark:text-white border-slate-200 dark:border-white/5",
            className
        )}>
            {/* Header Section - Violet/Purple Gradient for Assignments */}
            <div className="relative h-32 bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm font-bold tracking-wider uppercase text-[10px] px-2.5 py-1 truncate max-w-[140px] shrink-0">
                        {assignment.course_code || assignment.class_name || 'COURSE'}
                    </Badge>

                    <div className="flex gap-2">
                        <Badge className={cn("border-none font-bold shadow-sm backdrop-blur-sm", statusInfo.color)}>
                            {statusInfo.label}
                        </Badge>

                        {(onEdit || onDelete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-white hover:bg-white/20 hover:text-white rounded-full -mt-1 -mr-1"
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
                </div>
            </div>

            {/* Content Body */}
            <CardContent className="p-6 pt-6 flex flex-col h-full gap-6">
                {/* Title */}
                <div>
                    <h3 className="font-extrabold text-2xl leading-tight line-clamp-2 mb-3 text-white" title={assignment.title}>
                        {assignment.title}
                    </h3>

                    {/* Instructor / Subject Info */}
                    {(assignment.lecturer_name || assignment.subject_name) && (
                        <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border-2 border-white/10 shadow-sm">
                                <AvatarImage src={assignment.instructor_avatar || ''} />
                                <AvatarFallback className="bg-fuchsia-100 text-fuchsia-700 font-bold text-xs">
                                    {assignment.lecturer_name?.charAt(0) || 'L'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-200 line-clamp-1">
                                {assignment.lecturer_name} {assignment.subject_name ? `• ${assignment.subject_name}` : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Due Date */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-black/20 col-span-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white">
                                <Calendar className="size-3" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wide">Due Date</span>
                        </div>

                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate w-full text-center">
                            {assignment.due_date ? format(new Date(assignment.due_date), "MMM d, h:mm a") : "No Due Date"}
                        </span>
                    </div>

                    {/* Points */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-black/20">
                        <div className="p-1.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white mb-1.5">
                            <Trophy className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{assignment.points || 100} Pts</span>
                    </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto">
                    {role === 'student' && !isSubmitted ? (
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSubmit?.(assignment);
                            }}
                            className={cn(
                                "w-full rounded-xl font-extrabold text-base h-14 shadow-lg border-none transition-transform hover:-translate-y-0.5 active:translate-y-0",
                                isOverdue
                                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                                    : "bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-fuchsia-500/20"
                            )}
                        >
                            <UploadCloud className="size-5 mr-2" />
                            {isOverdue ? 'Submit Late' : 'Submit Assignment'}
                        </Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView?.(assignment.id);
                                }}
                                className="w-full rounded-xl font-bold bg-slate-100 dark:bg-white/10 border-2 border-slate-200 dark:border-white/5 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 shadow-sm h-12"
                            >
                                <Eye className="size-4 mr-2" />
                                {role === 'lecturer' ? 'View Submissions' : 'View Details'}
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
