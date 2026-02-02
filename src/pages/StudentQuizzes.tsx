import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, ArrowRight, XCircle } from 'lucide-react';
import { useQuizzes } from '@/hooks/useQuizzes'; // We might need a new hook or update this one to fetch ALL student quizzes
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { Quiz } from '@/types/quiz';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function StudentQuizzes() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentQuizzes = async () => {
            if (!user) return;
            try {
                setLoading(true);
                // 1. Get enrolled classes (we could reuse useClasses, but let's do direct for speed/custom query)
                const { data: enrollments } = await supabase
                    .from('class_students')
                    .select('class_id')
                    .eq('student_id', user.id);

                const classIds = enrollments?.map(e => e.class_id) || [];

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
                        quiz_submissions (id, status, total_obtained)
                    `)
                    .in('class_id', classIds)
                    .eq('status', 'published') // Or closed too if we want to show history? Prompt says "Quiz remains available until lecturer closes it". Closed quizzes might be viewable but not attempted.
                    .order('created_at', { ascending: false });

                // Check if student attempted
                const processedQuizzes = quizzesData?.map(q => {
                    const submission = q.quiz_submissions?.find((s: any) => s.student_id === user.id); // Although simple query filters by user? RLS should filter submissions? 
                    // Wait, the select `quiz_submissions` will fetch ALL submissions for that quiz if RLS allows? 
                    // My RLS says: "Students can view their own submissions". So yes, we only see ours.
                    return {
                        ...q,
                        my_submission: q.quiz_submissions?.[0] || null
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
    }, [user]);

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
                        {quizzes.map((quiz) => (
                            <Card key={quiz.id} className="group relative overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-md hover:shadow-2xl transition-all duration-500 border-l-4 border-l-primary/20 hover:border-l-primary">
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
                                            {quiz.my_submission ? (
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
                                                <div className="p-3 bg-blue-500/10 rounded-2xl animate-pulse">
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

                                    {quiz.my_submission ? (
                                        <div className={`mt-auto p-5 rounded-2xl border flex flex-col gap-3 ${quiz.my_submission.status === 'passed'
                                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400'
                                            }`}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs uppercase font-black tracking-widest opacity-80">Final Result</span>
                                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-current opacity-80">
                                                    {quiz.my_submission.status === 'passed' ? 'COMPLETED' : 'RE-ATTEMPT NEEDED'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-2xl font-black tracking-tight leading-none uppercase">
                                                    {quiz.my_submission.status === 'passed' ? 'Passed' : 'Failed'}
                                                </span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black leading-none">{quiz.my_submission.total_obtained}</span>
                                                    <span className="text-xs font-bold opacity-60">/ {quiz.total_marks}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full h-14 mt-auto text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
                                            onClick={() => handleAttempt(quiz.id)}
                                        >
                                            Start Assessment <ArrowRight className="size-5" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
