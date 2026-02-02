import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
                    .single();

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

    // Save answers on change - TO DB
    // We need submissionId state
    const [submissionId, setSubmissionId] = useState<string | null>(null);

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

    const [rank, setRank] = useState<{ position: number, total: number } | null>(null);

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

    const progress = ((currentIndex + 1) / questions.length) * 100;
    const currentQuestion = questions[currentIndex];

    return (
        <DashboardLayout fullHeight>
            <div className="w-full h-full flex flex-col animate-in fade-in duration-700 bg-slate-50 dark:bg-[#020817]">
                {/* Immersive Header */}
                <header className="shrink-0 px-8 py-6 bg-card border-b flex items-center justify-between shadow-sm relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col">
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <FileText className="size-6 text-primary" />
                                {quiz.title}
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium">{quiz.classes?.course_code} • {quiz.classes?.class_name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Progress */}
                        <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
                            <div className="flex justify-between w-full text-xs font-black uppercase tracking-widest text-muted-foreground">
                                <span>Question Progress</span>
                                <span className="text-primary">{currentIndex + 1} / {questions.length}</span>
                            </div>
                            <Progress value={progress} className="h-2.5 w-full bg-muted shadow-inner rounded-full overflow-hidden" />
                        </div>

                        <div className="h-10 w-px bg-border hidden md:block" />

                        <div className="flex items-center gap-4">
                            <Button
                                variant="destructive"
                                size="lg"
                                className="h-12 px-8 font-bold shadow-lg shadow-destructive/20 transition-all hover:scale-105 active:scale-95 gap-2"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <Loader2 className="animate-spin size-4" />
                                ) : (
                                    <>Finish & Submit <CheckCircle className="size-5" /></>
                                )}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main Assessment Area */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-12">
                    <div className="max-w-5xl mx-auto h-full flex flex-col">
                        <div className="flex-1 flex flex-col justify-center gap-8 py-10">
                            {/* Question Context Card */}
                            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-xl ring-1 ring-white/10">
                                <div className="h-2 w-full bg-primary/20">
                                    <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                                </div>
                                <CardContent className="p-10 lg:p-20">
                                    <div className="space-y-12">
                                        <div className="flex items-center gap-5">
                                            <span className="flex items-center justify-center size-16 rounded-2xl bg-primary text-primary-foreground font-black text-3xl shadow-xl shadow-primary/30">
                                                {currentIndex + 1}
                                            </span>
                                            <div className="h-px flex-1 bg-border/50" />
                                            <Badge variant="outline" className="text-lg py-2 px-6 font-black border-2 border-primary/10 text-primary rounded-2xl">
                                                {currentQuestion.marks} Points
                                            </Badge>
                                        </div>

                                        <h2 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                                            {currentQuestion.question_text}
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {currentQuestion.options.map((option: any) => {
                                                const isSelected = answers[currentQuestion.id] === option.id;
                                                return (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => handleAnswerChange(currentQuestion.id, option.id)}
                                                        className={`group relative flex items-center p-8 text-left rounded-[2rem] border-2 transition-all duration-400 ${isSelected
                                                            ? 'bg-primary/5 border-primary shadow-2xl shadow-primary/10 ring-8 ring-primary/5 -translate-y-2'
                                                            : 'bg-white dark:bg-slate-900 border-border/50 hover:border-primary/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:-translate-y-1'
                                                            }`}
                                                    >
                                                        <div className={`flex items-center justify-center size-12 rounded-2xl font-black text-2xl mr-6 transition-all duration-400 ${isSelected
                                                            ? 'bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                                                            }`}>
                                                            {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                                                        </div>
                                                        <span className={`text-2xl font-bold flex-1 tracking-tight ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {option.text}
                                                        </span>
                                                        {isSelected && (
                                                            <div className="size-8 rounded-full bg-primary flex items-center justify-center animate-in zoom-in spin-in-90 duration-500 shadow-lg shadow-primary/20">
                                                                <CheckCircle className="size-5 text-primary-foreground" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Navigation Controls */}
                            <div className="flex items-center justify-between gap-8 px-6">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentIndex === 0}
                                    className="h-16 px-10 rounded-3xl border-2 font-black text-lg gap-3 hover:bg-primary/5 transition-all active:scale-95 disabled:opacity-20"
                                >
                                    <ChevronLeft className="size-6" /> Back
                                </Button>

                                <div className="hidden lg:flex items-center gap-3">
                                    {questions.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentIndex(i)}
                                            className={`h-3 rounded-full transition-all duration-500 ${i === currentIndex
                                                ? 'bg-primary w-12 shadow-lg shadow-primary/20'
                                                : answers[questions[i].id]
                                                    ? 'bg-primary/40 w-4'
                                                    : 'bg-slate-300 dark:bg-slate-700 w-3 hover:bg-slate-400'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {currentIndex === questions.length - 1 ? (
                                    <Button
                                        variant="default"
                                        size="lg"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="h-16 px-12 rounded-3xl font-black text-lg shadow-2xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all gap-3 bg-primary"
                                    >
                                        Finalize & Submit <ArrowRight className="size-6" />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="default"
                                        size="lg"
                                        onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                        className="h-16 px-12 rounded-3xl font-black text-lg shadow-2xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all gap-3 bg-primary"
                                    >
                                        Next Question <ChevronRight className="size-6" />
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
