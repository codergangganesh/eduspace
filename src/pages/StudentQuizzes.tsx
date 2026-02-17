import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { QuizCard } from '@/components/student/QuizCard';
import { Button } from '@/components/ui/button';
import { FileText, LayoutGrid, List, Search, Filter } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentQuizzes } from '@/hooks/useStudentQuizzes';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumCardSkeleton } from "@/components/skeletons/PremiumCardSkeleton";
import { useAuth } from '@/contexts/AuthContext';

export default function StudentQuizzes() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "pending" | "submitted">("all");
    const { profile, updateProfile: syncProfile } = useAuth();
    const { quizzes, loading, enrolledClasses } = useStudentQuizzes(selectedClassId);

    const filteredQuizzes = quizzes.filter((quiz) => {
        const submissionStatus = quiz.my_submission?.status;
        if (filter === "all") return true;
        if (filter === "pending") return submissionStatus === "pending";
        if (filter === "submitted") return submissionStatus === "passed" || submissionStatus === "failed";
        return true;
    }).filter(quiz =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.classes?.course_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Initial load: Set class from profile or first available
    useEffect(() => {
        if (enrolledClasses.length > 0 && !selectedClassId) {
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

    const handleAttempt = (quizId: string) => {
        navigate(`/student/quizzes/${quizId}`);
    };

    return (
        <DashboardLayout>
            <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-500 overflow-y-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4 pt-4">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
                            <FileText className="size-6 text-white" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-indigo-500 uppercase">Assessment</span>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Active Quizzes</h1>
                        </div>
                    </div>
                </div>

                {loading && enrolledClasses.length === 0 ? (
                    <div className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                            : "flex flex-col gap-3 max-w-4xl mx-auto"
                    )}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <PremiumCardSkeleton key={i} viewMode={viewMode} />
                        ))}
                    </div>
                ) : enrolledClasses.length > 0 ? (
                    <Tabs value={selectedClassId} onValueChange={handleClassChange} className="w-full">
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

                        <div className="mt-4 flex flex-col xl:flex-row gap-4 items-center justify-between p-1">
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
                                            <DropdownMenuRadioGroup value={filter} onValueChange={(val) => setFilter(val as any)}>
                                                {['all', 'pending', 'submitted'].map((f) => (
                                                    <DropdownMenuRadioItem
                                                        key={f}
                                                        value={f}
                                                        className="capitalize rounded-lg focus:bg-indigo-500/10 focus:text-indigo-500 cursor-pointer font-bold"
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
                                        placeholder="Search quizzes..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-10 bg-white/50 dark:bg-slate-800/50 border-none shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500/20 text-sm rounded-xl"
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

                        {/* Content Area - Rendered directly based on selection, not inside TabsContent to ensure updates */}
                        <div className="mt-4">
                            {loading ? (
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                                        : "flex flex-col gap-3 max-w-4xl mx-auto"
                                )}>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <PremiumCardSkeleton key={i} viewMode={viewMode} />
                                    ))}
                                </div>
                            ) : filteredQuizzes.length === 0 ? (
                                <Card className="border-dashed border-2 bg-muted/20 rounded-3xl">
                                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                                        <div className="p-6 rounded-full bg-primary/10 mb-6">
                                            <FileText className="size-16 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3">No Quizzes Available</h3>
                                        <p className="text-muted-foreground text-lg max-w-md mx-auto">
                                            There are no published quizzes for this class yet. Check back later!
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                                        : "flex flex-col gap-3 max-w-4xl mx-auto"
                                )}>
                                    {filteredQuizzes.map((quiz) => (
                                        <QuizCard
                                            key={quiz.id}
                                            quiz={quiz}
                                            viewMode={viewMode}
                                            onAttempt={handleAttempt}
                                            onViewDetails={(id) => navigate(`/student/quizzes/${id}/details`)}
                                            onViewLeaderboard={(quizId, classId) => navigate(`/student/quizzes/${classId}/${quizId}/results`)}
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
                                <FileText className="size-16 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">No Classes Enrolled!</h3>
                            <p className="text-muted-foreground text-lg max-w-md mx-auto">
                                You need to join a class before you can see any quizzes.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
