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

export default function StudentQuizzes() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentQuizzes = async () => {
            if (!user) return;
            try {
                // Keep loading state only on initial load
                if (quizzes.length === 0) setLoading(true);

                // Get student email for fallback matching
                const studentEmail = user.email;

                // 1. Get enrolled classes
                const { data: enrollments } = await supabase
                    .from('class_students')
                    .select('class_id')
                    .or(`student_id.eq.${user.id},email.ilike.${studentEmail}`);

                const classIds = enrollments?.map(e => e.class_id).filter(Boolean) as string[] || [];

                if (classIds.length === 0) {
                    setQuizzes([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch published quizzes for these classes
                const { data: quizzesData } = await supabase
                    .from('quizzes')
                    .select(`
                        *,
                        classes (class_name, course_code),
                        quiz_submissions (id, status, total_obtained, is_archived, quiz_version)
                    `)
                    .in('class_id', classIds)
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });

                // Check if student attempted (filter out archived submissions)
                // If lecturer republishes, the old submission is archived, so 'activeSubmission' becomes undefined.
                // This automatically enables the "Start Quiz" button again.
                const processedQuizzes = quizzesData?.map(q => {
                    const activeSubmission = q.quiz_submissions?.find((s: any) => s.student_id === user.id && !s.is_archived);
                    return {
                        ...q,
                        my_submission: activeSubmission || null,
                    };
                }) || [];

                setQuizzes(processedQuizzes);

            } catch (error) {
                console.error('Error fetching student quizzes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentQuizzes();

        // Real-time updates
        const channel = supabase
            .channel('student_quizzes_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_submissions', filter: `student_id=eq.${user?.id}` }, () => fetchStudentQuizzes())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, () => fetchStudentQuizzes())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, quizzes.length]);

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
                            const isCompleted = quiz.my_submission && quiz.my_submission.status !== 'pending';
                            const isPending = quiz.my_submission && quiz.my_submission.status === 'pending';

                            // Reattempt Logic:
                            // If submission exists but its version is LOWER than quiz current version, offer re-attempt.
                            // If submission version is missing (legacy), assume it's older if quiz.version > 1.
                            const submissionVersion = quiz.my_submission?.quiz_version || 1;
                            const currentQuizVersion = quiz.version || 1;
                            const canReattempt = isCompleted && currentQuizVersion > submissionVersion;

                            // "Attempted" State applies only if Completed AND on Current Version
                            const showAttemptedState = isCompleted && !canReattempt;

                            return (
                                <Card key={quiz.id} className="group relative overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
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
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Your Score</p>
                                                    <p className="text-2xl font-black">{quiz.my_submission.total_obtained} <span className="text-sm text-muted-foreground font-medium">/ {quiz.total_marks}</span></p>
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

                                        {/* Actions Area */}
                                        <div className="mt-auto pt-2">
                                            {showAttemptedState ? (
                                                <div className="flex items-center gap-2">
                                                    {/* "Attempted" Text - Hidden/Disabled style as requested */}
                                                    <Button
                                                        variant="ghost"
                                                        disabled
                                                        className="flex-1 bg-muted/50 text-muted-foreground font-bold tracking-wide uppercase opacity-70 cursor-not-allowed justify-start"
                                                    >
                                                        Attempted
                                                    </Button>

                                                    {/* Dotted Menu for View Details */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-xl border-dashed">
                                                                <MoreVertical className="size-5 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => navigate(`/student/quizzes/${quiz.id}/details`)}>
                                                                <Eye className="size-4 mr-2" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => navigate(`/student/quizzes/${quiz.class_id}/${quiz.id}/results`)}>
                                                                <Trophy className="size-4 mr-2" />
                                                                View Leaderboard
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            ) : (
                                                <Button
                                                    className={`w-full h-14 text-lg font-bold rounded-2xl shadow-lg transition-all gap-2 ${canReattempt
                                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                                        : isPending
                                                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                                                            : 'shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                                                        }`}
                                                    onClick={() => handleAttempt(quiz.id)}
                                                >
                                                    {canReattempt ? (
                                                        <>
                                                            <PlayCircle className="size-5" />
                                                            Updated Quiz - Retake
                                                        </>
                                                    ) : isPending ? (
                                                        <>
                                                            <PlayCircle className="size-5" />
                                                            Resume Quiz
                                                        </>
                                                    ) : (
                                                        <>
                                                            Start Quiz <ArrowRight className="size-5" />
                                                        </>
                                                    )}
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
