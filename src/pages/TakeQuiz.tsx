import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight, Clock, Trophy, Target, ArrowLeft, Save } from 'lucide-react';

export default function TakeQuiz() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [quiz, setQuiz] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [rank, setRank] = useState<{ position: number, total: number } | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // LocalStorage keys for persistence
    const getStorageKey = (key: string) => `quiz_${quizId}_${key}`;

    // Load saved quiz state from localStorage on mount
    useEffect(() => {
        if (!quizId) return;

        const savedIndex = localStorage.getItem(getStorageKey('currentIndex'));
        const savedStartTime = localStorage.getItem(getStorageKey('startTime'));

        if (savedIndex !== null) {
            setCurrentIndex(parseInt(savedIndex, 10));
        }

        // Initialize start time if not exists
        let startTimestamp = savedStartTime ? parseInt(savedStartTime, 10) : Date.now();
        if (!savedStartTime) {
            localStorage.setItem(getStorageKey('startTime'), startTimestamp.toString());
        }

        // Star timer
        timerRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTimestamp) / 1000);
            setElapsedTime(elapsed);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [quizId]);

    // Save currentIndex to localStorage when it changes
    useEffect(() => {
        if (quizId && !result) {
            localStorage.setItem(getStorageKey('currentIndex'), currentIndex.toString());
        }
    }, [currentIndex, quizId, result]);

    // Clear localStorage when quiz is submitted
    const clearQuizStorage = () => {
        if (quizId) {
            localStorage.removeItem(getStorageKey('currentIndex'));
            localStorage.removeItem(getStorageKey('startTime'));
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const fetchQuizData = async () => {
            if (!quizId || !user) return;
            try {
                setLoading(true);
                const { data: quizData, error: quizError } = await supabase
                    .from('quizzes')
                    .select('*, classes(class_name)')
                    .eq('id', quizId)
                    .single();

                if (quizError) throw quizError;
                setQuiz(quizData);

                // Check for existing ACTIVE submission (pending or completed, but not archived)
                // We order by created_at desc to get the latest attempt
                const { data: submission } = await supabase
                    .from('quiz_submissions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .eq('student_id', user.id)
                    .eq('is_archived', false) // Use active submissions only
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (submission) {
                    setSubmissionId(submission.id);
                    if (submission.status === 'pending') {
                        setResult(null);
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
                            toast.info('Resuming your quiz attempt');
                        }
                    } else {
                        // Submission is already completed (passed/failed)
                        setResult(submission);
                        setLoading(false);
                        return;
                    }
                } else {
                    // Try to create only if we didn't find one
                    const { data: newSubmission, error: createError } = await supabase
                        .from('quiz_submissions')
                        .insert({
                            quiz_id: quizId,
                            student_id: user.id,
                            total_obtained: 0,
                            status: 'pending'
                        })
                        .select()
                        .single();

                    if (createError) {
                        // Handle unique constraint violation (race condition or filter mismatch)
                        if (createError.code === '23505') {
                            console.log('Found existing submission via uniqueness constraint, recovering...');
                            const { data: recoveredSub } = await supabase
                                .from('quiz_submissions')
                                .select('*')
                                .eq('quiz_id', quizId)
                                .eq('student_id', user.id)
                                .eq('status', 'pending')
                                .maybeSingle();

                            if (recoveredSub) {
                                setSubmissionId(recoveredSub.id);
                                // Should load answers here too technically, but usually new/empty
                            }
                        } else {
                            console.error('Error creating pending submission', createError);
                        }
                    } else if (newSubmission) {
                        setSubmissionId(newSubmission.id);
                    }
                }

                const { data: questionsData, error: questionsError } = await supabase
                    .from('quiz_questions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .order('order_index');

                if (questionsError) throw questionsError;
                setQuestions(questionsData || []);

            } catch (error) {
                console.error('Error loading quiz:', error);
                toast.error('Failed to load quiz');
                navigate('/student/quizzes');
            } finally {
                setLoading(false);
            }
        };

        fetchQuizData();
    }, [quizId, user, navigate]);

    useEffect(() => {
        if (result && quizId) {
            const fetchRank = async () => {
                try {
                    const { count: higherScoresCount } = await supabase
                        .from('quiz_submissions')
                        .select('*', { count: 'exact', head: true })
                        .eq('quiz_id', quizId)
                        .gt('total_obtained', result.total_obtained);

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
                } catch (e) {
                    console.error("Error fetching rank", e);
                }
            };
            fetchRank();
        }
    }, [result, quizId]);

    const handleAnswerChange = async (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));

        if (submissionId) {
            const { error } = await supabase.from('quiz_answers').upsert({
                submission_id: submissionId,
                question_id: questionId,
                selected_option: optionId
            }, { onConflict: 'submission_id,question_id' } as any);

            if (error) console.error("Error auto-saving answer", error);
        }
    };

    const clearAnswer = () => {
        const currentQuestion = questions[currentIndex];
        if (currentQuestion) {
            setAnswers(prev => {
                const newAnswers = { ...prev };
                delete newAnswers[currentQuestion.id];
                return newAnswers;
            });
        }
    };

    const handleSubmit = async () => {
        if (!user || !quiz) return;

        const unansweredCount = questions.length - Object.keys(answers).length;
        if (unansweredCount > 0) {
            if (!confirm(`You have ${unansweredCount} unanswered questions. Submit anyway?`)) {
                return;
            }
        }

        setSubmitting(true);
        try {
            // Ensure submissionId exists
            let activeSubmissionId = submissionId;

            if (!activeSubmissionId) {
                console.log("No active submission ID, checking for existing pending submission...");

                // 1. Check for existing pending submission first
                const { data: existingSub } = await supabase
                    .from('quiz_submissions')
                    .select('id')
                    .eq('quiz_id', quizId)
                    .eq('student_id', user.id)
                    .eq('status', 'pending')
                    .maybeSingle();

                if (existingSub) {
                    console.log("Found existing pending submission:", existingSub.id);
                    activeSubmissionId = existingSub.id;
                    setSubmissionId(existingSub.id);
                } else {
                    // 2. Only create if no pending submission exists
                    console.log("No pending submission found, creating new one...");
                    const { data: newSub, error: createError } = await supabase
                        .from('quiz_submissions')
                        .insert({
                            quiz_id: quizId,
                            student_id: user.id,
                            total_obtained: 0,
                            status: 'pending'
                        })
                        .select()
                        .single();

                    if (createError) {
                        if (createError.code === '23505' || createError.message?.includes('duplicate key')) { // Unique violation code or message check
                            console.log('Duplicate key error detected. Attempting recovery via RPC...', { quizId, userId: user.id });

                            // Use RPC to bypass RLS and find the exact active submission
                            const { data: rpcResult, error: rpcError } = await supabase
                                .rpc('get_active_student_submission', {
                                    p_quiz_id: quizId,
                                    p_student_id: user.id
                                });

                            console.log('RPC Recovery Query Result:', { rpcResult, rpcError });

                            const retrySub = rpcResult as any;

                            if (retrySub) {
                                if (retrySub.status !== 'pending') {
                                    setResult(retrySub);
                                    toast.info('Quiz already submitted');
                                    return;
                                }
                                activeSubmissionId = retrySub.id;
                                setSubmissionId(retrySub.id);
                            } else {
                                console.error('Recovery failed: Active submission not found via RPC', rpcResult);
                                throw new Error(`Failed to create submission: Duplicate detected but active submission not found via RPC. IDs: Q=${quizId}, U=${user.id}`);
                            }
                        } else {
                            throw new Error(`Failed to create submission: ${createError.message}`);
                        }
                    } else {
                        activeSubmissionId = newSub.id;
                        setSubmissionId(newSub.id);
                    }
                }
            }

            let score = 0;
            const answersToInsert: any[] = [];

            questions.forEach(q => {
                const selected = answers[q.id];
                const isCorrect = selected === q.correct_answer;
                if (isCorrect) score += q.marks;

                answersToInsert.push({
                    submission_id: activeSubmissionId,
                    question_id: q.id,
                    selected_option: selected || 'skipped',
                    correct_option_id: q.correct_answer,
                    is_correct: isCorrect
                });
            });

            const percentage = (score / quiz.total_marks) * 100;
            const status = percentage >= quiz.pass_percentage ? 'passed' : 'failed';

            // Delete old answers and insert new ones
            const { error: deleteError } = await supabase.from('quiz_answers').delete().eq('submission_id', activeSubmissionId);
            if (deleteError) throw deleteError;

            const { error: insertError } = await supabase.from('quiz_answers').insert(answersToInsert);
            if (insertError) throw insertError;

            // Update submission status
            const { data: submissionData, error: subError } = await supabase
                .from('quiz_submissions')
                .update({
                    total_obtained: score,
                    status: status,
                    submitted_at: new Date().toISOString()
                })
                .eq('id', activeSubmissionId)
                .select()
                .single();

            if (subError) throw subError;

            // Clear localStorage on successful submission
            clearQuizStorage();

            setResult(submissionData);
            if (timerRef.current) clearInterval(timerRef.current);
            toast.success('Quiz submitted successfully!');

        } catch (error: any) {
            console.error('Error submitting quiz:', error);
            toast.error(error.message || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin size-10 text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!quiz) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <XCircle className="size-16 text-destructive" />
                    <h2 className="text-2xl font-bold">Quiz Not Found</h2>
                    <Button onClick={() => navigate('/student/quizzes')}>Back to Quizzes</Button>
                </div>
            </DashboardLayout>
        );
    }

    // ==================== RESULT VIEW ====================
    if (result) {
        const percentage = Math.round((result.total_obtained / quiz.total_marks) * 100);
        const isPassed = result.status === 'passed';

        return (
            <DashboardLayout>
                <div className="min-h-full bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 p-4 lg:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Result Header Card */}
                        <Card className={`overflow-hidden border-0 shadow-2xl ${isPassed ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-orange-500 to-red-500'}`}>
                            <CardContent className="p-8 lg:p-12 text-white text-center">
                                <div className={`inline-flex items-center justify-center size-24 rounded-full mb-6 ${isPassed ? 'bg-white/20' : 'bg-white/20'}`}>
                                    {isPassed ? (
                                        <Trophy className="size-12" />
                                    ) : (
                                        <Target className="size-12" />
                                    )}
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-black mb-2">
                                    {isPassed ? 'Congratulations!' : 'Keep Practicing!'}
                                </h1>
                                <p className="text-xl opacity-90 mb-8">
                                    You {result.status} <span className="font-bold">{quiz.title}</span>
                                </p>

                                {/* Score Display */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                                        <p className="text-sm uppercase tracking-wider opacity-80 mb-1">Your Score</p>
                                        <p className="text-3xl font-black">{result.total_obtained}<span className="text-lg opacity-70">/{quiz.total_marks}</span></p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                                        <p className="text-sm uppercase tracking-wider opacity-80 mb-1">Percentage</p>
                                        <p className="text-3xl font-black">{percentage}%</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                                        <p className="text-sm uppercase tracking-wider opacity-80 mb-1">Pass Mark</p>
                                        <p className="text-3xl font-black">{quiz.pass_percentage}%</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                                        <p className="text-sm uppercase tracking-wider opacity-80 mb-1">Class Rank</p>
                                        {rank ? (
                                            <p className="text-3xl font-black">#{rank.position}<span className="text-lg opacity-70">/{rank.total}</span></p>
                                        ) : (
                                            <Loader2 className="animate-spin size-6 mx-auto mt-1" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Navigation */}
                        <div className="flex justify-center">
                            <Button
                                onClick={() => navigate('/student/quizzes')}
                                size="lg"
                                className="h-14 px-10 text-lg font-bold rounded-xl shadow-lg"
                            >
                                <ArrowLeft className="size-5 mr-2" />
                                Back to Quizzes
                            </Button>
                        </div>

                        {/* Answer Review */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold px-2">Review Your Answers</h2>
                            {questions.map((q, index) => {
                                const userAnswerId = answers[q.id];
                                const isCorrect = userAnswerId === q.correct_answer;

                                return (
                                    <Card key={q.id} className={`border-l-4 ${isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'} shadow-lg`}>
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`flex items-center justify-center size-10 rounded-xl font-bold text-white ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                                        {index + 1}
                                                    </span>
                                                    <p className="font-semibold text-lg">{q.question_text}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {isCorrect ? (
                                                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                                                            <CheckCircle className="size-4" /> Correct
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-red-600 font-bold text-sm">
                                                            <XCircle className="size-4" /> Incorrect
                                                        </span>
                                                    )}
                                                    <span className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg font-medium">
                                                        {q.marks} pts
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                {q.options.map((option: any) => {
                                                    const isSelected = userAnswerId === option.id;
                                                    const isTheCorrectAnswer = q.correct_answer === option.id;

                                                    let className = "flex items-center gap-3 p-4 rounded-xl border-2 ";
                                                    if (isTheCorrectAnswer) {
                                                        className += "bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30";
                                                    } else if (isSelected) {
                                                        className += "bg-red-50 border-red-300 dark:bg-red-500/10 dark:border-red-500/30";
                                                    } else {
                                                        className += "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 opacity-60";
                                                    }

                                                    return (
                                                        <div key={option.id} className={className}>
                                                            <span className="font-medium">{option.text}</span>
                                                            {isTheCorrectAnswer && (
                                                                <span className="ml-auto text-xs font-bold text-emerald-600 uppercase">Correct Answer</span>
                                                            )}
                                                            {isSelected && !isTheCorrectAnswer && (
                                                                <span className="ml-auto text-xs font-bold text-red-600 uppercase">Your Answer</span>
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

    if (questions.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <FileText className="size-16 text-muted-foreground" />
                    <h2 className="text-2xl font-bold">No Questions Available</h2>
                    <Button onClick={() => navigate('/student/quizzes')}>Back to Quizzes</Button>
                </div>
            </DashboardLayout>
        );
    }

    const progress = (Object.keys(answers).length / questions.length) * 100;
    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) {
        setCurrentIndex(0);
        return null;
    }

    // ==================== QUIZ TAKING VIEW ====================
    return (
        <DashboardLayout fullHeight>
            <div className="h-full flex flex-col overflow-hidden bg-[#f8fafc] dark:bg-slate-950">
                {/* Top Header Bar */}
                <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 rounded-xl bg-blue-500 text-white">
                        </div>
                        <h1 className="font-bold text-lg">{quiz.title}</h1>
                    </div>

                    {/* Progress */}
                    <div className="hidden md:flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-medium">PROGRESS</span>
                        <div className="w-40 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                        <Clock className="size-5 text-blue-500" />
                        <span className="font-mono font-bold text-lg tracking-wider">{formatTime(elapsedTime)}</span>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar - Question Navigator */}
                    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Question Navigator</h3>

                        {/* Question Grid */}
                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {questions.map((q, i) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = i === currentIndex;

                                let className = "flex items-center justify-center size-10 rounded-lg font-bold text-sm transition-all cursor-pointer ";
                                if (isCurrent) {
                                    className += "bg-blue-500 text-white shadow-lg";
                                } else if (isAnswered) {
                                    className += "bg-emerald-500 text-white";
                                } else {
                                    className += "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700";
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentIndex(i)}
                                        className={className}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1" />

                        {/* Legend */}
                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Legend</p>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="size-4 rounded bg-blue-500" />
                                <span>Current Question</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="size-4 rounded bg-emerald-500" />
                                <span>Answered</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="size-4 rounded bg-slate-200 dark:bg-slate-700" />
                                <span>Unanswered</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="mt-6 w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold text-base"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <>Submit Exam <ChevronRight className="size-4 ml-1" /></>}
                        </Button>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-slate-950">
                        <div className="max-w-3xl mx-auto px-6 py-8">
                            {/* Question Header Row */}
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-3xl font-bold text-[#3b82f6]">Q{currentIndex + 1}</span>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Multiple Choice</span>
                            </div>

                            {/* Question Box */}
                            <div className="mb-8 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <p className="text-lg font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                                    {currentQuestion.question_text}
                                </p>
                            </div>

                            {/* Answer Options */}
                            <div className="space-y-3 mb-10">
                                {currentQuestion.options.map((option: any, idx: number) => {
                                    const optionLetter = String.fromCharCode(65 + idx);
                                    const isSelected = answers[currentQuestion.id] === option.id;

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleAnswerChange(currentQuestion.id, option.id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${isSelected
                                                ? 'border-[#3b82f6] bg-blue-50/50 dark:bg-blue-500/10'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                                                }`}
                                        >
                                            {/* Letter Badge */}
                                            <span className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm shrink-0 ${isSelected
                                                ? 'bg-[#3b82f6] text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }`}>
                                                {optionLetter}
                                            </span>
                                            {/* Option Text */}
                                            <span className={`flex-1 text-[15px] ${isSelected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {option.text}
                                            </span>
                                            {/* Checkmark */}
                                            {isSelected && (
                                                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#3b82f6]">
                                                    <CheckCircle className="size-4 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Bottom Navigation */}
                            <div className="flex items-center justify-between gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentIndex === 0}
                                    className="h-11 px-5 font-medium gap-2 border-slate-300 dark:border-slate-600"
                                >
                                    <ChevronLeft className="size-4" /> Previous
                                </Button>

                                <button
                                    onClick={clearAnswer}
                                    disabled={!answers[currentQuestion.id]}
                                    className="h-11 px-5 font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40"
                                >
                                    Clear Answer
                                </button>

                                <Button
                                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                    disabled={currentIndex === questions.length - 1}
                                    className="h-11 px-6 font-medium gap-2 bg-[#3b82f6] hover:bg-blue-600 text-white"
                                >
                                    Next Question <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </main>
                </div>

                {/* Mobile Bottom Nav */}
                <div className="lg:hidden shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="flex-1 h-12"
                        >
                            <ChevronLeft className="size-4" /> Prev
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 h-12 bg-blue-500"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : 'Submit'}
                        </Button>
                        <Button
                            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            disabled={currentIndex === questions.length - 1}
                            className="flex-1 h-12 bg-blue-500"
                        >
                            Next <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
