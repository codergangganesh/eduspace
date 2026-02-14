import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight, Clock, Trophy, Target, ArrowLeft, Save, Download } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/layout/DeleteConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { QuizSkeleton } from '@/components/skeletons/QuizSkeleton';
import { notifyQuizSubmission } from '@/lib/notificationService';

export default function TakeQuiz() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();

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
    const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());

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
        const startTimestamp = savedStartTime ? parseInt(savedStartTime, 10) : Date.now();
        startTimeRef.current = startTimestamp;
        if (!savedStartTime) {
            localStorage.setItem(getStorageKey('startTime'), startTimestamp.toString());
        }

        // Start timer — reads from ref so it can be reset mid-session
        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
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
                // This is the SINGLE SOURCE OF TRUTH for preventing reattempts
                let { data: submission } = await supabase
                    .from('quiz_submissions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .eq('student_id', user.id)
                    .eq('is_archived', false) // Use active submissions only
                    .order('submitted_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                // If submission exists and is completed, load answers and show result view
                if (submission && submission.status !== 'pending') {
                    console.log('Quiz already completed. Loading answers for result view.');

                    // Fetch the student's saved answers so the review section works
                    const { data: savedAnswers } = await supabase
                        .from('quiz_answers')
                        .select('question_id, selected_option')
                        .eq('submission_id', submission.id);

                    if (savedAnswers) {
                        const loadedAnswers: Record<string, string> = {};
                        savedAnswers.forEach((a: any) => {
                            loadedAnswers[a.question_id] = a.selected_option;
                        });
                        setAnswers(loadedAnswers);
                    }

                    // Also fetch questions so the review section can render
                    const { data: questionsData } = await supabase
                        .from('quiz_questions')
                        .select('*')
                        .eq('quiz_id', quizId)
                        .order('order_index');

                    if (questionsData) setQuestions(questionsData);

                    setResult(submission);
                    setLoading(false);
                    return;
                }

                // Check for version mismatch (Re-attempt Logic)
                if (submission && (submission.quiz_version || 1) < (quizData.version || 1)) {
                    console.log("Found outdated active submission. Archiving to allow re-take.");
                    // Archive the old submission
                    await supabase
                        .from('quiz_submissions')
                        .update({ is_archived: true })
                        .eq('id', submission.id);

                    // Clear saved quiz state and reset timer to 0
                    clearQuizStorage();
                    startTimeRef.current = Date.now();
                    localStorage.setItem(getStorageKey('startTime'), startTimeRef.current.toString());
                    setElapsedTime(0);
                    setCurrentIndex(0);

                    // Reset submission variable to trigger new creation
                    submission = null;
                }

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
                        // Submission is already completed (passed/failed) - REDIRECT TO RESULTS
                        console.log('Quiz already completed. Redirecting to results page.');
                        navigate(`/student/quizzes/${quizId}/details`);
                        return;
                    }
                }

                // Create new submission if none exists (or if we just archived the outdated one)
                if (!submission) {
                    // Try to create only if we didn't find one
                    const { data: newSubmission, error: createError } = await supabase
                        .from('quiz_submissions')
                        .insert({
                            quiz_id: quizId,
                            student_id: user.id,
                            total_obtained: 0,
                            status: 'pending',
                            quiz_version: quizData.version,
                            started_at: new Date().toISOString()
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

            } catch (error: any) {
                console.error('Error loading quiz:', JSON.stringify(error, null, 2));
                toast.error(`Failed to load quiz: ${error.message || 'Unknown error'}`);
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
        setIsConfirmSubmitOpen(false);

        // CRITICAL: Prevent re-submission if already done (client-side safety)
        if (result || (submissionId && !answers)) {
            toast.error("You have already submitted this quiz.");
            navigate(`/student/quizzes/${quizId}/details`);
            return;
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
                    submitted_at: new Date().toISOString(),
                    time_taken: elapsedTime,
                    quiz_version: quiz.version || 1
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

            // Add to Knowledge Map
            const { knowledgeService } = await import('@/lib/knowledgeService');
            knowledgeService.upsertKnowledgeNode({
                type: 'quiz',
                sourceId: submissionData.id,
                label: quiz.title,
                text: quiz.title
            });

            // Notify Lecturer
            if (quiz.created_by && profile?.full_name) {
                notifyQuizSubmission(
                    quiz.created_by,
                    profile.full_name,
                    quiz.title,
                    quiz.id,
                    quiz.class_id,
                    user.id
                ).catch(err => console.error("Failed to notify lecturer:", err));
            }

        } catch (error: any) {
            console.error('Error submitting quiz:', error);
            toast.error(error.message || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAttemptSubmit = () => {
        const unansweredCount = questions.length - Object.keys(answers).length;
        if (unansweredCount > 0) {
            setIsConfirmSubmitOpen(true);
        } else {
            handleSubmit();
        }
    };


    if (loading) {
        return (
            <DashboardLayout fullHeight>
                <QuizSkeleton />
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
        const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length;

        return (
            <DashboardLayout fullHeight>
                <div className="h-full bg-[#0A0C14] text-white overflow-y-auto selection:bg-blue-500/30">
                    <div className="max-w-6xl mx-auto p-4 lg:p-10 space-y-10 pb-20">

                        {/* 1. Results Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <Trophy className="size-6 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase">Results</span>
                                    </div>
                                    <h1 className="text-xl font-bold text-slate-100">{quiz.title}</h1>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/student/quizzes')}
                                className="bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl gap-2 font-bold"
                            >
                                <XCircle className="size-4" />
                                Exit
                            </Button>
                        </div>

                        {/* 2. Main Performance Card */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[32px] blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                            <div className="relative bg-[#111420] border border-white/5 rounded-[32px] p-8 lg:p-12 overflow-hidden">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                                    {/* Left: Score Gauge */}
                                    <div className="lg:col-span-4 flex justify-center">
                                        <div className="relative size-56">
                                            <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
                                                <circle
                                                    className="text-slate-800"
                                                    strokeWidth="8"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="42"
                                                    cx="50"
                                                    cy="50"
                                                />
                                                <circle
                                                    className="text-blue-500 transition-all duration-1000 ease-out"
                                                    strokeWidth="8"
                                                    strokeDasharray={264}
                                                    strokeDashoffset={264 - (264 * percentage) / 100}
                                                    strokeLinecap="round"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="42"
                                                    cx="50"
                                                    cy="50"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-6xl font-black tracking-tighter text-white">{percentage}<span className="text-2xl text-blue-400">%</span></span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Final Score</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Stats Grid */}
                                    <div className="lg:col-span-8 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Accuracy</p>
                                                <p className="text-3xl font-black text-white">{correctCount} <span className="text-lg text-slate-600 font-bold ml-1">/ {questions.length}</span></p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Global Rank</p>
                                                {rank ? (
                                                    <p className="text-3xl font-black text-white">#{rank.position} <span className="text-lg text-slate-600 font-bold ml-1">/ {rank.total}</span></p>
                                                ) : (
                                                    <Loader2 className="animate-spin size-6 text-slate-600 mt-1" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Time Spent</p>
                                                <p className="text-3xl font-black text-white">{formatTime(result.time_taken || elapsedTime)} <span className="text-lg text-slate-600 font-bold ml-1">min</span></p>
                                            </div>
                                        </div>


                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Question Review Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h2 className="text-2xl font-black tracking-tight text-white">Question Review</h2>
                                <div className="flex gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Correct</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-red-500"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500/80">Incorrect</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-8">
                                {questions.map((q, idx) => {
                                    const userAnswerId = answers[q.id];
                                    const isCorrect = userAnswerId === q.correct_answer;
                                    const isSkipped = !userAnswerId || userAnswerId === 'skipped';

                                    return (
                                        <div
                                            key={q.id}
                                            className={cn(
                                                "relative bg-[#111420] rounded-[24px] overflow-hidden border transition-all duration-300",
                                                isCorrect ? "border-emerald-500/10" : "border-red-500/10"
                                            )}
                                        >
                                            {/* Top Bar */}
                                            <div className="bg-black/20 px-8 py-5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "size-10 rounded-xl flex items-center justify-center font-black text-sm",
                                                        isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                                    )}>
                                                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-200">{q.question_text}</h3>
                                                </div>
                                                <Badge variant="outline" className="bg-slate-900/50 border-slate-700 text-slate-400 font-black text-[10px] px-3 py-1">
                                                    {isCorrect ? q.marks : 0}.0 POINTS
                                                </Badge>
                                            </div>

                                            {/* Options */}
                                            <div className="p-8 space-y-3">
                                                {q.options.map((option: any) => {
                                                    const isSelected = userAnswerId === option.id;
                                                    const isTheCorrectAnswer = q.correct_answer === option.id;

                                                    return (
                                                        <div
                                                            key={option.id}
                                                            className={cn(
                                                                "group flex items-center gap-4 p-4 rounded-xl border transition-all",
                                                                isTheCorrectAnswer
                                                                    ? "bg-emerald-500/5 border-emerald-500/20"
                                                                    : isSelected
                                                                        ? "bg-red-500/5 border-red-500/20"
                                                                        : "bg-slate-900/30 border-white/5 opacity-60"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "size-10 rounded-full flex items-center justify-center transition-colors",
                                                                isTheCorrectAnswer
                                                                    ? "bg-emerald-500 text-white"
                                                                    : isSelected
                                                                        ? "bg-red-500 text-white"
                                                                        : "bg-slate-800 text-slate-500"
                                                            )}>
                                                                {isTheCorrectAnswer ? <CheckCircle className="size-5" /> : isSelected ? <XCircle className="size-5" /> : <div className="size-2 rounded-full bg-current" />}
                                                            </div>
                                                            <span className={cn(
                                                                "flex-1 font-bold text-sm",
                                                                isTheCorrectAnswer ? "text-emerald-400" : isSelected ? "text-red-400" : "text-slate-400"
                                                            )}>
                                                                {option.text}
                                                            </span>
                                                            {isTheCorrectAnswer && (
                                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Correct Answer</span>
                                                            )}
                                                            {isSelected && !isTheCorrectAnswer && (
                                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full">Your Choice</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Explanation Section */}
                                                {q.explanation && (
                                                    <div className="mt-8 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4 items-start">
                                                        <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                                            <Target className="size-4 text-blue-400" />
                                                        </div>
                                                        <p className="text-xs text-slate-400 leading-relaxed italic">
                                                            <span className="text-blue-400 font-bold uppercase tracking-wider block mb-1">Explanation:</span>
                                                            {q.explanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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
                            onClick={handleAttemptSubmit}
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
                                {(currentQuestion.options || []).map((option: any, idx: number) => {
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
                            onClick={handleAttemptSubmit}
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
            <DeleteConfirmDialog
                open={isConfirmSubmitOpen}
                onOpenChange={setIsConfirmSubmitOpen}
                onConfirm={handleSubmit}
                title="Submit Quiz?"
                description={`You have ${questions.length - Object.keys(answers).length} unanswered questions. Are you sure you want to submit your quiz now?`}
            />
        </DashboardLayout>
    );
}
