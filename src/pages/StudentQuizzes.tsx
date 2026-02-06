import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, ArrowRight, XCircle, MoreVertical, PlayCircle, Eye, Trophy } from 'lucide-react';
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {quizzes.map((quiz) => {
                            // Single source of truth: Does an active submission exist?
                            const hasActiveSubmission = !!quiz.my_submission && !quiz.my_submission.is_archived;
                            const isCompleted = hasActiveSubmission && quiz.my_submission.status !== 'pending';
                            const isPending = hasActiveSubmission && quiz.my_submission.status === 'pending';

                            // Reattempt Logic:
                            // If submission exists but its version is LOWER than quiz current version, offer re-attempt.
                            // If submission version is missing (legacy), assume it's older if quiz.version > 1.
                            const submissionVersion = quiz.my_submission?.quiz_version || 0;
                            const currentQuizVersion = quiz.version || 1;
                            const canReattempt = isCompleted && currentQuizVersion > submissionVersion;

                            // Final decision: Show "Attempted" state if completed AND on current version
                            const showAttemptedState = isCompleted && !canReattempt;

                            console.log(`Quiz [${quiz.title}]:`, {
                                id: quiz.id,
                                hasActiveSubmission,
                                isCompleted,
                                submissionVersion,
                                currentQuizVersion,
                                canReattempt,
                                showAttemptedState,
                                submissionStatus: quiz.my_submission?.status
                            });

                            return (
                                <Card key={quiz.id} className={`group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 border-l-4 
                                    ${showAttemptedState
                                        ? 'bg-slate-50/80 dark:bg-slate-900/50 border-l-slate-400 border-r-4 border-r-slate-300 dark:border-r-slate-700 border-r-dotted opacity-90'
                                        : 'bg-gradient-to-br from-card to-card/50 border-l-primary/20 hover:border-l-primary'
                                    }`}>
                                    <CardContent className="p-7 flex flex-col h-full gap-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-3">
                                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                                    {quiz.classes?.course_code}
                                                </Badge>
                                                <h3 className="font-bold text-2xl line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={quiz.title}>
                                                    {quiz.title}
                                                </h3>
                                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full w-fit">
                                                    {quiz.classes?.class_name}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0">
                                                {showAttemptedState ? (
                                                    quiz.my_submission.status === 'passed' ? (
                                                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                                            <CheckCircle className="text-emerald-500 size-7" />
                                                        </div>
                                                    ) : (
                                                        <div className="p-3 bg-red-500/10 rounded-2xl">
                                                            <XCircle className="text-red-500 size-7" />
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                                                        <Clock className="text-blue-500 size-7" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 rounded-xl bg-muted/30">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Total Points</p>
                                                <p className="text-xl font-black">{quiz.total_marks}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-muted/30">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Pass Score</p>
                                                <p className="text-xl font-black">{quiz.pass_percentage}%</p>
                                            </div>
                                        </div>

                                        {/* Show Marks/Status if Attempted */}
                                        {showAttemptedState && (
                                            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex justify-between items-center">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Your Score</p>
                                                    <p className="text-2xl font-black leading-none">{quiz.my_submission.total_obtained} <span className="text-sm text-muted-foreground font-medium">/ {quiz.total_marks}</span></p>

                                                    {quiz.my_submission.time_taken !== null && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mt-1">
                                                            <Clock className="size-3" />
                                                            {Math.floor(quiz.my_submission.time_taken / 60)}m {quiz.my_submission.time_taken % 60}s
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <Badge className={quiz.my_submission.status === 'passed' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}>
                                                        {quiz.my_submission.status.toUpperCase()}
                                                    </Badge>
                                                    <p className="text-xs font-bold mt-1 text-muted-foreground">
                                                        {Math.round((quiz.my_submission.total_obtained / quiz.total_marks) * 100)}%
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions Area - Critical: Only show Start Quiz if NO active submission exists */}
                                        <div className="mt-auto pt-2">
                                            {hasActiveSubmission ? (
                                                showAttemptedState ? (
                                                    // Fully completed quiz on current version - show attempted state
                                                    <div className="flex items-center gap-2 w-full">
                                                        {/* View Details Button - Primary Action for Attempted */}
                                                        <Button
                                                            onClick={() => navigate(`/student/quizzes/${quiz.id}/details`)}
                                                            className="flex-1 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-bold shadow-sm"
                                                            variant="outline"
                                                        >
                                                            <Eye className="size-4 mr-2 text-blue-500" />
                                                            View Details
                                                        </Button>

                                                        {/* Leaderboard Button */}
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="shrink-0 h-10 w-10 rounded-xl border-dashed"
                                                            onClick={() => navigate(`/student/quizzes/${quiz.class_id}/${quiz.id}/results`)}
                                                            title="View Leaderboard"
                                                        >
                                                            <Trophy className="size-4 text-amber-500" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    // Pending or can reattempt - show appropriate action button
                                                    <Button
                                                        className={`w-full h-14 text-lg font-bold rounded-2xl shadow-lg transition-all gap-2 ${canReattempt
                                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                                                            }`}
                                                        onClick={() => handleAttempt(quiz.id)}
                                                    >
                                                        {canReattempt ? (
                                                            <>
                                                                <PlayCircle className="size-5" />
                                                                Updated Quiz - Retake
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PlayCircle className="size-5" />
                                                                Resume Quiz
                                                            </>
                                                        )}
                                                    </Button>
                                                )
                                            ) : (
                                                // No submission exists - show Start Quiz button
                                                <Button
                                                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] gap-2"
                                                    onClick={() => handleAttempt(quiz.id)}
                                                >
                                                    Start Quiz <ArrowRight className="size-5" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
