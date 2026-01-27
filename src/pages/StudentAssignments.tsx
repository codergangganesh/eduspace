import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, ChevronRight, TrendingUp, Target, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAssignments } from "@/hooks/useAssignments";
import { format, parseISO } from "date-fns";
import { SubmitAssignmentDialog } from "@/components/assignments/SubmitAssignmentDialog";

type FilterType = "all" | "pending" | "submitted" | "graded" | "overdue";

const statusConfig: any = {
    pending: {
        label: "Pending",
        color: "text-amber-700 dark:text-amber-300",
        bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
        icon: AlertCircle,
    },
    submitted: {
        label: "Submitted",
        color: "text-blue-700 dark:text-blue-300",
        bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
        icon: CheckCircle,
    },
    graded: {
        label: "Graded",
        color: "text-green-700 dark:text-green-300",
        bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900",
        icon: CheckCircle,
    },
    overdue: {
        label: "Overdue",
        color: "text-red-700 dark:text-red-300",
        bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",
        icon: AlertCircle,
    },
};

export default function StudentAssignments() {
    const { assignments, loading, submitAssignment } = useAssignments();
    const [filter, setFilter] = useState<FilterType>("all");
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);

    // Filter assignments based on computed studentStatus
    const filteredAssignments = assignments.filter((assignment) => {
        if (filter === "all") return true;
        return assignment.studentStatus === filter;
    });

    const counts = {
        all: assignments.length,
        pending: assignments.filter((a) => a.studentStatus === "pending").length,
        submitted: assignments.filter((a) => a.studentStatus === "submitted").length,
        graded: assignments.filter((a) => a.studentStatus === "graded").length,
        overdue: assignments.filter((a) => a.studentStatus === "overdue").length,
    };

    // Calculate average grade
    const gradedAssignments = assignments.filter((a) => a.grade !== undefined && a.grade !== null);
    const averageGrade = gradedAssignments.length > 0
        ? Math.round((gradedAssignments.reduce((sum, a) => sum + ((a.grade || 0) / a.max_points) * 100, 0) / gradedAssignments.length))
        : 0;

    const handleSubmitClick = (assignment: any) => {
        setSelectedAssignment(assignment);
        setIsSubmitOpen(true);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="size-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assignments</h1>
                    <p className="text-muted-foreground mt-1">Track and manage your coursework</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Total</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{counts.all}</p>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <FileText className="size-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Pending</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{counts.pending}</p>
                                </div>
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                    <AlertCircle className="size-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Completed</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{counts.graded + counts.submitted}</p>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Avg. Grade</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{averageGrade}%</p>
                                </div>
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <TrendingUp className="size-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {(["all", "pending", "submitted", "graded", "overdue"] as FilterType[]).map((filterType) => (
                        <button
                            key={filterType}
                            onClick={() => setFilter(filterType)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                                filter === filterType
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-primary/30"
                            )}
                        >
                            <span className="capitalize">{filterType}</span>
                            <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-semibold",
                                filter === filterType
                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {counts[filterType]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Assignments List */}
                <div className="flex flex-col gap-4">
                    {filteredAssignments.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="p-4 bg-muted rounded-full mb-4">
                                    <FileText className="size-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">No assignments found</h3>
                                <p className="text-muted-foreground mt-1 text-center max-w-sm">
                                    No assignments match the selected filter.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredAssignments.map((assignment) => {
                            const config = statusConfig[assignment.studentStatus || 'pending'];
                            const StatusIcon = config.icon;
                            const formattedDate = assignment.due_date ? format(parseISO(assignment.due_date), "MMM d, yyyy") : "No Date";
                            const formattedTime = assignment.due_date ? format(parseISO(assignment.due_date), "h:mm a") : "";

                            return (
                                <Card
                                    key={assignment.id}
                                    className={cn(
                                        "border-l-4",
                                        assignment.studentStatus === "overdue" && "border-l-red-500",
                                        assignment.studentStatus === "pending" && "border-l-amber-500",
                                        assignment.studentStatus === "submitted" && "border-l-blue-500",
                                        assignment.studentStatus === "graded" && "border-l-green-500"
                                    )}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                            {/* Left Section */}
                                            <div className="flex-1 min-w-0 space-y-3">
                                                {/* Title and Type */}
                                                <div className="flex items-start gap-3 flex-wrap">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-lg text-foreground">{assignment.title}</h3>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                                                                {assignment.course_code || "GEN"}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground">{assignment.course_title}</span>
                                                            {assignment.lecturer_name && (
                                                                <>
                                                                    <span className="text-muted-foreground">•</span>
                                                                    <span className="text-sm text-muted-foreground"> {assignment.lecturer_name}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {assignment.description && (
                                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                        {assignment.description}
                                                    </p>
                                                )}

                                                {/* Attachments */}
                                                {assignment.attachment_url && (
                                                    <div>
                                                        <a href={assignment.attachment_url} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="outline" size="sm" className="h-8 gap-2">
                                                                <Download className="size-3.5" />
                                                                {assignment.attachment_name || "Attachment"}
                                                            </Button>
                                                        </a>
                                                    </div>
                                                )}

                                                {/* Meta Info */}
                                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Calendar className="size-4" />
                                                        <span className="font-medium">{formattedDate}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Clock className="size-4" />
                                                        <span className="font-medium">{formattedTime}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Target className="size-4" />
                                                        <span className="font-medium">
                                                            {assignment.grade !== undefined
                                                                ? `${assignment.grade}/${assignment.max_points} pts`
                                                                : `${assignment.max_points} pts`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Section - Status and Action */}
                                            <div className="flex lg:flex-col items-center lg:items-end gap-3">
                                                {/* Status Badge */}
                                                <div className={cn(
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg border",
                                                    config.bg,
                                                    config.color
                                                )}>
                                                    <StatusIcon className="size-4" />
                                                    <span className="font-semibold text-sm">{config.label}</span>
                                                </div>

                                                {/* Action Button */}
                                                {(assignment.studentStatus === "pending" || assignment.studentStatus === "overdue") && (
                                                    <Button
                                                        className="gap-2"
                                                        variant={assignment.studentStatus === "overdue" ? "destructive" : "default"}
                                                        onClick={() => handleSubmitClick(assignment)}
                                                    >
                                                        {assignment.studentStatus === "overdue" ? "Late Submit" : "Submit Now"}
                                                        <ChevronRight className="size-4" />
                                                    </Button>
                                                )}

                                                {(assignment.studentStatus === "submitted" || assignment.studentStatus === "graded") && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Submitted on {assignment.submission?.submitted_at ? format(parseISO(assignment.submission.submitted_at), "MMM d") : "Unknown"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            {selectedAssignment && (
                <SubmitAssignmentDialog
                    isOpen={isSubmitOpen}
                    onClose={() => setIsSubmitOpen(false)}
                    assignment={selectedAssignment}
                    onSubmit={submitAssignment}
                />
            )}
        </DashboardLayout>
    );
}
