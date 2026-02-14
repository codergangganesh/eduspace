import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { QuizCard } from '@/components/student/QuizCard';
import { Button } from '@/components/ui/button';
import { FileText, LayoutGrid, List } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentQuizzes } from '@/hooks/useStudentQuizzes';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from '@/contexts/AuthContext';

export default function StudentQuizzes() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const { profile, updateProfile: syncProfile } = useAuth();
    const { quizzes, loading, enrolledClasses } = useStudentQuizzes(selectedClassId);

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
            <div className="w-full flex flex-col gap-10 animate-in fade-in duration-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Assigned Quizzes</h1>
                        <p className="text-muted-foreground text-lg mt-2">Track and complete your assigned quizzes for your enrolled classes</p>
                    </div>

                </div>

                {loading && enrolledClasses.length === 0 ? (
                    <div className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                            : "flex flex-col gap-3 max-w-4xl mx-auto"
                    )}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="group relative overflow-hidden border-none shadow-md w-full max-w-sm mx-auto flex flex-col h-full rounded-2xl bg-white dark:bg-[#3c3744] border border-slate-200 dark:border-white/5">
                                <div className="relative h-32 bg-slate-100 dark:bg-white/5 animate-pulse p-6"></div>
                                <CardContent className="p-6 pt-6 flex flex-col h-full gap-6">
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
                                </CardContent>
                            </Card>
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

                        {/* Content Area - Rendered directly based on selection, not inside TabsContent to ensure updates */}
                        <div className="mt-4">
                            <div className="flex justify-end mb-4 sm:hidden">
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
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
                            {loading ? (
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                                        : "flex flex-col gap-3 max-w-4xl mx-auto"
                                )}>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <Card key={i} className="group relative overflow-hidden border-none shadow-md w-full max-w-md mx-auto flex flex-col h-full rounded-2xl bg-white dark:bg-[#3c3744] border border-slate-200 dark:border-white/5">
                                            <Skeleton className="h-32 w-full bg-slate-100 dark:bg-white/5 rounded-none" />
                                            <CardContent className="p-6 pt-6 flex flex-col h-full gap-6">
                                                <div className="flex justify-between items-start">
                                                    <Skeleton className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded-full" />
                                                    <Skeleton className="h-6 w-20 bg-slate-200 dark:bg-white/10 rounded-full" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Skeleton className="h-8 w-3/4 bg-slate-200 dark:bg-white/10 rounded-lg" />
                                                    <div className="flex items-center gap-2">
                                                        <Skeleton className="size-8 rounded-full bg-slate-200 dark:bg-white/10" />
                                                        <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-white/10" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <Skeleton className="h-16 rounded-2xl bg-slate-50 dark:bg-white/5 col-span-2" />
                                                    <Skeleton className="h-16 rounded-2xl bg-slate-50 dark:bg-white/5" />
                                                </div>
                                                <Skeleton className="h-12 w-full rounded-xl bg-slate-100 dark:bg-white/10 mt-auto" />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : quizzes.length === 0 ? (
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
                                    {quizzes.map((quiz) => (
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
