import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function TakeQuiz() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [quiz, setQuiz] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // question_id -> option_id
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [rank, setRank] = useState<{ position: number, total: number } | null>(null);

    useEffect(() => {
        const fetchQuizData = async () => {
            if (!quizId || !user) return;
            try {
                setLoading(true);
                // Fetch Quiz Metadata
                const { data: quizData, error: quizError } = await supabase
                    .from('quizzes')
                    .select('*, classes(class_name)')
                    .eq('id', quizId)
                    .single();

                if (quizError) throw quizError;
                setQuiz(quizData);

                // Check for existing submission
                const { data: submission } = await supabase
                    .from('quiz_submissions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .eq('student_id', user.id)
                    .eq('is_archived', false)
                    .maybeSingle();

                if (submission) {
                    setSubmissionId(submission.id);
                    if (submission.status === 'pending') {
                        // Resume quiz
                        setResult(null); // Ensure we are in taking mode
                        // Load existing answers?
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
                        // Already finished
                        setResult(submission);
                        setLoading(false);
                        return;
                    }
                } else {
                    // Create PENDING submission immediately to track attempt
                    const { data: newSubmission, error: createError } = await supabase
                        .from('quiz_submissions')
                        .insert({
                            quiz_id: quizId,
                            student_id: user.id,
                            total_obtained: 0,
                            status: 'pending' // Mark as in progress
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('Error creating pending submission', createError);
                    } else if (newSubmission) {
                        setSubmissionId(newSubmission.id);
                    }
                }

                // Fetch Questions
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
                navigate('/student/quizzes'); // Redirect if error
            } finally {
                setLoading(false);
            }
        };

        fetchQuizData();
    }, [quizId, user, navigate]);

    // Load saved answers - REMOVED LOCAL STORAGE

    // Fetch rank when result is available
    useEffect(() => {
        if (result && quizId) {
            const fetchRank = async () => {
                try {
                    // Get count of students who scored HIGHER than this result
                    const { count: higherScoresCount } = await supabase
                        .from('quiz_submissions')
                        .select('*', { count: 'exact', head: true })
                        .eq('quiz_id', quizId)
                        .gt('total_obtained', result.total_obtained);

                    // Get total submissions
                    const { count: totalSubmissions } = await supabase
                        .from('quiz_submissions')
                        .select('*', { count: 'exact', head: true })
                        .eq('quiz_id', quizId)

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

    // Save answers on change - TO DB

    const handleAnswerChange = async (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));

        if (submissionId) {
            // Live save to DB
            const { error } = await supabase.from('quiz_answers').upsert({
                submission_id: submissionId,
                question_id: questionId,
                selected_option: optionId
            }, { onConflict: 'submission_id,question_id' } as any);

            if (error) console.error("Error auto-saving answer", error);
        }
    };


    const handleSubmit = async () => {
        if (!user || !quiz) return;

        // Basic validation: Check if all questions answered? Optional.
        const unansweredCount = questions.length - Object.keys(answers).length;
        if (unansweredCount > 0) {
            if (!confirm(`You have ${unansweredCount} unanswered questions. submitting now will mark them as incorrect. Continue?`)) {
                return;
            }
        }

        setSubmitting(true);
        try {
            // Calculate Score
            let score = 0;
            const answersToInsert: any[] = [];

            questions.forEach(q => {
                const selected = answers[q.id];
                const isCorrect = selected === q.correct_answer;
                if (isCorrect) score += q.marks;

                answersToInsert.push({
                    submission_id: null, // Will replace after submission creation
                    question_id: q.id,
                    selected_option: selected || 'skipped',
                    correct_option_id: q.correct_answer, // Store correct answer for verification
                    is_correct: isCorrect
                });
            });

            const percentage = (score / quiz.total_marks) * 100;
            const status = percentage >= quiz.pass_percentage ? 'passed' : 'failed';

            // 2. Insert Answers Details -> NO, they are already inserted! 
            // We just need to update final score and status.
            // AND we need to mark answers as correct/incorrect in DB?
            // Yes, our current upsert during quiz taking only stores selected_option.
            // We need to update `is_correct` and `correct_option_id` now.

            // Delete old answers? Or update them?
            // Easiest is to delete all for this submission and re-insert FINAL verified answers
            // OR update each. 
            // Delete-Insert is robust.

            await supabase.from('quiz_answers').delete().eq('submission_id', submissionId);
            const finalAnswers = answersToInsert.map(a => ({ ...a, submission_id: submissionId }));
            await supabase.from('quiz_answers').insert(finalAnswers);

            // Update Submission Status
            const { data: submissionData, error: subError } = await supabase
                .from('quiz_submissions')
                .update({
                    total_obtained: score,
                    status: status,
                    submitted_at: new Date().toISOString()
                })
                .eq('id', submissionId)
                .select()
                .single();

            if (subError) throw subError;

            setResult(submissionData);
            // Clear saved answers
            localStorage.removeItem(`quiz_attempt_${quizId}_${user.id}`);
            toast.success('Quiz submitted successfully!');

        } catch (error) {
            console.error('Error submitting quiz:', error);
            toast.error('Failed to submit quiz');
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

    // Handle case where quiz didn't load
    if (!quiz) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <XCircle className="size-16 text-destructive" />
                    <h2 className="text-2xl font-bold">Quiz Not Found</h2>
                    <p className="text-muted-foreground">This quiz could not be loaded or doesn't exist.</p>
                    <Button onClick={() => navigate('/student/quizzes')}>
                        Back to Quizzes
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    if (result) {
        // Result View
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto py-10">
                    <Card className="text-center p-8">
                        <div className="flex justify-center mb-6">
                            {result.status === 'passed' ? (
                                <CheckCircle className="size-20 text-green-500" />
                            ) : (
                                <XCircle className="size-20 text-red-500" />
                            )}
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            {result.status === 'passed' ? 'Congratulations!' : 'Keep Practicing!'}
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            You have {result.status} the quiz followed by <strong>{quiz.title}</strong>
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-muted p-6 rounded-xl">
                                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Your Score</p>
                                <p className="text-4xl font-bold">
                                    {result.total_obtained} <span className="text-xl text-muted-foreground">/ {quiz.total_marks}</span>
                                </p>
                                <p className="text-sm mt-2">
                                    Pass requirement: {quiz.pass_percentage}%
                                </p>
                            </div>
                            <div className="bg-muted p-6 rounded-xl flex flex-col justify-center items-center">
                                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Class Rank</p>
                                {rank ? (
                                    <>
                                        <p className="text-4xl font-bold">
                                            #{rank.position} <span className="text-xl text-muted-foreground">/ {rank.total}</span>
                                        </p>
                                        <p className="text-sm mt-2 text-muted-foreground">
                                            Based on scores
                                        </p>
                                    </>
                                ) : (
                                    <Loader2 className="animate-spin size-6" />
                                )}
                            </div>
                        </div>

                        <Button onClick={() => navigate('/student/quizzes')}>
                            Back to Quizzes
                        </Button>
                    </Card>

                    {/* Answer Review Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">Review Answers</h2>
                        {questions.map((q, index) => {
                            const userAnswerId = answers[q.id]; // Access from state, or we could use the result if we fetched it back
                            // Ideally we should use the `answers` state which we still have.
                            const isCorrect = userAnswerId === q.correct_answer;

                            return (
                                <Card key={q.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex justify-between">
                                            <span>{index + 1}. {q.question_text}</span>
                                            <div className="flex items-center gap-2">
                                                {isCorrect ? (
                                                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                                                        <CheckCircle className="size-4" /> Correct
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-medium text-red-600 flex items-center gap-1">
                                                        <XCircle className="size-4" /> Incorrect
                                                    </span>
                                                )}
                                                <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                                                    {q.marks} Marks
                                                </span>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {q.options.map((option: any) => {
                                                const isSelected = userAnswerId === option.id;
                                                const isTheCorrectAnswer = q.correct_answer === option.id;

                                                let optionStyle = "border p-3 rounded-lg flex items-center justify-between ";
                                                if (isTheCorrectAnswer) {
                                                    optionStyle += "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400";
                                                } else if (isSelected && !isCorrect) {
                                                    optionStyle += "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400";
                                                } else {
                                                    optionStyle += "opacity-70";
                                                }

                                                return (
                                                    <div key={option.id} className={optionStyle}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`size-4 rounded-full border flex items-center justify-center ${isSelected || isTheCorrectAnswer ? 'border-current' : 'border-muted-foreground'
                                                                }`}>
                                                                {isSelected && <div className="size-2 rounded-full bg-current" />}
                                                            </div>
                                                            <span>{option.text}</span>
                                                        </div>
                                                        {isTheCorrectAnswer && <span className="text-xs font-bold uppercase tracking-wider">Correct Answer</span>}
                                                        {isSelected && !isTheCorrectAnswer && <span className="text-xs font-bold uppercase tracking-wider">Your Answer</span>}
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
            </DashboardLayout>
        );
    }

    // Handle case where there are no questions
    if (questions.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <FileText className="size-16 text-muted-foreground" />
                    <h2 className="text-2xl font-bold">No Questions Available</h2>
                    <p className="text-muted-foreground">This quiz doesn't have any questions yet.</p>
                    <Button onClick={() => navigate('/student/quizzes')}>
                        Back to Quizzes
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const progress = ((currentIndex + 1) / questions.length) * 100;
    const currentQuestion = questions[currentIndex];

    // Safety check for currentQuestion
    if (!currentQuestion) {
        setCurrentIndex(0);
        return null;
    }

    return (
        <DashboardLayout fullHeight>
            <div className="w-full h-full flex flex-col animate-in fade-in duration-700 relative overflow-hidden">
                {/* Gradient Background with Orbs */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-violet-950/10" />
                <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 -right-32 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-2xl" />

                {/* Glassmorphic Header */}
                <header className="shrink-0 px-6 lg:px-10 py-5 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-white/20 dark:border-slate-700/50 flex items-center justify-between relative z-10 shadow-lg shadow-black/5">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center justify-center size-12 rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/25">
                            <FileText className="size-6 text-white" />
                        </div>
                        <div className="hidden md:flex flex-col">
                            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                                {quiz.title}
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium">{quiz.classes?.class_name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Question Navigator Pills */}
                        <div className="hidden xl:flex items-center gap-1.5 p-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm">
                            {questions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={`relative size-8 rounded-full font-bold text-xs transition-all duration-300 ${i === currentIndex
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                                        : answers[q.id]
                                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {i + 1}
                                    {answers[q.id] && i !== currentIndex && (
                                        <div className="absolute -top-0.5 -right-0.5 size-2.5 bg-emerald-500 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Progress Ring */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <svg className="size-14 -rotate-90">
                                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-200 dark:text-slate-700" />
                                    <circle
                                        cx="28" cy="28" r="24"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                        strokeLinecap="round"
                                        className="text-primary transition-all duration-500"
                                        strokeDasharray={`${progress * 1.51} 151`}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-primary">
                                    {Math.round(progress)}%
                                </span>
                            </div>

                            <div className="h-10 w-px bg-border/50 hidden lg:block" />

                            <Button
                                variant="default"
                                size="lg"
                                className="h-12 px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary hover:to-violet-500"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <Loader2 className="animate-spin size-4" />
                                ) : (
                                    <>Submit <CheckCircle className="size-4" /></>
                                )}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Assessment Area */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10">
                    <div className="max-w-4xl mx-auto h-full flex flex-col">
                        <div className="flex-1 flex flex-col justify-center gap-6 py-6">
                            {/* Question Card */}
                            <div className="relative">
                                {/* Glow Effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 rounded-[2rem] blur-xl opacity-70" />

                                <Card className="relative border-0 shadow-2xl rounded-[1.5rem] overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                                    {/* Top Progress Bar */}
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary via-violet-500 to-primary transition-all duration-500 ease-out rounded-full"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <CardContent className="p-8 lg:p-12">
                                        <div className="space-y-8">
                                            {/* Question Header */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center size-14 lg:size-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-white font-black text-2xl lg:text-3xl shadow-xl shadow-primary/25">
                                                    {currentIndex + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                        Question {currentIndex + 1} of {questions.length}
                                                    </p>
                                                </div>
                                                <Badge className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 rounded-xl">
                                                    ⭐ {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Point' : 'Points'}
                                                </Badge>
                                            </div>

                                            {/* Question Text */}
                                            <h2 className="text-2xl lg:text-3xl font-bold leading-relaxed text-slate-800 dark:text-white">
                                                {currentQuestion.question_text}
                                            </h2>

                                            {/* Options Grid */}
                                            <div className="grid grid-cols-1 gap-4">
                                                {currentQuestion.options.map((option: any, idx: number) => {
                                                    const isSelected = answers[currentQuestion.id] === option.id;
                                                    const optionLetter = String.fromCharCode(65 + idx);
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => handleAnswerChange(currentQuestion.id, option.id)}
                                                            className={`group relative flex items-center p-5 lg:p-6 text-left rounded-2xl border-2 transition-all duration-300 ${isSelected
                                                                ? 'bg-gradient-to-r from-primary/10 to-violet-500/10 border-primary shadow-xl shadow-primary/10 scale-[1.02]'
                                                                : 'bg-white dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.01]'
                                                                }`}
                                                        >
                                                            <div className={`flex items-center justify-center size-12 rounded-xl font-bold text-lg mr-5 transition-all duration-300 ${isSelected
                                                                ? 'bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/25 scale-110'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                                                                }`}>
                                                                {optionLetter}
                                                            </div>
                                                            <span className={`text-lg lg:text-xl font-semibold flex-1 ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-200'
                                                                }`}>
                                                                {option.text}
                                                            </span>
                                                            {isSelected && (
                                                                <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center animate-in zoom-in duration-300 shadow-lg shadow-primary/25">
                                                                    <CheckCircle className="size-5 text-white" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Navigation Controls */}
                            <div className="flex items-center justify-between gap-4 px-2">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentIndex === 0}
                                    className="h-14 px-8 rounded-2xl border-2 font-bold text-base gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30"
                                >
                                    <ChevronLeft className="size-5" /> Previous
                                </Button>

                                {/* Question Dots (Mobile) */}
                                <div className="flex xl:hidden items-center gap-2">
                                    {questions.slice(Math.max(0, currentIndex - 2), Math.min(questions.length, currentIndex + 3)).map((_, i) => {
                                        const actualIndex = Math.max(0, currentIndex - 2) + i;
                                        return (
                                            <button
                                                key={actualIndex}
                                                onClick={() => setCurrentIndex(actualIndex)}
                                                className={`rounded-full transition-all duration-300 ${actualIndex === currentIndex
                                                    ? 'bg-primary w-8 h-3 shadow-lg shadow-primary/30'
                                                    : answers[questions[actualIndex]?.id]
                                                        ? 'bg-emerald-500 w-3 h-3'
                                                        : 'bg-slate-300 dark:bg-slate-600 w-3 h-3 hover:bg-slate-400'
                                                    }`}
                                            />
                                        );
                                    })}
                                </div>

                                {currentIndex === questions.length - 1 ? (
                                    <Button
                                        variant="default"
                                        size="lg"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="h-14 px-8 rounded-2xl font-bold text-base shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary hover:to-violet-500"
                                    >
                                        {submitting ? <Loader2 className="animate-spin size-5" /> : <>Finish & Submit <ArrowRight className="size-5" /></>}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="default"
                                        size="lg"
                                        onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                        className="h-14 px-8 rounded-2xl font-bold text-base shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary hover:to-violet-500"
                                    >
                                        Next <ChevronRight className="size-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
}
