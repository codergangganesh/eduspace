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
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold">My Quizzes</h1>
                    <p className="text-muted-foreground">Available quizzes from your enrolled classes</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : quizzes.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-full bg-primary/10 mb-4">
                                <FileText className="size-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No quizzes available</h3>
                            <p className="text-muted-foreground">
                                You don't have any pending quizzes at this time.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizzes.map((quiz) => (
                            <Card key={quiz.id} className="group hover:shadow-md transition-all overflow-hidden border-l-4 border-l-primary/50">
                                <CardContent className="p-6 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Badge variant="outline" className="mb-2">
                                                {quiz.classes?.course_code}
                                            </Badge>
                                            <h3 className="font-semibold text-lg line-clamp-1" title={quiz.title}>
                                                {quiz.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {quiz.classes?.class_name}
                                            </p>
                                        </div>
                                        {quiz.my_submission ? (
                                            quiz.my_submission.status === 'passed' ? (
                                                <CheckCircle className="text-green-500 size-6" />
                                            ) : (
                                                <XCircle className="text-red-500 size-6" />
                                            )
                                        ) : (
                                            <Clock className="text-primary size-6" />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>{quiz.total_marks} Marks</span>
                                        <span>•</span>
                                        <span>{quiz.pass_percentage}% to Pass</span>
                                    </div>

                                    {quiz.my_submission ? (
                                        <div className={`mt-auto p-3 rounded-lg flex justify-between items-center ${quiz.my_submission.status === 'passed'
                                                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                                : 'bg-red-500/10 text-red-700 dark:text-red-400'
                                            }`}>
                                            <span className="font-medium">
                                                {quiz.my_submission.status === 'passed' ? 'Passed' : 'Failed'}
                                            </span>
                                            <span className="font-bold">
                                                {quiz.my_submission.total_obtained} / {quiz.total_marks}
                                            </span>
                                        </div>
                                    ) : (
                                        <Button className="w-full mt-auto group-hover:bg-primary/90" onClick={() => handleAttempt(quiz.id)}>
                                            Attempt Quiz <ArrowRight className="ml-2 size-4" />
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
