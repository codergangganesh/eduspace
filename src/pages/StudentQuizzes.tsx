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

export default function StudentQuizzes() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    const { quizzes, loading, enrolledClasses } = useStudentQuizzes(selectedClassId);

    // Set default selected class when classes load
    useEffect(() => {
        if (enrolledClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(enrolledClasses[0].id);
        }
    }, [enrolledClasses, selectedClassId]);

    const handleAttempt = (quizId: string) => {
        navigate(`/student/quizzes/${quizId}`);
    };

    return (
        <DashboardLayout>
            <div className="w-full flex flex-col gap-10 animate-in fade-in duration-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Available Assessments</h1>
                        <p className="text-muted-foreground text-lg mt-2">Track and complete quizzes for your enrolled classes</p>
                    </div>


                </div>

                {loading && enrolledClasses.length === 0 ? (
                    <div className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                            : "flex flex-col gap-3 max-w-4xl mx-auto"
                    )}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="group relative overflow-hidden border-none shadow-md w-full max-w-sm mx-auto flex flex-col h-full rounded-2xl bg-[#3c3744]">
                                <div className="relative h-32 bg-white/5 animate-pulse p-6"></div>
                                <CardContent className="p-6 pt-6 flex flex-col h-full gap-6">
                                    <div className="space-y-3">
                                        <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
                                            <div className="h-4 w-1/3 bg-white/10 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[1, 2, 3].map((j) => (
                                            <div key={j} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                                        ))}
                                    </div>
                                    <div className="mt-auto h-12 bg-white/10 rounded-xl animate-pulse" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : enrolledClasses.length > 0 ? (
                    <Tabs value={selectedClassId} onValueChange={setSelectedClassId} className="w-full">
                        <div className="w-full overflow-hidden">
                            <TabsList className="bg-transparent h-auto w-full justify-start gap-3 p-1 overflow-x-auto pb-4 snap-x pr-20 no-scrollbar">
                                {enrolledClasses.map((cls) => (
                                    <TabsTrigger
                                        key={cls.id}
                                        value={cls.id}
                                        className={cn(
                                            "relative flex items-center gap-3 pl-2 pr-6 py-2 rounded-full border transition-all duration-300 min-w-[160px] snap-start",
                                            "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-500 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20",
                                            "data-[state=inactive]:bg-white dark:data-[state=inactive]:bg-slate-800/80 data-[state=inactive]:hover:bg-slate-50 dark:data-[state=inactive]:hover:bg-slate-800 data-[state=inactive]:border-slate-200 dark:data-[state=inactive]:border-slate-700 data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400",
                                            "group overflow-hidden tap-highlight-transparent"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-center justify-center w-10 h-10 rounded-full font-bold text-xs shrink-0 transition-colors",
                                            selectedClassId === cls.id
                                                ? "bg-white/20 text-white"
                                                : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                                        )}>
                                            {cls.course_code.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col items-start text-left truncate">
                                            <span className={cn(
                                                "font-bold text-[10px] uppercase tracking-wider mb-0.5 opacity-70",
                                            )}>
                                                {cls.course_code}
                                            </span>
                                            <span className="font-bold text-sm truncate w-full max-w-[120px] leading-none">
                                                {cls.class_name}
                                            </span>
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* Content Area - Rendered directly based on selection, not inside TabsContent to ensure updates */}
                        <div className="mt-2">
                            {loading ? (
                                <div className={cn(
                                    viewMode === 'grid'
                                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4"
                                        : "flex flex-col gap-3 max-w-4xl mx-auto"
                                )}>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <Card key={i} className="group relative overflow-hidden border-none shadow-md w-full max-w-sm mx-auto flex flex-col h-full rounded-2xl bg-[#3c3744]">
                                            <div className="relative h-32 bg-white/5 animate-pulse p-6"></div>
                                            <CardContent className="p-6 pt-6 flex flex-col h-full gap-6">
                                                <div className="space-y-3">
                                                    <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
                                                        <div className="h-4 w-1/3 bg-white/10 rounded animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[1, 2, 3].map((j) => (
                                                        <div key={j} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                                                    ))}
                                                </div>
                                                <div className="mt-auto h-12 bg-white/10 rounded-xl animate-pulse" />
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
                                            onViewDetails={(id) => navigate(`/student/quizzes/${id}/result`)}
                                            onViewLeaderboard={(id) => navigate(`/student/quizzes/${id}/leaderboard`)}
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
