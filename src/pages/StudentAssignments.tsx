
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { AssignmentCard } from '@/components/assignments/AssignmentCard';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, ChevronRight, TrendingUp, Target, Loader2, Download, Eye } from "lucide-react";
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
    const navigate = useNavigate();
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
                    <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{counts.all}</p>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <FileText className="size-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pending</p>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{counts.pending}</p>
                            </div>
                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <AlertCircle className="size-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Completed</p>
                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{counts.graded + counts.submitted}</p>
                            </div>
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <CheckCircle className="size-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Avg. Grade</p>
                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">{averageGrade}%</p>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                <TrendingUp className="size-6 text-purple-600 dark:text-purple-400" />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAssignments.map((assignment, index) => (
                                <AssignmentCard
                                    key={assignment.id}
                                    assignment={{
                                        ...assignment,
                                        status: assignment.studentStatus || assignment.status || 'pending',
                                        points: assignment.max_points
                                    }}
                                    role="student"
                                    onView={(id) => navigate(`/student/assignments/${id}`)}
                                    onSubmit={handleSubmitClick}
                                    index={index}
                                />
                            ))}
                        </div>
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
