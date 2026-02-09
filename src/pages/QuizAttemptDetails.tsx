import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Home,
    Info,
    Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function QuizAttemptDetails() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [quiz, setQuiz] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!quizId || !user) return;
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch Quiz Details
                const { data: quizData, error: quizError } = await supabase
                    .from('quizzes')
                    .select('*, classes(class_name)')
                    .eq('id', quizId)
                    .single();

                if (quizError) throw quizError;
                setQuiz(quizData);

                // 2. Fetch Submission
                const { data: submission, error: submissionError } = await supabase
                    .from('quiz_submissions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .eq('student_id', user.id)
                    .order('submitted_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (submissionError) throw submissionError;

                if (!submission) {
                    setError(`No submission record found`);
                } else {
                    setResult(submission);
                }

                // 3. Fetch Questions
                const { data: questionsData, error: questionsError } = await supabase
                    .from('quiz_questions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .order('order_index');

                if (questionsError) throw questionsError;
                setQuestions(questionsData || []);

                // 4. Fetch Answers
                const { data: existingAnswers } = await supabase
                    .from('quiz_answers')
                    .select('question_id, selected_option')
                    .eq('submission_id', submission?.id);

                if (existingAnswers) {
                    const loadedAnswers: Record<string, string> = {};
                    existingAnswers.forEach((a: any) => {
                        loadedAnswers[a.question_id] = a.selected_option;
                    });
                    setAnswers(loadedAnswers);
                }

            } catch (error: any) {
                console.error('Error loading quiz details:', error);
                setError(error.message || 'Failed to load details');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [quizId, user]);

    const formatTimeFull = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')} : ${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <DashboardLayout fullHeight>
                <div className="min-h-full bg-slate-50 dark:bg-[#0A0C14] flex flex-col transition-colors duration-300">
                    {/* Header Skeleton */}
                    <div className="h-20 bg-white dark:bg-[#0A0C14] border-b border-slate-200 dark:border-white/5 px-8 flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-4">
                            <Skeleton className="size-10 rounded-lg bg-slate-100 dark:bg-white/5" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48 bg-slate-100 dark:bg-white/5" />
                                <Skeleton className="h-3 w-32 bg-slate-100 dark:bg-white/5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="flex gap-12 text-white">
                                <Skeleton className="h-10 w-24 bg-slate-100 dark:bg-white/5" />
                                <Skeleton className="h-10 w-24 bg-slate-100 dark:bg-white/5" />
                            </div>
                            <Skeleton className="h-10 w-32 bg-slate-100 dark:bg-white/5 rounded-xl" />
                        </div>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar Skeleton */}
                        <aside className="w-72 bg-white dark:bg-[#0A0C14] border-r border-slate-200 dark:border-white/5 p-6 space-y-8 transition-colors">
                            <Skeleton className="h-3 w-32 bg-slate-100 dark:bg-white/5" />
                            <div className="grid grid-cols-5 gap-3">
                                {Array.from({ length: 15 }).map((_, i) => (
                                    <Skeleton key={i} className="size-10 rounded-lg bg-slate-100 dark:bg-white/5" />
                                ))}
                            </div>
                            <div className="mt-auto pt-8 border-t border-slate-100 dark:border-white/5 space-y-4">
                                <Skeleton className="h-4 w-full bg-slate-100 dark:bg-white/5" />
                                <Skeleton className="h-12 w-full rounded-xl bg-slate-100 dark:bg-white/5" />
                            </div>
                        </aside>

                        {/* Main Content Skeleton */}
                        <main className="flex-1 p-12 overflow-hidden bg-slate-50 dark:bg-[#0A0C14] transition-colors">
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="flex justify-between items-center text-white">
                                    <Skeleton className="h-10 w-32 bg-slate-100 dark:bg-white/5" />
                                    <Skeleton className="h-6 w-48 bg-slate-100 dark:bg-white/5" />
                                </div>
                                <Skeleton className="h-32 w-full rounded-2xl bg-slate-100 dark:bg-white/5" />
                                <div className="space-y-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-white/5" />
                                    ))}
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !quiz || !result) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <XCircle className="size-16 text-red-500" />
                    <h2 className="text-2xl font-bold dark:text-white">Details Unavailable</h2>
                    <p className="text-slate-500 max-w-md">{error}</p>
                    <Button onClick={() => navigate('/student/quizzes')} className="bg-blue-600">Back to Quizzes</Button>
                </div>
            </DashboardLayout>
        );
    }

    const currentQuestion = questions[currentIndex];
    const userAnswerId = answers[currentQuestion?.id];
    const isCorrect = userAnswerId === currentQuestion?.correct_answer;
    const isSkipped = !userAnswerId;

    const generatePDF = () => {
        toast.info("Generating PDF summary...");
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("Quiz Result Summary", 20, 20);

        doc.setFontSize(16);
        doc.text(`Quiz: ${quiz.title}`, 20, 35);
        doc.text(`Student ID: ${user?.id.slice(0, 8)}`, 20, 45);
        doc.text(`Score: ${result.total_obtained}/${quiz.total_marks}`, 20, 55);

        const tableData = questions.map((q, idx) => [
            idx + 1,
            q.question_text,
            answers[q.id] === q.correct_answer ? "Correct" : (answers[q.id] ? "Incorrect" : "Skipped"),
            answers[q.id] === q.correct_answer ? q.marks : 0
        ]);

        autoTable(doc, {
            startY: 70,
            head: [['#', 'Question', 'Result', 'Points']],
            body: tableData,
        });

        doc.save(`${quiz.title}_Result.pdf`);
    };

    return (
        <DashboardLayout fullHeight>
            <div className="min-h-full bg-slate-50 dark:bg-[#0A0C14] flex flex-col font-sans transition-colors duration-300">

                {/* 1. TOP HEADER - Light Academic Styling with Dark Mode Support */}
                <header className="h-20 bg-white dark:bg-[#0A0C14] border-b border-slate-200 dark:border-white/5 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <CheckCircle className="size-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">Exam Results: {quiz.title}</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completed on {new Date(result.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-12">
                        <div className="flex flex-col items-center border-r border-slate-100 dark:border-white/5 pr-12">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Final Score</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{result.total_obtained}</span>
                                <span className="text-sm font-bold text-slate-300 dark:text-slate-600">/ {quiz.total_marks}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center border-r border-slate-100 dark:border-white/5 pr-12">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Status</span>
                            <div className={cn(
                                "flex items-center gap-1.5 font-bold text-sm",
                                result.status === 'passed' ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                            )}>
                                {result.status === 'passed' ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                                {result.status?.toUpperCase()}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-100 dark:border-white/5 shadow-inner">
                                <Clock className="size-5 text-blue-500" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Time Taken</span>
                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">{formatTimeFull(result.time_taken || 0)}</span>
                                </div>
                            </div>
                            <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-bold px-6 transition-transform active:scale-95">
                                Download PDF Report
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden transition-colors duration-300">

                    {/* 2. LEFT SIDEBAR - Question Grid */}
                    <aside className="w-72 bg-white dark:bg-[#0A0C14] border-r border-slate-200 dark:border-white/5 flex flex-col p-6 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto transition-colors duration-300">
                        <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Review Questions</h2>

                        <div className="grid grid-cols-5 gap-3 mb-8">
                            {questions.map((q, idx) => {
                                const ansId = answers[q.id];
                                const isCorrectQ = ansId === q.correct_answer;
                                const isSkippedQ = !ansId;
                                const isActive = currentIndex === idx;

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={cn(
                                            "size-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all border-2",
                                            isActive
                                                ? "border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/40 transform scale-110 shadow-md"
                                                : "border-transparent hover:scale-105 active:scale-95",
                                            isCorrectQ ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                                                isSkippedQ ? "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400" : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                                        )}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-auto space-y-6">
                            <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/5">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Legend</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="size-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Correct Answer</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="size-3 rounded-full bg-red-500 shadow-lg shadow-red-500/20"></div>
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Incorrect Answer</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="size-3 rounded-full bg-slate-300 dark:bg-slate-600 shadow-sm"></div>
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Skipped / Unanswered</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard')}
                                className="w-full justify-center gap-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-xl h-12 hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95 shadow-sm"
                            >
                                <Home className="size-4" />
                                Return to Dashboard
                            </Button>
                        </div>
                    </aside>

                    {/* 3. MAIN CONTENT - Single Question View */}
                    <main className="flex-1 overflow-y-auto p-12 bg-slate-50 dark:bg-[#0A0C14] transition-colors duration-300">
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Question Header Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl font-black text-blue-600/10 dark:text-blue-400/5 select-none">Q{currentIndex + 1}</span>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn(
                                            "font-black text-[10px] px-3 py-1 rounded-full border-none shadow-sm",
                                            isCorrect ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : isSkipped ? "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400" : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                                        )}>
                                            {isCorrect ? 'CORRECT' : isSkipped ? 'SKIPPED' : 'INCORRECT'}
                                        </Badge>
                                        <Badge variant="outline" className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                                            Multiple Choice
                                        </Badge>
                                    </div>
                                </div>
                                <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest tabular-nums">
                                    Points: <span className={cn("font-black ml-1", isCorrect ? "text-emerald-500" : "text-red-500")}>{isCorrect ? currentQuestion.marks : '0'}/{currentQuestion.marks}</span>
                                </div>
                            </div>

                            {/* Question Box */}
                            <Card className="p-8 border-slate-100 dark:border-white/5 bg-white dark:bg-[#111420] shadow-sm rounded-2xl transition-all hover:shadow-md">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                                    {currentQuestion.question_text}
                                </h2>
                            </Card>

                            {/* Options List */}
                            <div className="grid gap-4">
                                {currentQuestion.options.map((option: any) => {
                                    const isUserChoice = userAnswerId === option.id;
                                    const isTheCorrectAnswer = currentQuestion.correct_answer === option.id;

                                    let variantStyle = "bg-white dark:bg-[#111420] border-slate-200 dark:border-white/5 shadow-sm hover:border-slate-300 dark:hover:border-white/10 hover:shadow-md";
                                    if (isTheCorrectAnswer) variantStyle = "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-300 dark:border-emerald-500/30 ring-1 ring-emerald-100 dark:ring-emerald-500/10 shadow-lg shadow-emerald-500/5";
                                    else if (isUserChoice && !isCorrect) variantStyle = "bg-red-50 dark:bg-red-500/5 border-red-300 dark:border-red-500/30 ring-1 ring-red-100 dark:ring-red-500/10 shadow-lg shadow-red-500/5";

                                    return (
                                        <div
                                            key={option.id}
                                            className={cn(
                                                "p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group",
                                                variantStyle
                                            )}
                                        >
                                            <div className={cn(
                                                "size-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-sm transition-transform group-hover:scale-105",
                                                isTheCorrectAnswer ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                                                    (isUserChoice && !isCorrect) ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500"
                                            )}>
                                                {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                                            </div>

                                            <div className="flex-1">
                                                <p className={cn(
                                                    "font-bold text-sm",
                                                    isTheCorrectAnswer ? "text-emerald-700 dark:text-emerald-400" :
                                                        (isUserChoice && !isCorrect) ? "text-red-700 dark:text-red-400" : "text-slate-600 dark:text-slate-300"
                                                )}>
                                                    {option.text}
                                                </p>
                                                {isTheCorrectAnswer && (
                                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mt-1 block">Correct Answer</span>
                                                )}
                                                {isUserChoice && !isCorrect && (
                                                    <span className="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest mt-1 block">Your Choice</span>
                                                )}
                                            </div>

                                            {isTheCorrectAnswer ? (
                                                <div className="size-7 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-in zoom-in duration-300">
                                                    <Check className="size-4" />
                                                </div>
                                            ) : (isUserChoice && !isCorrect) ? (
                                                <div className="size-7 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30 animate-in zoom-in duration-300">
                                                    <XCircle className="size-4" />
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Explanation Box */}
                            {currentQuestion.explanation && (
                                <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 p-6 rounded-2xl flex gap-4 mt-8 shadow-sm animate-in slide-in-from-top-2 duration-500">
                                    <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Info className="size-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Explanation</h4>
                                        <p className="text-sm text-blue-900/70 dark:text-blue-200/60 leading-relaxed font-medium">
                                            {currentQuestion.explanation}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Bottom Navigation */}
                            <div className="flex items-center justify-between pt-12 border-t border-slate-100 dark:border-white/5">
                                <Button
                                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentIndex === 0}
                                    variant="ghost"
                                    className="gap-2 text-slate-500 dark:text-slate-400 font-black hover:bg-white dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
                                >
                                    <ChevronLeft className="size-4" />
                                    PREVIOUS
                                </Button>

                                <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] select-none tabular-nums">
                                    Question {currentIndex + 1} OF {questions.length}
                                </div>

                                <Button
                                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                    disabled={currentIndex === questions.length - 1}
                                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                >
                                    NEXT QUESTION
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>

                        </div>
                    </main>

                </div>

            </div>
        </DashboardLayout>
    );
}
