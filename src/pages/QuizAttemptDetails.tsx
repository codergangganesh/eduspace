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
    BarChart,
    ChevronLeft,
    ChevronRight,
    Download,
    Home
} from 'lucide-react';
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
            if (!quizId || !user) {
                return;
            }
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
                    setError(`No submission record found for Quiz ID: ${quizId}`);
                    setResult(null);
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
                const errorMsg = error.message || 'Failed to load details';
                const errorDetails = error.details || error.hint || JSON.stringify(error);
                setError(`${errorMsg} (${errorDetails})`);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [quizId, user]);

    // Duration formatting
    const formatDuration = (ms: number) => {
        if (ms < 0) return "--:--";
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)));
        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        return `${minutes}m ${seconds}s`;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-20 min-h-[60vh]">
                    <Loader2 className="animate-spin size-10 text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !quiz || !result) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center min-h-[60vh]">
                    <div className="bg-red-100 p-4 rounded-full dark:bg-red-900/30">
                        <XCircle className="size-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold">Unable to Load Details</h2>
                    <p className="text-muted-foreground max-w-md">
                        {error || "We couldn't find the quiz submission you're looking for."}
                    </p>
                    <div className="flex gap-3 mt-6">
                        <Button onClick={() => window.location.reload()} variant="default">Retry</Button>
                        <Button onClick={() => navigate('/student/quizzes')} variant="outline">Back to Quizzes</Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const isPassed = result.status === 'passed';

    let durationLabel = "--:--";
    if (result.time_taken !== null && result.time_taken !== undefined) {
        const mins = Math.floor(result.time_taken / 60);
        const secs = result.time_taken % 60;
        durationLabel = `${mins}m ${secs}s`;
    } else {
        // Fallback calculation using existing duration logic
        const durationMs = new Date(result.submitted_at).getTime() - new Date(result.started_at || result.created_at).getTime();
        durationLabel = formatDuration(durationMs);
    }

    // Check if questions exist
    const currentQuestion = questions[currentIndex] || {};
    const userAnswerId = answers[currentQuestion.id];
    const isQuestionCorrect = userAnswerId === currentQuestion.correct_answer;
    const isQuestionSkipped = !userAnswerId || userAnswerId === 'skipped';

    const generatePDFReport = () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // 1. Header
            doc.setFontSize(22);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text(quiz.title, 14, 22);

            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(quiz.classes?.class_name || 'EduSpace LMS', 14, 30);

            doc.setDrawColor(59, 130, 246); // blue-500
            doc.setLineWidth(1);
            doc.line(14, 35, pageWidth - 14, 35);

            // 2. Student Info & Summary Info
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text("STUDENT NAME", 14, 45);
            doc.setTextColor(15, 23, 42);
            doc.setFont(undefined, 'bold');
            doc.text(user?.user_metadata?.full_name || user?.email || 'Student', 14, 50);

            doc.setFont(undefined, 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text("EXAM DATE", pageWidth / 2, 45);
            doc.setTextColor(15, 23, 42);
            doc.setFont(undefined, 'bold');
            doc.text(new Date(result.submitted_at).toLocaleDateString(), pageWidth / 2, 50);

            doc.setFont(undefined, 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text("FINAL STATUS", (pageWidth * 3) / 4, 45);
            const statusColor = isPassed ? [16, 185, 129] : [239, 68, 68]; // emerald-500 : red-500
            doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
            doc.setFont(undefined, 'bold');
            doc.text(result.status.toUpperCase(), (pageWidth * 3) / 4, 50);

            // Summary Stats Cards
            doc.setFillColor(248, 250, 252); // slate-50
            doc.roundedRect(14, 60, pageWidth - 28, 25, 3, 3, 'F');

            doc.setFont(undefined, 'normal');
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(9);
            doc.text("TOTAL SCORE", 25, 70);
            doc.text("ACCURACY", pageWidth / 2, 70);
            doc.text("TIME TAKEN", pageWidth - 50, 70);

            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42);
            doc.setFont(undefined, 'bold');
            doc.text(`${result.total_obtained} / ${quiz.total_marks}`, 25, 78);
            doc.text(`${Math.round((result.total_obtained / quiz.total_marks) * 100)}%`, pageWidth / 2, 78);
            doc.text(durationLabel, pageWidth - 50, 78);

            // 3. Itemized Results Table
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text("Itemized Performance Report", 14, 100);

            const tableData = questions.map((q, idx) => {
                const studentAns = answers[q.id];
                const isCorrect = studentAns === q.correct_answer;
                const isSkipped = !studentAns || studentAns === 'skipped';

                const getOptionFullText = (letter: string) => {
                    const idx = ['a', 'b', 'c', 'd'].indexOf(letter.toLowerCase());
                    const optText = q.options?.[idx]?.text || '';
                    return optText ? `(${letter.toUpperCase()}) ${optText}` : `Option ${letter.toUpperCase()}`;
                };

                return [
                    idx + 1,
                    q.question_text,
                    isSkipped ? 'Skipped' : getOptionFullText(studentAns),
                    getOptionFullText(q.correct_answer),
                    isSkipped ? 'SKIPPED' : (isCorrect ? 'CORRECT' : 'WRONG')
                ];
            });

            autoTable(doc, {
                startY: 105,
                head: [['#', 'Question', 'Your Answer', 'Correct Answer', 'Result']],
                body: tableData,
                headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 9 },
                bodyStyles: { fontSize: 8, cellPadding: 5 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 40 },
                    3: { cellWidth: 40 },
                    4: { cellWidth: 22, halign: 'center' }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 4) {
                        const cellVal = data.cell.raw;
                        if (cellVal === 'CORRECT') data.cell.styles.textColor = [16, 185, 129];
                        else if (cellVal === 'WRONG') data.cell.styles.textColor = [239, 68, 68];
                        else data.cell.styles.textColor = [100, 116, 139];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            });

            // Footer
            const pageCount = (doc.internal as any).getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text(
                    `Educational LMS - Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }

            doc.save(`Quiz_Report_${quiz.title.replace(/\s+/g, '_')}.pdf`);
            toast.success("PDF Report downloaded successfully!");
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF. Check console for details.");
        }
    };

    return (
        <DashboardLayout fullHeight>
            <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-sans">

                {/* 1. Header Section */}
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
                    <div className="w-full px-4 md:px-6 py-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                            {/* Title Area */}
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                                    <BarChart className="size-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Exam Results</p>
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                        {quiz.title}
                                    </h1>
                                    <p className="text-xs text-slate-500">Completed on {new Date(result.submitted_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Stats Area */}
                            <div className="flex items-center gap-6 md:gap-12 bg-slate-50 dark:bg-slate-800/50 px-6 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Final Score</p>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className={`text-2xl font-black ${isPassed ? 'text-blue-600' : 'text-red-500'}`}>
                                            {result.total_obtained}
                                        </span>
                                        <span className="text-sm font-bold text-slate-400">/{quiz.total_marks}</span>
                                    </div>
                                </div>

                                <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</p>
                                    <div className={`flex items-center gap-1.5 font-black text-sm uppercase ${isPassed ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {isPassed ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                                        {result.status}
                                    </div>
                                </div>

                                <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />

                                <div className="hidden sm:block">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="bg-slate-200 dark:bg-slate-700 p-1 rounded-full">
                                            <Clock className="size-3 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Taken</p>
                                    </div>
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300 text-center font-mono">
                                        {durationLabel}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <Button
                                onClick={generatePDFReport}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                            >
                                <Download className="size-4 mr-2" />
                                Download PDF Report
                            </Button>
                        </div>
                    </div>
                </header>


                <div className="flex flex-1 overflow-hidden">

                    {/* 2. Left Sidebar (Question Grid) */}
                    <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden lg:flex h-full overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Review Questions</h3>
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((q, idx) => {
                                    const uAns = answers[q.id];
                                    const isCorr = uAns === q.correct_answer;
                                    const isSkip = !uAns || uAns === 'skipped';
                                    const isCurr = idx === currentIndex;

                                    let btnClass = "h-10 w-full rounded-lg text-sm font-bold flex items-center justify-center transition-all ";

                                    if (isCurr) {
                                        btnClass += "ring-2 ring-offset-2 ring-blue-500 z-10 ";
                                    }

                                    if (isSkip) {
                                        btnClass += "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800";
                                    } else if (isCorr) {
                                        btnClass += "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-500/20";
                                    } else {
                                        btnClass += "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/20";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={btnClass}
                                        >
                                            {idx + 1}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Status Legend & Return Button (Pinned to Bottom) */}
                        <div className="mt-auto border-t border-slate-100 dark:border-slate-800">
                            <div className="p-6 pb-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Status Legend</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <div className="size-4 rounded bg-emerald-500" />
                                        Correct Answer
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <div className="size-4 rounded bg-red-500" />
                                        Incorrect Answer
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        <div className="size-4 rounded bg-slate-200" />
                                        Skipped / Unanswered
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-4">
                                <Button
                                    variant="outline"
                                    className="w-full justify-center gap-2 text-slate-600 font-bold h-12"
                                    onClick={() => navigate('/student/quizzes')}
                                >
                                    <Home className="size-4" />
                                    Return to Dashboard
                                </Button>
                            </div>
                        </div>
                    </aside>


                    {/* 3. Main Content (Single Question View) */}
                    <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-6 lg:p-10">
                        <div className="max-w-4xl mx-auto space-y-8">

                            {/* Question Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl font-black text-blue-600">Q{currentIndex + 1}</span>

                                    {isQuestionSkipped ? (
                                        <div className="px-3 py-1 rounded bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">Skipped</div>
                                    ) : isQuestionCorrect ? (
                                        <div className="px-3 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">Correct</div>
                                    ) : (
                                        <div className="px-3 py-1 rounded bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider">Incorrect</div>
                                    )}

                                    <div className="px-3 py-1 rounded bg-white border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">Multiple Choice</div>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Points Earned</p>
                                    <p className={`text-xl font-black ${isQuestionCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {isQuestionCorrect ? currentQuestion.marks : 0}<span className="text-slate-400 text-sm font-bold">/{currentQuestion.marks}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Question Card */}
                            <Card className="border-0 shadow-md ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
                                <div className="p-10">
                                    <h2 className="text-2xl font-bold leading-relaxed text-slate-900 dark:text-slate-100">
                                        {currentQuestion.question_text}
                                    </h2>
                                </div>
                            </Card>

                            {/* Options List */}
                            <div className="space-y-3">
                                {(currentQuestion.options || []).map((opt: any, idx: number) => {
                                    const letter = String.fromCharCode(65 + idx); // A, B, C...
                                    const isOptSelected = userAnswerId === opt.id;
                                    const isOptCorrect = currentQuestion.correct_answer === opt.id;

                                    let containerClass = "flex items-center p-4 rounded-xl border-2 transition-all ";
                                    let badgeClass = "size-10 rounded-lg flex items-center justify-center font-bold text-sm mr-4 shrink-0 transition-colors ";
                                    let textClass = "flex-1 font-medium ";

                                    if (isOptCorrect) {
                                        // This is the correct answer
                                        containerClass += "bg-emerald-50 border-emerald-500 dark:bg-emerald-500/10";
                                        badgeClass += "bg-emerald-500 text-white";
                                        textClass += "text-emerald-900 dark:text-emerald-100";
                                    } else if (isOptSelected && !isOptCorrect) {
                                        // User selected this but it's wrong
                                        containerClass += "bg-red-50 border-red-500 dark:bg-red-500/10";
                                        badgeClass += "bg-red-500 text-white";
                                        textClass += "text-red-900 dark:text-red-100";
                                    } else {
                                        // Neutral
                                        containerClass += "bg-white dark:bg-slate-900 border-white dark:border-slate-800 shadow-sm";
                                        badgeClass += "bg-slate-100 dark:bg-slate-800 text-slate-500";
                                        textClass += "text-slate-500 dark:text-slate-400";
                                    }

                                    return (
                                        <div key={opt.id} className={containerClass}>
                                            <div className={badgeClass}>{letter}</div>
                                            <div className={textClass}>{opt.text}</div>

                                            {/* Right Side Status */}
                                            {isOptCorrect && (
                                                <div className="flex items-center gap-2 ml-4 text-emerald-600">
                                                    <div className="size-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                                        <CheckCircle className="size-4" />
                                                    </div>
                                                </div>
                                            )}
                                            {isOptSelected && !isOptCorrect && (
                                                <div className="flex items-center gap-2 ml-4 text-red-600 font-bold text-xs uppercase">
                                                    <span className="text-red-500 font-bold mr-2">YOUR ANSWER</span>
                                                    <XCircle className="size-6 text-red-500" />
                                                </div>
                                            )}
                                            {isOptSelected && isOptCorrect && (
                                                <span className="text-emerald-600 font-bold text-xs uppercase mr-2">CORRECT ANSWER</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Navigation Footer */}
                            <div className="flex items-center justify-between pt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentIndex === 0}
                                    className="h-12 px-6 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                >
                                    <ChevronLeft className="size-4 mr-2" />
                                    Previous Question
                                </Button>

                                <Button
                                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                    disabled={currentIndex === questions.length - 1}
                                    className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Next Question
                                    <ChevronRight className="size-4 ml-2" />
                                </Button>
                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </DashboardLayout>
    );
}
