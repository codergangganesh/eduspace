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
                    const { error: createError } = await supabase
                        .from('quiz_submissions')
                        .insert({
                            quiz_id: quizId,
                            student_id: user.id,
                            total_obtained: 0,
                            status: 'pending' // Mark as in progress
                        });
                    if (createError) console.error('Error creating pending submission', createError);
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

                        <div className="bg-muted p-6 rounded-xl mb-8">
                            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Your Score</p>
                            <p className="text-4xl font-bold">
                                {result.total_obtained} <span className="text-xl text-muted-foreground">/ {quiz.total_marks}</span>
                            </p>
                            <p className="text-sm mt-2">
                                Pass requirement: {quiz.pass_percentage}%
                            </p>
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

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto pb-20">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">{quiz.title}</h1>
                    <p className="text-muted-foreground">{quiz.description}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                            Total Marks: {quiz.total_marks}
                        </span>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                            Questions: {questions.length}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <Card key={q.id}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex justify-between">
                                    <span>{index + 1}. {q.question_text}</span>
                                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded h-fit">
                                        {q.marks} Marks
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={answers[q.id]}
                                    onValueChange={(val) => handleAnswerChange(q.id, val)}
                                >
                                    <div className="space-y-3">
                                        {q.options.map((option: any) => (
                                            <div key={option.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                                <RadioGroupItem value={option.id} id={`${q.id}-${option.id}`} />
                                                <Label htmlFor={`${q.id}-${option.id}`} className="flex-1 cursor-pointer">
                                                    {option.text}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <Button size="lg" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" /> Submitting...
                            </>
                        ) : (
                            'Submit Quiz'
                        )}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
