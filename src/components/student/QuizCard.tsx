import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, FileText, Trophy, PlayCircle, CheckCircle, XCircle, Eye, ArrowRight } from 'lucide-react';
import { Quiz } from '@/types/quiz';
import { cn } from '@/lib/utils';

interface QuizCardProps {
    quiz: Quiz & {
        my_submission?: any;
        instructor?: {
            full_name: string | null;
            avatar_url: string | null;
        } | null;
        _count?: {
            questions: number;
        };
        classes?: {
            class_name: string;
            course_code: string;
        } | null;
    };
    onAttempt: (quizId: string) => void;
    onViewDetails: (quizId: string) => void;
    onViewLeaderboard: (quizId: string, classId: string) => void;
    viewMode?: 'grid' | 'list';
    className?: string;
}

export function QuizCard({ quiz, onAttempt, onViewDetails, onViewLeaderboard, viewMode = 'grid', className }: QuizCardProps) {
    // Determine state
    const hasActiveSubmission = !!quiz.my_submission && !quiz.my_submission.is_archived;
    const isCompleted = hasActiveSubmission && quiz.my_submission.status !== 'pending';

    // Reattempt Logic
    const submissionVersion = quiz.my_submission?.quiz_version || 0;
    const currentQuizVersion = (quiz as any).version || 1;
    const canReattempt = isCompleted && currentQuizVersion > submissionVersion;

    // Final decision: Show "Attempted" state if completed AND on current version
    const showAttemptedState = isCompleted && !canReattempt;
    const isPassed = quiz.my_submission?.status === 'passed';

    if (viewMode === 'list') {
        return (
            <Card className={cn(
                "group relative overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300 w-full rounded-xl bg-white dark:bg-[#3c3744] text-slate-900 dark:text-white border-slate-200 dark:border-white/5",
                className
            )}>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    {/* Left: Status & Course */}
                    <div className="flex items-center gap-3 md:w-48 shrink-0">
                        <div className={`p-3 rounded-xl ${showAttemptedState
                            ? (isPassed ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-100/50 text-red-600 dark:bg-red-900/20 dark:text-red-400')
                            : 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                            {showAttemptedState ? (
                                isPassed ? <CheckCircle className="size-6" /> : <XCircle className="size-6" />
                            ) : (
                                <PlayCircle className="size-6" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Badge variant="secondary" className="w-fit mb-1 bg-blue-400 hover:bg-blue-500 text-blue-950 border-none text-[10px] font-bold">
                                {quiz.classes?.course_code || 'COURSE'}
                            </Badge>
                            <span className="text-xs font-semibold text-slate-500 dark:text-muted-foreground">
                                {showAttemptedState ? quiz.my_submission?.status?.toUpperCase() : 'NOT STARTED'}
                            </span>
                        </div>
                    </div>

                    {/* Middle: Title & Instructor */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                        <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-white truncate">
                            {quiz.title}
                        </h3>
                        {quiz.instructor && (
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
                                    by {quiz.instructor.full_name}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right: Metrics */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300 shrink-0 border-r border-slate-200 dark:border-white/10 pr-4 mr-2 hidden md:flex">
                        <div className="flex items-center gap-1.5" title="Questions">
                            <FileText className="size-4" />
                            <span className="font-medium text-slate-900 dark:text-white">{quiz._count?.questions || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Total Points">
                            <Trophy className="size-4" />
                            <span className="font-medium text-slate-900 dark:text-white">{quiz.total_marks} Pts</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Pass Score">
                            <CheckCircle className="size-4" />
                            <span className="font-medium text-slate-900 dark:text-white">{quiz.pass_percentage}% Pass</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 w-full md:w-auto">
                        {showAttemptedState ? (
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button
                                    onClick={() => onViewDetails(quiz.id)}
                                    size="sm"
                                    className="flex-1 md:flex-none font-semibold"
                                    variant="outline"
                                >
                                    Details
                                </Button>
                                <Button
                                    onClick={() => onViewLeaderboard(quiz.id, quiz.class_id)}
                                    size="icon"
                                    className="shrink-0"
                                    variant="ghost"
                                >
                                    <Trophy className="size-4 text-amber-500" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={() => onAttempt(quiz.id)}
                                size="sm"
                                className="w-full md:w-auto font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            >
                                Start Quiz
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 w-full flex flex-col h-full rounded-2xl bg-white dark:bg-[#1a1625] text-slate-900 dark:text-white",
            className
        )}>
            {/* Header Section - Compact Gradient */}
            <div className="relative h-16 bg-gradient-to-br from-blue-600 to-blue-800 p-3 flex flex-col justify-between overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -top-6 -right-6 size-20 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                <div className="flex justify-between items-start relative z-10">
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md font-bold tracking-wider uppercase text-[8px] px-2 py-1 rounded-md truncate max-w-[90px] shrink-0">
                        {quiz.classes?.course_code || 'COURSE'}
                    </Badge>

                    {showAttemptedState ? (
                        <Badge className={cn("border-none font-bold shadow-lg backdrop-blur-md px-2 py-0.5 rounded-md text-[8px]", isPassed ? 'bg-emerald-400 text-emerald-950' : 'bg-red-400 text-red-950')}>
                            {quiz.my_submission?.status?.toUpperCase()}
                        </Badge>
                    ) : (
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md font-bold shadow-sm px-2 py-0.5 rounded-md text-[8px]">
                            NOT STARTED
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content Body - Compact */}
            <CardContent className="p-3 flex flex-col h-full gap-3 relative">
                {/* Title */}
                <div>
                    <h3 className="font-black text-sm leading-snug line-clamp-2 mb-2 text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors" title={quiz.title}>
                        {quiz.title}
                    </h3>

                    {/* Instructor Info */}
                    {quiz.instructor && (
                        <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5 border border-background shadow-sm shrink-0">
                                <AvatarImage src={quiz.instructor.avatar_url || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-[8px]">
                                    {quiz.instructor.full_name?.charAt(0) || 'I'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                                {quiz.instructor.full_name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Metrics Grid - Stacked */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                        <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                            <FileText className="size-3 text-blue-500 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{quiz._count?.questions || 0} Questions</span>
                        </div>
                        <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                            <Trophy className="size-3 text-amber-500 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{quiz.total_marks} Pts</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10">
                        <Clock className="size-3 text-indigo-500 shrink-0" />
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {quiz.pass_percentage}% Required to Pass
                        </span>
                    </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto">
                    {showAttemptedState ? (
                        <div className="flex gap-2">
                            <Button
                                onClick={() => onViewDetails(quiz.id)}
                                className="flex-1 rounded-xl font-bold text-xs h-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 shadow transition-all flex items-center justify-center gap-1"
                            >
                                <Eye className="size-3" />
                                Details
                            </Button>
                            <Button
                                onClick={() => onViewLeaderboard(quiz.id, quiz.class_id)}
                                variant="outline"
                                className="rounded-xl h-8 w-8 p-0 border-slate-200 dark:border-white/10"
                                title="Leaderboard"
                            >
                                <Trophy className="size-3.5 text-amber-500" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => onAttempt(quiz.id)}
                            className="w-full rounded-xl font-bold text-xs h-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow transition-all hover:scale-[1.02] active:scale-95 border-none"
                        >
                            {canReattempt ? 'Retake Quiz' : 'Start Quiz'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
