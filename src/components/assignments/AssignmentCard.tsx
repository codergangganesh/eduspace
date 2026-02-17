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
    CheckCircle, // Added CheckCircle
    CheckCircle2,
    Clock,
    Edit,
    Eye,
    FileText,
    MoreVertical,
    Trophy,
    Trash2,
    UploadCloud,
    Users,
    XCircle,
    AlertCircle,
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
                        {role === 'student' ? (
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
                                        : isSubmitted
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                            : "bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                                )}
                            >
                                {isSubmitted ? <Eye className="size-4 mr-2" /> : <UploadCloud className="size-4 mr-2" />}
                                {isSubmitted ? 'View Assignment' : (isOverdue ? 'Late Submit' : 'Submit')}
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
            "group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 w-full flex flex-col h-full rounded-[2rem] bg-white dark:bg-[#1a1625] text-slate-900 dark:text-white",
            className
        )}>
            {/* Header Section - Premium Gradient */}
            <div className="relative h-28 bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 p-5 flex flex-col justify-between overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -top-10 -right-10 size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                <div className="flex justify-between items-start relative z-10">
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md font-bold tracking-wider uppercase text-[9px] px-2.5 py-1.5 rounded-lg truncate max-w-[120px] shrink-0">
                        {assignment.course_code || assignment.class_name || 'COURSE'}
                    </Badge>

                    <div className="flex gap-2">
                        {role === 'student' && (
                            <Badge className={cn("border-none font-bold shadow-lg backdrop-blur-md px-3 py-1 rounded-lg text-[10px]", statusInfo.color)}>
                                {statusInfo.label}
                            </Badge>
                        )}

                        {(onEdit || onDelete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-white hover:bg-white/20 hover:text-white rounded-full -mt-0.5 -mr-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-border">
                                    {onEdit && (
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(assignment);
                                        }} className="rounded-xl h-10 px-3 cursor-pointer">
                                            <Edit className="size-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {onDelete && (
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(assignment.id);
                                        }} className="rounded-xl h-10 px-3 cursor-pointer text-red-600 focus:text-red-600">
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
            <CardContent className="p-5 flex flex-col h-full gap-5 relative">
                {/* Title */}
                <div>
                    <h3 className="font-black text-lg md:text-xl leading-snug line-clamp-2 mb-3 text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors" title={assignment.title}>
                        {assignment.title}
                    </h3>

                    {/* Instructor / Subject Info */}
                    {(assignment.lecturer_name || assignment.subject_name) && (
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <Avatar className="h-7 w-7 border-2 border-background shadow-md">
                                    <AvatarImage src={assignment.instructor_avatar || ''} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                                        {assignment.lecturer_name?.charAt(0) || 'L'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-1">
                                {assignment.lecturer_name}
                                {assignment.subject_name && <span className="mx-1.5 opacity-30">|</span>}
                                {assignment.subject_name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 gap-2.5">
                    {/* Due Date - Premium Glossy Design */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 shadow-inner group/date hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                <Calendar className="size-3.5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Due Date</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {assignment.due_date ? format(new Date(assignment.due_date), "MMM d, h:mm a") : "No Due Date"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Points */}
                        <div className="flex-1 flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 shadow-inner">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Trophy className="size-3.5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Points</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{assignment.points || 100}</span>
                            </div>
                        </div>

                        {/* Submission Info for Lecturers */}
                        {role === 'lecturer' && (
                            <div className="flex-1 flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 shadow-inner">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    <Users className="size-3.5" />
                                </div>
                                <div className="flex flex-col text-right ml-auto">
                                    <span className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest leading-none mb-1">Submits</span>
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        {assignment.submission_count || 0}/{assignment.total_students || 0}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto pt-2">
                    {role === 'student' ? (
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSubmit?.(assignment);
                                }}
                                className={cn(
                                    "w-full rounded-2xl font-black text-sm h-12 shadow-xl border-none transition-all hover:scale-[1.02] active:scale-95",
                                    isOverdue && !isSubmitted
                                        ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/20"
                                        : isSubmitted
                                            ? "bg-white dark:bg-white/5 text-slate-700 dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10"
                                            : "bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-indigo-500/20"
                                )}
                            >
                                {isSubmitted ? (
                                    <>
                                        <Eye className="size-4 mr-2" />
                                        View Assignment
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="size-4 mr-2" />
                                        {isOverdue ? 'Submit Late' : 'Submit Now'}
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onView?.(assignment.id);
                            }}
                            className="w-full rounded-2xl font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-primary/30 shadow-md h-12 transition-all flex items-center justify-center gap-2"
                        >
                            <Eye className="size-4" />
                            {role === 'lecturer' ? 'Review Submissions' : 'All Details'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
