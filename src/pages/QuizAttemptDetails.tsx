import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, ArrowLeft, Trophy, Target, FileText } from 'lucide-react';

export default function QuizAttemptDetails() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [quiz, setQuiz] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [rank, setRank] = useState<{ position: number, total: number } | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!quizId || !user) return;
            try {
                setLoading(true);

                // 1. Fetch Quiz Details
                const { data: quizData, error: quizError } = await supabase
                    .from('quizzes')
                    .select('*, classes(class_name)')
                    .eq('id', quizId)
                    .single();

                if (quizError) throw quizError;
                setQuiz(quizData);

                // 2. Fetch Submission (Active one preferred, or latest)
                const { data: submission } = await supabase
                    .from('quiz_submissions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .eq('student_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (!submission) {
                    // Should not happen if coming from "View Details"
                    setLoading(false);
                    return;
                }
                setResult(submission);

                // 3. Fetch Questions
                const { data: questionsData } = await supabase
                    .from('quiz_questions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .order('order_index');

                setQuestions(questionsData || []);

                // 4. Fetch Answers
                const { data: existingAnswers } = await supabase
                    .from('quiz_answers')
                    .select('question_id, selected_option')
                    .eq('submission_id', submission.id);

                if (existingAnswers) {
                    const loadedAnswers: Record<string, string> = {};
                    existingAnswers.forEach((a: any) => {
                        loadedAnswers[a.question_id] = a.selected_option;
                    });
                    setAnswers(loadedAnswers);
                }

                // 5. Fetch Ranking
                const { count: higherScoresCount } = await supabase
                    .from('quiz_submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('quiz_id', quizId)
                    .gt('total_obtained', submission.total_obtained);

                const { count: totalSubmissions } = await supabase
                    .from('quiz_submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('quiz_id', quizId);

                if (higherScoresCount !== null && totalSubmissions !== null) {
                    setRank({
                        position: higherScoresCount + 1,
                        total: totalSubmissions
                    });
                }

            } catch (error) {
                console.error('Error loading quiz details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [quizId, user]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin size-10 text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!quiz || !result) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <FileText className="size-16 text-muted-foreground" />
                    <h2 className="text-2xl font-bold">Details Not Found</h2>
                    <Button onClick={() => navigate('/student/quizzes')}>Back to Quizzes</Button>
                </div>
            </DashboardLayout>
        );
    }

    const percentage = Math.round((result.total_obtained / quiz.total_marks) * 100);
    const isPassed = result.status === 'passed';

    return (
        <DashboardLayout>
            <div className="min-h-full bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 p-4 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header Card (Attempted Style) */}
                    <Card className="overflow-hidden border-0 shadow-xl bg-white dark:bg-slate-900">
                        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                                    {quiz.title}
                                    <span className={`text-sm px-3 py-1 rounded-full text-white font-bold uppercase tracking-wider ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                        {isPassed ? 'Passed' : 'Failed'}
                                    </span>
                                </h1>
                                <p className="text-slate-500 font-medium">Attempted on {new Date(result.submitted_at || result.created_at).toLocaleDateString()}</p>
                            </div>

                            <div className="flex items-center gap-6 text-center">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Score</p>
                                    <p className={`text-4xl font-black ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {result.total_obtained}<span className="text-lg text-slate-400 font-medium">/{quiz.total_marks}</span>
                                    </p>
                                </div>
                                <div className="hidden sm:block w-px h-12 bg-slate-200 dark:bg-slate-800" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rank</p>
                                    <p className="text-4xl font-black text-blue-600">
                                        {rank ? `#${rank.position}` : '-'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex justify-start">
                        <Button
                            onClick={() => navigate('/student/quizzes')}
                            variant="outline"
                            className="bg-white hover:bg-slate-50 border-slate-200"
                        >
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Quizzes
                        </Button>
                    </div>

                    {/* Answer Review */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold px-2 flex items-center gap-2">
                            <FileText className="size-5 text-blue-500" />
                            Detailed Review
                        </h2>
                        {questions.map((q, index) => {
                            const userAnswerId = answers[q.id];
                            const isCorrect = userAnswerId === q.correct_answer;

                            return (
                                <Card key={q.id} className={`border-l-4 ${isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'} shadow-sm`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`flex items-center justify-center size-8 rounded-lg font-bold text-white text-sm ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                                    {index + 1}
                                                </span>
                                                <p className="font-semibold text-lg">{q.question_text}</p>
                                            </div>
                                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                                                {q.marks} pts
                                            </span>
                                        </div>
                                        <div className="grid gap-2 pl-11">
                                            {q.options.map((option: any) => {
                                                const isSelected = userAnswerId === option.id;
                                                const isTheCorrectAnswer = q.correct_answer === option.id;

                                                let className = "flex items-center gap-3 p-3 rounded-lg border text-sm ";
                                                if (isTheCorrectAnswer) {
                                                    className += "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30";
                                                } else if (isSelected) {
                                                    className += "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30";
                                                } else {
                                                    className += "bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800";
                                                }

                                                return (
                                                    <div key={option.id} className={className}>
                                                        <span className="font-medium flex-1">{option.text}</span>
                                                        {isTheCorrectAnswer && (
                                                            <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-100 px-2 py-0.5 rounded">Correct</span>
                                                        )}
                                                        {isSelected && !isTheCorrectAnswer && (
                                                            <span className="text-[10px] font-bold text-red-600 uppercase bg-red-100 px-2 py-0.5 rounded">Your Answer</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
