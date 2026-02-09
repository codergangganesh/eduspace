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
                "group relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 w-full rounded-xl bg-[#3c3744] text-white border border-white/5",
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
                            <Badge variant="outline" className="w-fit mb-1 border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                                {quiz.classes?.course_code || 'COURSE'}
                            </Badge>
                            <span className="text-xs font-semibold text-muted-foreground">
                                {showAttemptedState ? quiz.my_submission?.status?.toUpperCase() : 'NOT STARTED'}
                            </span>
                        </div>
                    </div>

                    {/* Middle: Title & Instructor */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                        <h3 className="font-bold text-lg leading-tight text-white truncate">
                            {quiz.title}
                        </h3>
                        {quiz.instructor && (
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                <span className="text-xs font-medium text-slate-300">
                                    by {quiz.instructor.full_name}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right: Metrics */}
                    <div className="flex items-center gap-2 text-sm text-slate-300 shrink-0 border-r border-white/10 pr-4 mr-2 hidden md:flex">
                        <div className="flex items-center gap-1.5" title="Questions">
                            <FileText className="size-4" />
                            <span className="font-medium text-white">{quiz._count?.questions || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Total Points">
                            <Trophy className="size-4" />
                            <span className="font-medium text-white">{quiz.total_marks} Pts</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Pass Score">
                            <CheckCircle className="size-4" />
                            <span className="font-medium text-white">{quiz.pass_percentage}% Pass</span>
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
            "group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-sm mx-auto flex flex-col h-full rounded-2xl bg-[#3c3744] text-white sm:max-w-md md:max-w-full",
            className
        )}>
            {/* Header Section - Blue Gradient */}
            <div className="relative h-32 bg-gradient-to-br from-blue-500 to-indigo-600 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm font-bold tracking-wider uppercase text-[10px] px-2.5 py-1">
                        {quiz.classes?.course_code || 'COURSE'}
                    </Badge>

                    {showAttemptedState ? (
                        <Badge className={`${isPassed ? 'bg-emerald-400 text-emerald-950' : 'bg-red-400 text-red-950'} hover:bg-opacity-90 border-none font-bold shadow-sm`}>
                            {quiz.my_submission?.status?.toUpperCase()}
                        </Badge>
                    ) : (
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm font-bold shadow-sm">
                            NOT STARTED
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <CardContent className="p-6 pt-6 flex flex-col h-full gap-6">
                {/* Title */}
                <div>
                    <h3 className="font-extrabold text-2xl leading-tight line-clamp-2 mb-3 text-white">
                        {quiz.title}
                    </h3>

                    {/* Instructor Info */}
                    {quiz.instructor && (
                        <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border-2 border-white/10 shadow-sm">
                                <AvatarImage src={quiz.instructor.avatar_url || ''} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                                    {quiz.instructor.full_name?.charAt(0) || 'I'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-slate-200">
                                {quiz.instructor.full_name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Questions */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/20">
                        <div className="p-1.5 rounded-full bg-white/10 text-white mb-1.5">
                            <FileText className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white">{quiz._count?.questions || 0} Qs</span>
                    </div>

                    {/* Pass Percentage */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/20">
                        <div className="p-1.5 rounded-full bg-white/10 text-white mb-1.5">
                            <CheckCircle className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white">Pass: {quiz.pass_percentage}%</span>
                    </div>

                    {/* Points */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black/20">
                        <div className="p-1.5 rounded-full bg-white/10 text-white mb-1.5">
                            <Trophy className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white">{quiz.total_marks} Pts</span>
                    </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto">
                    {showAttemptedState ? (
                        <div className="flex gap-3">
                            <Button
                                onClick={() => onViewDetails(quiz.id)}
                                className="flex-1 rounded-xl font-bold bg-white/10 border-2 border-white/5 text-white hover:bg-white/20 hover:text-white hover:border-white/10 shadow-sm h-12"
                            >
                                <Eye className="size-4 mr-2" />
                                Details
                            </Button>
                            <Button
                                onClick={() => onViewLeaderboard(quiz.id, quiz.class_id)}
                                className="rounded-xl font-bold bg-white/10 border-2 border-white/5 text-white hover:bg-white/20 hover:text-white hover:border-white/10 shadow-sm h-12 w-12 px-0"
                                title="Leaderboard"
                            >
                                <Trophy className="size-5 text-amber-500" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => onAttempt(quiz.id)}
                            className="w-full rounded-xl font-extrabold text-base h-14 shadow-lg shadow-amber-400/20 bg-[#FCD34D] hover:bg-[#FBBF24] text-slate-900 border-none transition-transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {canReattempt ? 'Retake Quiz' : 'Start Quiz'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
