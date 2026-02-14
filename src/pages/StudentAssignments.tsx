import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AssignmentCard } from '@/components/assignments/AssignmentCard';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, TrendingUp, BookOpen, CheckCircle2, GraduationCap, Search, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAssignments } from "@/hooks/useAssignments";
import { SubmitAssignmentDialog } from "@/components/assignments/SubmitAssignmentDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/layout/DeleteConfirmDialog";

type FilterType = "all" | "pending" | "submitted" | "overdue";

export default function StudentAssignments() {
    const navigate = useNavigate();
    const { role, profile, updateProfile: syncProfile } = useAuth();
    const [selectedClassId, setSelectedClassId] = useState<string>("");

    const {
        assignments,
        loading,
        submitAssignment,
        deleteSubmission,
        refreshAssignments,
        stats,
        enrolledClasses
    } = useAssignments(selectedClassId);

    const [filter, setFilter] = useState<FilterType>("all");
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);

    // Initial load: Set class from profile or first available
    useEffect(() => {
        if (enrolledClasses && enrolledClasses.length > 0 && !selectedClassId) {
            const lastId = profile?.last_selected_class_id;
            const isValid = lastId && enrolledClasses.some(c => c.id === lastId);

            if (isValid) {
                setSelectedClassId(lastId);
            } else {
                setSelectedClassId(enrolledClasses[0].id);
            }
        }
    }, [enrolledClasses, profile, selectedClassId]);

    const handleClassChange = (newVal: string) => {
        setSelectedClassId(newVal);
        syncProfile({ last_selected_class_id: newVal });
    };

    const filteredAssignments = assignments.filter((assignment) => {
        if (filter === "all") return true;
        return assignment.studentStatus === filter;
    }).filter(assignment =>
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.course_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmitClick = (assignment: any) => {
        setSelectedAssignment(assignment);
        setIsSubmitOpen(true);
    };

    const handleEditSubmission = (assignment: any) => {
        console.log("Editing submission for:", assignment.title);
        setSelectedAssignment(assignment);
        setIsSubmitOpen(true);
    };

    const handleDeleteSubmission = (assignmentId: string) => {
        setSubmissionToDelete(assignmentId);
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'graded':
                return 'success';
            case 'submitted':
                return 'default';
            case 'overdue':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full flex flex-col gap-0 animate-in fade-in duration-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                            Assignments
                        </h1>
                        <p className="text-muted-foreground text-lg mt-2">
                            Stay on top of your coursework and deadlines
                        </p>
                    </div>

                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/50">
                        <CardContent className="p-3 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl">
                                    <BookOpen className="w-5 h-5 sm:w-8 sm:h-8 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                                    <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-100 dark:border-emerald-900/50">
                        <CardContent className="p-3 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5 sm:w-8 sm:h-8 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">Completed</p>
                                    <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.completed}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-100 dark:border-amber-900/50">
                        <CardContent className="p-3 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2 sm:p-3 bg-amber-500/10 rounded-xl">
                                    <Clock className="w-5 h-5 sm:w-8 sm:h-8 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-sm font-medium text-amber-600 dark:text-amber-400">Pending</p>
                                    <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.pending}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-100 dark:border-violet-900/50">
                        <CardContent className="p-3 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="p-2 sm:p-3 bg-violet-500/10 rounded-xl">
                                    <GraduationCap className="w-5 h-5 sm:w-8 sm:h-8 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-sm font-medium text-violet-600 dark:text-violet-400">Avg Grade</p>
                                    <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.averageGrade || 0}%</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {loading && (enrolledClasses?.length === 0) ? (
                    <div className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                            : "flex flex-col gap-3 max-w-4xl mx-auto"
                    )}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="group relative overflow-hidden border-none shadow-md w-full max-w-sm mx-auto flex flex-col h-full rounded-2xl bg-white dark:bg-[#3c3744] border border-slate-200 dark:border-white/5">
                                <CardContent className="p-0">
                                    <div className="h-32 w-full bg-slate-100 dark:bg-white/5 animate-pulse" />
                                    <div className="p-6 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse" />
                                            <div className="h-6 w-20 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-8 w-3/4 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse" />
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                                                <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 pt-2">
                                            <div className="h-16 rounded-2xl bg-slate-50 dark:bg-white/5 animate-pulse col-span-2" />
                                            <div className="h-16 rounded-2xl bg-slate-50 dark:bg-white/5 animate-pulse" />
                                        </div>
                                        <div className="mt-auto h-12 bg-slate-100 dark:bg-white/10 rounded-xl animate-pulse" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : enrolledClasses && enrolledClasses.length > 0 ? (
                    <Tabs value={selectedClassId} onValueChange={handleClassChange} className="w-full mt-8">
                        <div className="w-full overflow-hidden">
                            <TabsList className="bg-transparent h-auto w-full justify-start gap-3 p-1 overflow-x-auto pb-4 snap-x pr-20 no-scrollbar">
                                {enrolledClasses.map((cls) => (
                                    <TabsTrigger
                                        key={cls.id}
                                        value={cls.id}
                                        className={cn(
                                            "relative flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 pr-3 sm:pr-6 py-1.5 sm:py-2 rounded-full border transition-all duration-300 min-w-0 sm:min-w-[160px] snap-start",
                                            "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-500 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20",
                                            "data-[state=inactive]:bg-white dark:data-[state=inactive]:bg-slate-800/80 data-[state=inactive]:hover:bg-slate-50 dark:data-[state=inactive]:hover:bg-slate-800 data-[state=inactive]:border-slate-200 dark:data-[state=inactive]:border-slate-700 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400",
                                            "group overflow-hidden tap-highlight-transparent"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-full font-bold text-[10px] sm:text-xs shrink-0 transition-colors",
                                            selectedClassId === cls.id
                                                ? "bg-white/20 text-white"
                                                : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                                        )}>
                                            {cls.course_code.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col items-start text-left truncate min-w-0 flex-1">
                                            <span className={cn(
                                                "font-bold text-[7px] sm:text-[10px] uppercase tracking-wider mb-0 sm:mb-0.5 opacity-70",
                                            )}>
                                                {cls.course_code}
                                            </span>
                                            <span className="font-bold text-[10px] sm:text-sm truncate w-full sm:max-w-[120px] leading-none">
                                                {cls.class_name}
                                            </span>
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* Content Area - Direct Render */}
                        <div className="mt-2 space-y-6">
                            {(assignments.length > 0 || loading) && (
                                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between p-1">
                                    <div className="grid grid-cols-4 sm:flex items-center gap-1 sm:gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl shrink-0">
                                        {(['all', 'pending', 'submitted', 'overdue'] as FilterType[]).map((f) => (
                                            <Button
                                                key={f}
                                                variant={filter === f ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setFilter(f)}
                                                className={cn(
                                                    "capitalize whitespace-nowrap rounded-lg px-0.5 sm:px-4 text-[10px] sm:text-sm font-black transition-all h-8 flex-1 sm:flex-none",
                                                    filter === f
                                                        ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400"
                                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                                )}
                                            >
                                                {f}
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 w-full xl:w-auto overflow-hidden">
                                        <div className="relative flex-1 xl:w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search assignments..."
                                                className="pl-9 h-9 bg-background border-border/60 focus-visible:ring-1"
                                                value={searchQuery}
                                                onChange={(e: any) => setSearchQuery(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl sm:hidden shrink-0">
                                            <Button
                                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setViewMode('grid')}
                                                className={cn("h-8 w-10 px-0 rounded-lg transition-all", viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500")}
                                            >
                                                <LayoutGrid className="size-4" />
                                            </Button>
                                            <Button
                                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setViewMode('list')}
                                                className={cn("h-8 w-10 px-0 rounded-lg transition-all", viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500")}
                                            >
                                                <List className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                                        : "flex flex-col gap-3 max-w-4xl mx-auto"
                                )}>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <Card key={i} className="group relative overflow-hidden border-none shadow-md w-full max-w-sm mx-auto flex flex-col h-full rounded-2xl bg-white dark:bg-[#3c3744] border border-slate-200 dark:border-white/5">
                                            {viewMode === 'list' ? (
                                                <div className="p-4 flex items-center gap-4 w-full">
                                                    <Skeleton className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 shrink-0" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-5 w-1/3 bg-slate-200 dark:bg-white/5" />
                                                        <Skeleton className="h-4 w-1/4 bg-slate-200 dark:bg-white/5" />
                                                    </div>
                                                    <Skeleton className="h-8 w-16 bg-slate-200 dark:bg-white/5 shrink-0" />
                                                </div>
                                            ) : (
                                                <CardContent className="p-0">
                                                    <Skeleton className="h-32 w-full bg-slate-100 dark:bg-white/5 rounded-none" />
                                                    <div className="p-6 space-y-6">
                                                        <div className="flex justify-between items-start">
                                                            <Skeleton className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded-full" />
                                                            <Skeleton className="h-6 w-20 bg-slate-200 dark:bg-white/10 rounded-full" />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Skeleton className="h-8 w-3/4 bg-slate-200 dark:bg-white/10 rounded-lg" />
                                                            <div className="flex items-center gap-2">
                                                                <Skeleton className="h-8 w-8 rounded-full bg-slate-200 dark:bg-white/10" />
                                                                <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-white/10" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3 pt-2">
                                                            <Skeleton className="h-16 rounded-2xl bg-slate-50 dark:bg-white/5 col-span-2" />
                                                            <Skeleton className="h-16 rounded-2xl bg-slate-50 dark:bg-white/5" />
                                                        </div>
                                                        <Skeleton className="h-12 w-full rounded-xl bg-slate-100 dark:bg-white/10 mt-auto" />
                                                    </div>
                                                </CardContent>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            ) : filteredAssignments.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="p-4 rounded-full bg-muted mb-4">
                                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
                                        <p className="text-muted-foreground max-w-sm mb-6">
                                            {filter === 'all' && !searchQuery
                                                ? "You don't have any assignments for this class yet."
                                                : "Try adjusting your filters or search query."}
                                        </p>
                                        {(filter !== 'all' || searchQuery) && (
                                            <Button variant="outline" onClick={() => { setFilter('all'); setSearchQuery(''); }}>
                                                Clear Filters
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                                        : "flex flex-col gap-3 max-w-4xl mx-auto"
                                )}>
                                    {filteredAssignments.map((assignment) => (
                                        <AssignmentCard
                                            key={assignment.id}
                                            assignment={{
                                                ...assignment,
                                                status: (assignment.studentStatus || assignment.status || 'pending') as any,
                                                points: assignment.max_points,
                                            }}
                                            role="student"
                                            viewMode={viewMode}
                                            onView={(id) => navigate(`/student/assignments/${id}`)}
                                            onSubmit={handleSubmitClick}
                                            onEdit={assignment.studentStatus === 'submitted' ? handleEditSubmission : undefined}
                                            onDelete={assignment.studentStatus === 'submitted' ? handleDeleteSubmission : undefined}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Tabs>
                ) : (
                    <Card className="border-dashed border-2 bg-muted/20 rounded-3xl">
                        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="p-6 rounded-full bg-primary/10 mb-6">
                                <BookOpen className="size-16 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">No Classes Enrolled!</h3>
                            <p className="text-muted-foreground text-lg max-w-md mx-auto">
                                You need to join a class before you can see any assignments.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {selectedAssignment && (
                <SubmitAssignmentDialog
                    isOpen={isSubmitOpen}
                    onClose={() => setIsSubmitOpen(false)}
                    assignment={selectedAssignment}
                    onSubmit={submitAssignment}
                />
            )}

            <DeleteConfirmDialog
                open={!!submissionToDelete}
                onOpenChange={(open) => !open && setSubmissionToDelete(null)}
                onConfirm={async () => {
                    if (submissionToDelete) {
                        const assignment = assignments.find(a => a.id === submissionToDelete);
                        if (assignment?.submission?.id) {
                            const { success, error } = await deleteSubmission(assignment.submission.id);
                            if (success) {
                                toast.success("Submission deleted successfully");
                            } else {
                                toast.error("Failed to delete submission");
                                console.error(error);
                            }
                        }
                        setSubmissionToDelete(null);
                    }
                }}
                title="Delete Submission?"
                description="This will permanently delete your work and any feedback or grades you've received for this assignment. This action cannot be undone."
            />
        </DashboardLayout>
    );
}
