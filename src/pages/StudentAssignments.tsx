import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AssignmentCard } from '@/components/assignments/AssignmentCard';
import { PremiumStatsCard } from "@/components/dashboard/PremiumStatsCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, TrendingUp, BookOpen, CheckCircle2, GraduationCap, Search, LayoutGrid, List, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAssignments } from "@/hooks/useAssignments";
import { SubmitAssignmentDialog } from "@/components/assignments/SubmitAssignmentDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumCardSkeleton } from "@/components/skeletons/PremiumCardSkeleton";

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
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isDeleting, setIsDeleting] = useState(false);

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
        setSelectedAssignmentId(assignment.id);
        setIsSubmitOpen(true);
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

    const activeAssignment = assignments.find(a => a.id === selectedAssignmentId);

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

                {/* Premium Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                    <PremiumStatsCard
                        title="TOTAL"
                        value={stats.total}
                        subtitle="Active assignments"
                        icon={BookOpen}
                        backgroundColor="bg-gradient-to-br from-blue-600 to-indigo-700"
                        iconBackgroundColor="bg-white/10"
                    />
                    <PremiumStatsCard
                        title="COMPLETED"
                        value={stats.completed}
                        subtitle="Tasks finished"
                        icon={CheckCircle2}
                        backgroundColor="bg-gradient-to-br from-green-600 to-emerald-700"
                        iconBackgroundColor="bg-white/10"
                    />
                    <PremiumStatsCard
                        title="PENDING"
                        value={stats.pending}
                        subtitle="Require attention"
                        icon={Clock}
                        backgroundColor="bg-gradient-to-br from-amber-500 to-orange-600"
                        iconBackgroundColor="bg-white/10"
                        className="col-span-2 sm:col-span-1"
                    />
                </div>

                {loading && (enrolledClasses?.length === 0) ? (
                    <div className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                            : "flex flex-col gap-3 max-w-4xl mx-auto"
                    )}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <PremiumCardSkeleton key={i} viewMode={viewMode} />
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
                                    <div className="grid grid-cols-4 sm:hidden items-center gap-1 sm:gap-2 w-full sm:w-auto p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl shrink-0">
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

                                    <div className="flex items-center gap-3 w-full xl:flex-1 overflow-hidden">
                                        <div className="hidden sm:block">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 shrink-0 gap-2 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-xl font-bold text-slate-600 dark:text-slate-300"
                                                    >
                                                        <Filter className="size-4" />
                                                        <span className="hidden lg:inline capitalize">{filter}</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-48 rounded-xl p-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
                                                    <div className="px-2 py-1.5 text-xs font-black text-slate-400 uppercase tracking-widest">Filter Status</div>
                                                    <DropdownMenuRadioGroup value={filter} onValueChange={(val) => setFilter(val as FilterType)}>
                                                        {(['all', 'pending', 'submitted', 'overdue'] as FilterType[]).map((f) => (
                                                            <DropdownMenuRadioItem
                                                                key={f}
                                                                value={f}
                                                                className="capitalize rounded-lg focus:bg-blue-500/10 focus:text-blue-500 cursor-pointer font-bold"
                                                            >
                                                                {f}
                                                            </DropdownMenuRadioItem>
                                                        ))}
                                                    </DropdownMenuRadioGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search assignments..."
                                                className="pl-9 h-9 bg-background border-border/60 focus-visible:ring-1"
                                                value={searchQuery}
                                                onChange={(e: any) => setSearchQuery(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex sm:hidden items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
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

                            {(loading || isDeleting) ? (
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                                        : "flex flex-col gap-3 max-w-4xl mx-auto"
                                )}>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <PremiumCardSkeleton key={i} viewMode={viewMode} />
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
                                            onDelete={assignment.studentStatus === 'submitted' ? async (id) => {
                                                const submission = assignment.submission;
                                                if (submission?.id) {
                                                    setIsDeleting(true);
                                                    const result = await deleteSubmission(submission.id);
                                                    if (result.success) {
                                                        toast.success("Submission deleted successfully");
                                                        // Manually refresh to ensure UI updates
                                                        await refreshAssignments(true);
                                                    } else {
                                                        toast.error(result.error || "Failed to delete submission");
                                                    }
                                                    setIsDeleting(false);
                                                }
                                            } : undefined}
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

            {activeAssignment && (
                <SubmitAssignmentDialog
                    isOpen={isSubmitOpen && !!activeAssignment}
                    onClose={() => setIsSubmitOpen(false)}
                    assignment={activeAssignment}
                    onSubmit={submitAssignment}
                    onDelete={async (submissionId) => {
                        setIsDeleting(true);
                        const result = await deleteSubmission(submissionId);
                        if (result.success) {
                            toast.success("Submission deleted successfully");
                            setIsSubmitOpen(false);
                            // Manually refresh to ensure UI updates
                            await refreshAssignments(true);
                        } else {
                            toast.error(result.error || "Failed to delete submission");
                        }
                        setIsDeleting(false);
                    }}
                />
            )}

        </DashboardLayout>
    );
}
