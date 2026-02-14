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
    Check,
    Download,
    Menu,
    Home,
    Search,
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
    Info
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
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

                const { data: quizData, error: quizError } = await supabase
                    .from('quizzes')
                    .select('*, classes(class_name)')
                    .eq('id', quizId)
                    .single();

                if (quizError) throw quizError;
                setQuiz(quizData);

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

                const { data: questionsData, error: questionsError } = await supabase
                    .from('quiz_questions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .order('order_index');

                if (questionsError) throw questionsError;
                setQuestions(questionsData || []);

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

    const scrollToQuestion = (idx: number) => {
        const element = document.getElementById(`mobile-question-${idx}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setCurrentIndex(idx);
        } else {
            setCurrentIndex(idx);
        }
    };

    const generatePDF = () => {
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
        toast.success("Download successful");
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 shrink-0">Review Questions</h2>

            {/* Scrollable Question Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-6 -mx-2 px-2">
                <div className="grid grid-cols-5 gap-4 py-4 px-2">
                    {questions.map((q, idx) => {
                        const ansId = answers[q.id];
                        const isCorrectQ = ansId === q.correct_answer;
                        const isSkippedQ = !ansId;
                        const isActive = currentIndex === idx;

                        return (
                            <div key={q.id} className="flex items-center justify-center">
                                <button
                                    onClick={() => scrollToQuestion(idx)}
                                    className={cn(
                                        "size-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all border-2",
                                        isActive
                                            ? "border-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/40 transform scale-125 z-10 shadow-xl"
                                            : "border-transparent hover:scale-110 hover:z-10",
                                        isCorrectQ ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                                            isSkippedQ ? "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400" : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                                    )}
                                >
                                    {idx + 1}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Fixed Bottom Section */}
            <div className="mt-auto space-y-6 pt-6 border-t border-slate-100 dark:border-white/5 shrink-0 bg-white dark:bg-[#0A0C14]">
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Legend</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="size-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Correct Result</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="size-3 rounded-full bg-red-500 shadow-lg shadow-red-500/20"></div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Wrong / Missed</span>
                        </div>
                    </div>
                </div>

                <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="w-full justify-center gap-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-xl h-12 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
                >
                    <Home className="size-4" />
                    Dashboard
                </Button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <DashboardLayout fullHeight hideHeaderOnMobile>
                <div className="min-h-full bg-slate-50 dark:bg-[#0A0C14] flex flex-col transition-colors duration-300">
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
                        <aside className="w-72 bg-white dark:bg-[#0A0C14] border-r border-slate-200 dark:border-white/5 p-6 space-y-8 transition-colors">
                            <Skeleton className="h-3 w-32 bg-slate-100 dark:bg-white/5" />
                            <div className="grid grid-cols-5 gap-3">
                                {Array.from({ length: 15 }).map((_, i) => (
                                    <Skeleton key={i} className="size-10 rounded-lg bg-slate-100 dark:bg-white/5" />
                                ))}
                            </div>
                        </aside>
                        <main className="flex-1 p-12 overflow-hidden bg-slate-50 dark:bg-[#0A0C14] transition-colors">
                            <div className="max-w-4xl mx-auto space-y-8">
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
            <DashboardLayout hideHeaderOnMobile>
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

    return (
        <DashboardLayout fullHeight hideHeaderOnMobile>
            <div className="min-h-full bg-slate-50 dark:bg-[#0A0C14] flex flex-col font-sans transition-colors duration-300">

                <header className="h-16 md:h-20 bg-white dark:bg-[#0A0C14] border-b border-slate-200 dark:border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                                    <Menu className="size-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[280px] sm:w-[350px] dark:bg-[#0A0C14] border-r-slate-200 dark:border-white/5 p-6">
                                <SheetHeader className="mb-6">
                                    <SheetTitle className="text-left text-sm font-black uppercase tracking-widest text-slate-400">Review Navigation</SheetTitle>
                                </SheetHeader>
                                <div className="h-[calc(100vh-120px)]">
                                    <SidebarContent />
                                </div>
                            </SheetContent>
                        </Sheet>

                        <div className="size-8 md:size-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0 hidden xs:flex">
                            <CheckCircle className="size-5 md:size-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm md:text-lg font-bold text-slate-900 dark:text-slate-100 leading-none truncate max-w-[150px] md:max-w-none">
                                {quiz.title}
                            </h1>
                            <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                Completed on {new Date(result.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-12">
                        <div className="flex md:hidden items-center gap-3 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Score</span>
                                <span className="text-xs font-black text-blue-600">{result.total_obtained}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Status</span>
                                <span className={cn("text-[9px] font-black", result.status === 'passed' ? "text-emerald-500" : "text-red-500")}>
                                    {result.status === 'passed' ? 'PASS' : 'FAIL'}
                                </span>
                            </div>
                        </div>

                        <div className="hidden md:flex flex-col items-center border-r border-slate-100 dark:border-white/5 pr-12">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Final Score</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{result.total_obtained}</span>
                                <span className="text-sm font-bold text-slate-300 dark:text-slate-600">/ {quiz.total_marks}</span>
                            </div>
                        </div>

                        <div className="hidden md:flex flex-col items-center border-r border-slate-100 dark:border-white/5 pr-12">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Status</span>
                            <div className={cn(
                                "flex items-center gap-1.5 font-bold text-sm",
                                result.status === 'passed' ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                            )}>
                                {result.status === 'passed' ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                                {result.status?.toUpperCase()}
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-6">
                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-100 dark:border-white/5 shadow-inner">
                                <Clock className="size-5 text-blue-500" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Time</span>
                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 tabular-nums">{formatTimeFull(result.time_taken || 0)}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={generatePDF} className="text-slate-400 hover:text-blue-600">
                                <Download className="size-5" />
                            </Button>
                        </div>

                        <Button variant="ghost" size="icon" onClick={generatePDF} className="md:hidden text-slate-400">
                            <Download className="size-5" />
                        </Button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden transition-colors duration-300 relative">
                    <aside className="hidden md:flex w-72 bg-white dark:bg-[#0A0C14] border-r border-slate-200 dark:border-white/5 flex-col p-6 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto transition-colors duration-300">
                        <SidebarContent />
                    </aside>

                    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0A0C14] transition-colors duration-300">
                        <div className="hidden md:block p-12 max-w-4xl mx-auto">
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                        </div>
                                    </div>
                                    <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest tabular-nums">
                                        Points: <span className={cn("font-black ml-1", isCorrect ? "text-emerald-500" : "text-red-500")}>{isCorrect ? currentQuestion.marks : '0'}/{currentQuestion.marks}</span>
                                    </div>
                                </div>

                                <Card className="p-8 border-slate-100 dark:border-white/5 bg-white dark:bg-[#111420] shadow-sm rounded-2xl">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                                        {currentQuestion.question_text}
                                    </h2>
                                </Card>

                                <div className="grid gap-4">
                                    {currentQuestion.options.map((option: any) => {
                                        const isUserChoice = userAnswerId === option.id;
                                        const isTheCorrectAnswer = currentQuestion.correct_answer === option.id;
                                        let variantStyle = "bg-white dark:bg-[#111420] border-slate-200 dark:border-white/5 shadow-sm";
                                        if (isTheCorrectAnswer) variantStyle = "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-300 dark:border-emerald-500/30 ring-1 ring-emerald-100 dark:ring-emerald-500/10 shadow-lg shadow-emerald-500/5";
                                        else if (isUserChoice && !isCorrect) variantStyle = "bg-red-50 dark:bg-red-500/5 border-red-300 dark:border-red-500/30 ring-1 ring-red-100 dark:ring-red-500/10 shadow-lg shadow-red-500/5";

                                        return (
                                            <div key={option.id} className={cn("p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group", variantStyle)}>
                                                <div className={cn("size-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0", isTheCorrectAnswer ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : (isUserChoice && !isCorrect) ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-slate-100 dark:bg-white/5 text-slate-400")}>
                                                    {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={cn("font-bold text-sm", isTheCorrectAnswer ? "text-emerald-700 dark:text-emerald-400" : (isUserChoice && !isCorrect) ? "text-red-700 dark:text-red-400" : "text-slate-600 dark:text-slate-300")}>{option.text}</p>
                                                </div>
                                                {isTheCorrectAnswer ? <Check className="size-4 text-emerald-500" /> : (isUserChoice && !isCorrect) ? <XCircle className="size-4 text-red-500" /> : null}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-between pt-12 border-t border-slate-100 dark:border-white/5">
                                    <Button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} variant="ghost" className="gap-2 font-black">
                                        <ChevronLeft className="size-4" /> PREV
                                    </Button>
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Question {currentIndex + 1} OF {questions.length}</div>
                                    <Button onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))} disabled={currentIndex === questions.length - 1} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 font-black shadow-lg shadow-blue-600/20">
                                        NEXT <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden flex flex-col h-full overflow-y-auto pt-4 pb-20 space-y-4 px-4 scroll-smooth">
                            {questions.map((q, qIdx) => {
                                const qUserAnswer = answers[q.id];
                                const qIsCorrect = qUserAnswer === q.correct_answer;
                                const qIsSkipped = !qUserAnswer;

                                return (
                                    <div key={q.id} id={`mobile-question-${qIdx}`} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-xs font-black text-slate-400">#{qIdx + 1}</span>
                                            <Badge className={cn(
                                                "text-[8px] font-black px-2 py-0.5 rounded-full border-none",
                                                qIsCorrect ? "bg-emerald-500/10 text-emerald-600" : qIsSkipped ? "bg-slate-500/10 text-slate-600" : "bg-red-500/10 text-red-600"
                                            )}>
                                                {qIsCorrect ? 'CORRECT' : qIsSkipped ? 'SKIPPED' : 'INCORRECT'}
                                            </Badge>
                                        </div>

                                        <Card className="p-4 border-slate-100 dark:border-white/5 bg-white dark:bg-[#111420] shadow-sm rounded-2xl relative overflow-hidden">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-4">
                                                {q.question_text}
                                            </p>
                                            <div className="space-y-2">
                                                {q.options.map((opt: any) => {
                                                    const isSelected = qUserAnswer === opt.id;
                                                    const isCorrectOpt = q.correct_answer === opt.id;
                                                    return (
                                                        <div key={opt.id} className={cn(
                                                            "p-3 rounded-xl border flex items-center gap-3 transition-colors",
                                                            isCorrectOpt ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/20" :
                                                                (isSelected && !qIsCorrect) ? "bg-red-50/50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20" :
                                                                    "bg-slate-50 border-slate-100 dark:bg-white/5 dark:border-white/5"
                                                        )}>
                                                            <div className={cn(
                                                                "size-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0",
                                                                isCorrectOpt ? "bg-emerald-500 text-white" :
                                                                    (isSelected && !qIsCorrect) ? "bg-red-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500"
                                                            )}>
                                                                {String.fromCharCode(65 + q.options.indexOf(opt))}
                                                            </div>
                                                            <span className={cn(
                                                                "text-[11px] font-bold",
                                                                isCorrectOpt ? "text-emerald-700 dark:text-emerald-400" :
                                                                    (isSelected && !qIsCorrect) ? "text-red-700 dark:text-red-400" : "text-slate-600 dark:text-slate-300"
                                                            )}>
                                                                {opt.text}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            {q.explanation && (
                                                <div className="mt-4 p-3 bg-blue-50/30 dark:bg-blue-500/5 rounded-xl border border-blue-100/50 dark:border-blue-500/10">
                                                    <div className="flex items-center gap-1.5 mb-1 text-blue-600">
                                                        <Info className="size-3" />
                                                        <span className="text-[9px] font-black uppercase">Explanation</span>
                                                    </div>
                                                    <p className="text-[10px] text-blue-900/60 dark:text-blue-200/50 font-medium italic mb-0">
                                                        {q.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </Card>
                                        <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-4 last:hidden" />
                                    </div>
                                );
                            })}
                        </div>
                    </main>
                </div>
            </div>
        </DashboardLayout>
    );
}
