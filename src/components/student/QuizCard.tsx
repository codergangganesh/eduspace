import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, FileText, Trophy, PlayCircle, CheckCircle, XCircle, Eye, ArrowRight } from 'lucide-react';
import { Quiz } from '@/types/quiz';

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
    onViewLeaderboard: (quizId: string) => void;
}

export function QuizCard({ quiz, onAttempt, onViewDetails, onViewLeaderboard }: QuizCardProps) {
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

    // Format duration helper (assuming time_taken is in seconds)
    // If not completed, we might want to show estimated duration if available in quiz metadata?
    // For now, let's use a placeholder or assume 30-45 mins if not specified, 
    // BUT the design shows "45 Mins". We don't have this field in Quiz type yet.
    // We'll use a placeholder "Unknown" or just hide it if not available.
    // The design shows "45 Mins" on the card.

    return (
        <Card className="group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-sm mx-auto flex flex-col h-full rounded-2xl bg-white dark:bg-slate-900">
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
                    <h3 className="font-extrabold text-2xl leading-tight line-clamp-2 mb-3 text-slate-900 dark:text-slate-100">
                        {quiz.title}
                    </h3>

                    {/* Instructor Info */}
                    {quiz.instructor && (
                        <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-sm">
                                <AvatarImage src={quiz.instructor.avatar_url || ''} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                                    {quiz.instructor.full_name?.charAt(0) || 'I'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                {quiz.instructor.full_name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Questions */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="p-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 mb-1.5">
                            <FileText className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{quiz._count?.questions || 0} Qs</span>
                    </div>

                    {/* Pass Percentage */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="p-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 mb-1.5">
                            <CheckCircle className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Pass: {quiz.pass_percentage}%</span>
                    </div>

                    {/* Points */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="p-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 mb-1.5">
                            <Trophy className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{quiz.total_marks} Pts</span>
                    </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto">
                    {showAttemptedState ? (
                        <div className="flex gap-3">
                            <Button
                                onClick={() => onViewDetails(quiz.id)}
                                className="flex-1 rounded-xl font-bold bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-sm h-12"
                            >
                                <Eye className="size-4 mr-2" />
                                Details
                            </Button>
                            <Button
                                onClick={() => onViewLeaderboard(quiz.id)}
                                className="rounded-xl font-bold bg-white border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 shadow-sm h-12 w-12 px-0"
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
