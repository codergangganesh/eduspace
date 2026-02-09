import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { QuizCard } from '@/components/student/QuizCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, ArrowRight, XCircle, MoreVertical, PlayCircle, Eye, Trophy, LayoutGrid, List } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useStudentQuizzes } from '@/hooks/useStudentQuizzes';

export default function StudentQuizzes() {
    const navigate = useNavigate();
    const { quizzes, loading } = useStudentQuizzes();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    // Effect removed as hook handles fetching and subscriptions

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

                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50 self-start lg:self-auto">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={cn("h-9 px-3 rounded-lg transition-all", viewMode === 'grid' && "shadow-sm")}
                        >
                            <LayoutGrid className="size-4 mr-2" />
                            <span className="text-xs font-semibold tracking-wide">Grid</span>
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={cn("h-9 px-3 rounded-lg transition-all", viewMode === 'list' && "shadow-sm")}
                        >
                            <List className="size-4 mr-2" />
                            <span className="text-xs font-semibold tracking-wide">List</span>
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : quizzes.length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/20 rounded-3xl">
                        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="p-6 rounded-full bg-primary/10 mb-6">
                                <FileText className="size-16 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Your desk is clear!</h3>
                            <p className="text-muted-foreground text-lg max-w-md mx-auto">
                                You don't have any pending quizzes or assessments at the moment. Great job!
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                            : "flex flex-col gap-4"
                    )}>
                        {quizzes.map((quiz) => (
                            viewMode === 'grid' ? (
                                <QuizCard
                                    key={quiz.id}
                                    quiz={quiz}
                                    onAttempt={(id) => navigate(`/student/quizzes/${id}`)}
                                    onViewDetails={(id) => navigate(`/student/quizzes/${id}/details`)}
                                    onViewLeaderboard={(id) => navigate(`/student/quizzes/${quiz.class_id}/${id}/results`)}
                                />
                            ) : (
                                <Card key={quiz.id} className="group overflow-hidden border border-border/50 bg-card hover:shadow-xl transition-all duration-300 rounded-xl">
                                    <div className="flex flex-col sm:flex-row h-full">
                                        {/* Color Strip */}
                                        <div className="w-full sm:w-2 bg-gradient-to-b from-blue-500 to-indigo-600 h-2 sm:h-auto" />

                                        <div className="flex-1 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                            {/* Icon */}
                                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
                                                <FileText className="size-6" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none text-[10px] tracking-wider font-bold">
                                                        {quiz.classes?.course_code || 'COURSE'}
                                                    </Badge>

                                                    {quiz.my_submission && !quiz.my_submission.is_archived && quiz.my_submission.status !== 'pending' ? (
                                                        <Badge className={cn(
                                                            "font-bold uppercase text-[10px]",
                                                            quiz.my_submission.status === 'passed' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                        )}>
                                                            {quiz.my_submission.status}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                                                            NOT STARTED
                                                        </Badge>
                                                    )}
                                                </div>

                                                <h3 className="font-bold text-lg text-slate-900 leading-tight truncate">
                                                    {quiz.title}
                                                </h3>

                                                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <Trophy className="size-3.5" />
                                                        {quiz.total_marks} Points
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <FileText className="size-3.5" />
                                                        {quiz._count?.questions || 0} Questions
                                                    </span>
                                                    {quiz.instructor && (
                                                        <span className="flex items-center gap-1.5 text-slate-700">
                                                            <Avatar className="h-4 w-4">
                                                                <AvatarImage src={quiz.instructor.avatar_url || ''} />
                                                                <AvatarFallback className="text-[8px]">{quiz.instructor.full_name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            {quiz.instructor.full_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                                                {quiz.my_submission && !quiz.my_submission.is_archived && quiz.my_submission.status !== 'pending' ? (
                                                    <>
                                                        <Button
                                                            onClick={() => navigate(`/student/quizzes/${quiz.id}/details`)}
                                                            variant="outline"
                                                            className="flex-1 sm:flex-none font-bold text-slate-0 whitespace-nowrap px-4"
                                                        >
                                                            <Eye className="size-4 mr-2" />
                                                            Details
                                                        </Button>
                                                        <Button
                                                            onClick={() => navigate(`/student/quizzes/${quiz.class_id}/${quiz.id}/results`)}
                                                            variant="outline"
                                                            className="h-10 w-10 p-0 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-700"
                                                        >
                                                            <Trophy className="size-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
                                                        className="w-full sm:w-auto font-bold bg-[#FCD34D] hover:bg-[#FBBF24] text-slate-900 shadow-sm"
                                                    >
                                                        Start Quiz
                                                        <ArrowRight className="size-4 ml-2" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
