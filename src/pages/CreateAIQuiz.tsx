import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { QuestionEditor } from '@/components/quizzes/QuestionEditor';
import { QuizQuestion } from '@/types/quiz';
import { DeleteConfirmDialog } from '@/components/layout/DeleteConfirmDialog';
import {
    ArrowLeft,
    Sparkles,
    BookOpen,
    FileUp,
    Loader2,
    Edit2,
    Trash2,
    Plus,
    CheckCircle,
    AlertTriangle,
    Upload,
    RefreshCw,
    Save,
    Zap,
    Brain,
    FileText,
    ShieldCheck,
    Lock,
    ArrowRight,
    Shield,
    Check
} from 'lucide-react';
import {
    generateFromTopic,
    generateFromFile,
    extractTextFromPDF,
    type Difficulty,
} from '@/lib/aiQuizService';
import { getSubscription, createCheckoutSession, simulateWebhookSuccess } from '@/lib/subscriptionService';
import { motion, AnimatePresence } from 'framer-motion';

type InputMethod = 'topic' | 'file';
type Step = 'input' | 'generating' | 'review';

const MAX_FILE_SIZE_MB = 5;

export default function CreateAIQuiz() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Step state
    const [step, setStep] = useState<Step>('input');

    // Input method
    const [inputMethod, setInputMethod] = useState<InputMethod>('topic');

    // Topic inputs
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [questionCount, setQuestionCount] = useState(10);

    // File inputs
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileQuestionCount, setFileQuestionCount] = useState(10);

    // Generation
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState('');

    // Generated questions
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);

    // Quiz metadata
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [passPercentage, setPassPercentage] = useState(50);

    // Editing
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

    // Publishing
    const [saving, setSaving] = useState(false);

    // Subscription status
    const [isPremium, setIsPremium] = useState(false);
    const [checkingSubscription, setCheckingSubscription] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        const checkSub = async () => {
            if (!user) return;
            try {
                const sub = await getSubscription(user.id);
                setIsPremium(sub?.status === 'active' || sub?.plan_type === 'pro' || sub?.plan_type === 'pro_plus' || sub?.plan_type === 'premium');
            } catch (error) {
                console.error('Error checking subscription:', error);
            } finally {
                setCheckingSubscription(false);
            }
        };
        checkSub();
    }, [user]);

    const handleUpgrade = async (planType: 'pro' | 'pro_plus' = 'pro') => {
        if (!user || !user.email) {
            toast.error('You must be logged in to upgrade.');
            return;
        }
        setIsRedirecting(true);
        try {
            const url = await createCheckoutSession(user.id, user.email, planType);
            window.location.href = url;
        } catch (error: any) {
            console.error('Upgrade error:', error);
            toast.error(error.message || 'Failed to start checkout. Please try again.');
            setIsRedirecting(false);
        }
    };

    const handleSimulatePayment = async (planType: string = 'pro') => {
        if (!user || !user.email) return;
        setIsRedirecting(true);
        const loadingToast = toast.loading(`Simulating ${planType} payment...`);
        try {
            await simulateWebhookSuccess(user.id, user.email, planType);
            toast.success('Simulation successful!', { id: loadingToast });

            // Re-check subscription status
            const sub = await getSubscription(user.id);
            setIsPremium(sub?.status === 'active' || sub?.plan_type === 'pro' || sub?.plan_type === 'pro_plus' || sub?.plan_type === 'premium');

            if (sub?.status === 'active') {
                toast.success('Premium features unlocked! You can now generate quizzes.');
            }
        } catch (error: any) {
            console.error('Simulation error:', error);
            toast.error('Simulation failed. Check Supabase logs.', { id: loadingToast });
        } finally {
            setIsRedirecting(false);
        }
    };

    const handleTestSuccessPage = () => {
        navigate('/payment-success?session_id=cs_test_mock_123');
    };

    const handleTestFailPage = () => {
        navigate('/payment-fail');
    };

    const calculateTotalMarks = () => questions.reduce((sum, q) => sum + q.marks, 0);

    // ---------- FILE HANDLING ----------
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
            return;
        }

        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are supported.');
            return;
        }

        setSelectedFile(file);
    };

    // ---------- ACTIONS ----------
    const handleGenerate = async () => {
        if (!isPremium) {
            toast.error('Premium subscription required for AI generation.');
            return;
        }

        setIsGenerating(true);
        setStep('generating');
        setGenerationProgress('Reading input data...');

        try {
            let generatedQuestions: QuizQuestion[] = [];

            if (inputMethod === 'topic') {
                setGenerationProgress(`Analyzing topic: ${topic}...`);
                generatedQuestions = await generateFromTopic({ topic, difficulty, count: questionCount });
            } else if (selectedFile) {
                setGenerationProgress('Extracting text from PDF...');
                const pdfText = await extractTextFromPDF(selectedFile);
                setGenerationProgress('Generating questions from content...');
                generatedQuestions = await generateFromFile({ fileText: pdfText, count: fileQuestionCount });
            }

            setQuestions(generatedQuestions);
            setStep('review');
            toast.success('Successfully generated quiz questions!');
        } catch (error: any) {
            console.error('Generation Error:', error);
            toast.error(error.message || 'Failed to generate questions. Please try again.');
            setStep('input');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveQuestion = (updatedQuestion: QuizQuestion) => {
        setQuestions(questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
        setEditingQuestionId(null);
        toast.success('Question updated');
    };

    const handleDeleteQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
        toast.info('Question removed');
    };

    const handlePublishQuiz = async () => {
        if (!title.trim()) {
            toast.error('Please enter a quiz title');
            return;
        }

        try {
            setSaving(true);
            const totalMarks = calculateTotalMarks();

            // 1. Create Quiz Record
            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .insert({
                    class_id: classId,
                    title,
                    description,
                    total_marks: totalMarks,
                    pass_percentage: passPercentage,
                    status: 'published',
                    created_by: user?.id
                })
                .select()
                .single();

            if (quizError) throw quizError;

            // 2. Create Questions
            const questionsToInsert = questions.map((q, index) => ({
                quiz_id: quizData.id,
                question_text: q.question_text,
                question_type: q.question_type,
                marks: q.marks,
                options: q.options as any,
                correct_answer: q.correct_answer,
                order_index: index
            }));

            const { error: questionsError } = await supabase
                .from('quiz_questions')
                .insert(questionsToInsert);

            if (questionsError) throw questionsError;

            // 3. Send notifications
            if (classId) {
                try {
                    const { notifyQuizPublished } = await import('@/lib/notificationService');
                    await notifyQuizPublished(quizData.id, classId, title, user?.id || '');
                } catch (notifError) {
                    console.error('Notification failed:', notifError);
                }
            }

            toast.success('AI-generated quiz published successfully!');
            navigate(`/lecturer/quizzes/${classId}`);
        } catch (error: any) {
            console.error('Error publishing quiz:', error);
            toast.error('Failed to publish quiz. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ========== RENDER ==========
    if (checkingSubscription) {
        return (
            <DashboardLayout>
                <div className="flex flex-col h-[calc(100vh-4rem)] w-full items-center justify-center gap-4">
                    <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-5 text-indigo-500" />
                    </div>
                    <p className="text-muted-foreground animate-pulse font-medium">Verifying your Eduspace access...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="w-full min-h-[calc(100vh-4rem)] bg-background text-foreground p-3 md:p-10 animate-in fade-in duration-500 rounded-3xl overflow-hidden shadow-none md:shadow-sm filter-none">

                <div className={`relative w-full ${!isPremium && step === 'input' ? 'overflow-hidden' : ''}`}>
                    {/* Content Layer (Blurred if not premium) */}
                    <div className={`transition-all duration-700 ${!isPremium && step === 'input' ? 'blur-md pointer-events-none select-none opacity-60 px-4 pt-10' : ''}`}>

                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(-1)}
                                    className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 group shrink-0"
                                >
                                    <ArrowLeft className="size-5 md:size-6 text-slate-600 dark:text-slate-400 group-hover:text-primary" />
                                </Button>
                                <div className="flex flex-col gap-1">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 sm:p-2.5 bg-indigo-500/10 rounded-xl dark:bg-indigo-500/20 shadow-inner">
                                                <Brain className="size-6 sm:size-7 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                                AI Quiz <span className="text-indigo-600 dark:text-indigo-400">Generator</span>
                                            </h1>
                                        </div>
                                        <Badge variant="secondary" className="w-fit px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 font-bold uppercase tracking-tighter text-[10px]">
                                            <Sparkles className="size-3 mr-1.5 fill-current" />
                                            Llama-3 Powered
                                        </Badge>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium md:pl-14">Create professional assessments in seconds using artificial intelligence</p>
                                </div>
                            </div>

                            {step === 'input' && (
                                <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="size-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Powering</span>
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">5,000+ Educators</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stepper */}
                        {step !== 'generating' && (
                            <div className="flex items-center gap-4 mb-10 md:pl-14 overflow-x-auto pb-2 scrollbar-hide">
                                {[
                                    { key: 'input', label: 'Configure', icon: Zap },
                                    { key: 'generating', label: 'Generate', icon: Brain },
                                    { key: 'review', label: 'Review & Publish', icon: CheckCircle },
                                ].map((s) => (
                                    <div key={s.key} className="flex items-center shrink-0">
                                        <div
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${step === s.key
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                                                }`}
                                        >
                                            <s.icon className="size-3.5" />
                                            <span>{s.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ============ STEP: INPUT ============ */}
                        {step === 'input' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
                                {/* LEFT COLUMN: Generation Method */}
                                <div className="lg:col-span-4 space-y-6">
                                    <Card className="shadow-lg border-slate-200 dark:border-slate-800">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Brain className="size-5 text-indigo-600" />
                                                Generation Method
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <button
                                                onClick={() => setInputMethod('topic')}
                                                className={`w-full p-4 rounded-2xl border text-left transition-all ${inputMethod === 'topic'
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${inputMethod === 'topic' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                        <BookOpen className="size-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">Topic-Based</p>
                                                        <p className="text-xs text-slate-500 mt-0.5 tracking-tight">Enter any subject or topic</p>
                                                    </div>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => setInputMethod('file')}
                                                className={`w-full p-4 rounded-2xl border text-left transition-all ${inputMethod === 'file'
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${inputMethod === 'file' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                        <FileUp className="size-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">File-Based</p>
                                                        <p className="text-xs text-slate-500 mt-0.5 tracking-tight">Generate from your PDF documents</p>
                                                    </div>
                                                </div>
                                            </button>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* RIGHT COLUMN: Configuration */}
                                <div className="lg:col-span-8">
                                    <Card className="shadow-lg border-slate-200 dark:border-slate-800 h-full">
                                        <CardHeader className="pb-6">
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                {inputMethod === 'topic' ? <BookOpen className="size-5 text-indigo-600" /> : <FileUp className="size-5 text-indigo-600" />}
                                                Generation Settings
                                            </CardTitle>
                                            <CardDescription>
                                                Configure how you want the AI to create your assessment.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                            {inputMethod === 'topic' ? (
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Topic</Label>
                                                        <Input
                                                            placeholder="e.g., Photosynthesis in Plants, Quantum Mechanics Basics..."
                                                            value={topic}
                                                            onChange={(e) => setTopic(e.target.value)}
                                                            className="h-14 text-base font-semibold bg-slate-50/50 dark:bg-slate-900/50 rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty</Label>
                                                            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                                                                <SelectTrigger className="h-14 px-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="easy">Easy — Basic Concepts</SelectItem>
                                                                    <SelectItem value="medium">Medium — Application</SelectItem>
                                                                    <SelectItem value="hard">Hard — Synthesis</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Count</Label>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={15}
                                                                value={questionCount}
                                                                onChange={(e) => setQuestionCount(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                                                                className="h-14 font-bold text-lg bg-slate-50/50 dark:bg-slate-900/50 rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">PDF Selection</Label>
                                                        <div
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30 ${selectedFile ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 dark:border-slate-800'}`}
                                                        >
                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept=".pdf"
                                                                className="hidden"
                                                                onChange={handleFileChange}
                                                            />
                                                            {selectedFile ? (
                                                                <div className="flex flex-col items-center gap-4">
                                                                    <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl">
                                                                        <FileText className="size-10" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-xl">{selectedFile.name}</p>
                                                                        <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-widest">
                                                                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-4">
                                                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                                                        <Upload className="size-10 text-slate-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-lg">Click to select PDF</p>
                                                                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold font-mono">Max size 5MB</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount of Questions</Label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={15}
                                                            value={fileQuestionCount}
                                                            onChange={(e) => setFileQuestionCount(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                                                            className="h-14 font-bold text-lg w-32 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-6">
                                                <Button
                                                    onClick={handleGenerate}
                                                    disabled={isGenerating}
                                                    className="w-full h-16 text-xl font-black rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_12px_24px_-8px_rgba(79,70,229,0.5)] transition-all active:scale-[0.98]"
                                                >
                                                    <Zap className="size-6 mr-3 fill-current" />
                                                    Generate Assessment
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* ============ STEP: GENERATING ============ */}
                        {step === 'generating' && (
                            <div className="flex flex-col items-center justify-center py-20 px-4">
                                <div className="size-32 relative mb-10">
                                    <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping" />
                                    <div className="absolute inset-2 rounded-full bg-indigo-500/20 animate-pulse" />
                                    <div className="relative z-10 size-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                                        <Brain className="size-16 text-white" />
                                    </div>
                                </div>
                                <h1 className="text-3xl font-black tracking-tight mb-2">Engines Firing...</h1>
                                <p className="text-lg text-slate-500 font-medium mb-10">{generationProgress}</p>
                                <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-bounce">
                                    <Loader2 className="size-5 animate-spin text-indigo-600" />
                                    <span className="text-sm font-bold">Llama-3 is analyzing content...</span>
                                </div>
                            </div>
                        )}

                        {/* ============ STEP: REVIEW ============ */}
                        {step === 'review' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto">
                                <div className="lg:col-span-4 space-y-6">
                                    <Card className="shadow-xl rounded-3xl border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
                                        <CardHeader>
                                            <CardTitle className="text-xl">Finalize Details</CardTitle>
                                            <CardDescription>Give your quiz a name and description before students take it.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Quiz Title</Label>
                                                <Input
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    className="h-12 font-bold rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Description</Label>
                                                <Textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="min-h-[120px] rounded-xl font-medium"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400">Pass Score (%)</Label>
                                                    <Input
                                                        type="number"
                                                        value={passPercentage}
                                                        onChange={(e) => setPassPercentage(parseInt(e.target.value) || 0)}
                                                        className="h-12 font-bold rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400">Total Points</Label>
                                                    <div className="h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-xl">
                                                        {calculateTotalMarks()}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handlePublishQuiz}
                                                disabled={saving || questions.length === 0}
                                                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20"
                                            >
                                                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                                Publish to Class
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => { setStep('input'); setQuestions([]); }}
                                                className="w-full h-12 rounded-2xl"
                                            >
                                                <RefreshCw className="mr-2 size-4" />
                                                Start Over
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="lg:col-span-8 space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-2xl font-black tracking-tight">Review Content</h3>
                                        <Badge className="bg-indigo-600 text-white border-none py-1.5 px-4 font-black rounded-full text-[10px] uppercase">
                                            {questions.length} Questions
                                        </Badge>
                                    </div>
                                    <div className="space-y-4">
                                        {questions.map((q, i) => (
                                            <Card key={q.id} className="group border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all rounded-3xl overflow-hidden shadow-sm hover:shadow-xl">
                                                <CardContent className="p-6 flex gap-6">
                                                    <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-xl text-indigo-600 shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-lg mb-4">{q.question_text}</p>
                                                        <div className="flex items-center gap-4">
                                                            <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[10px] uppercase bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                                {q.marks} Points
                                                            </Badge>
                                                            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                                                                {q.options.length} Options
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-indigo-500 hover:text-white" onClick={() => setEditingQuestionId(q.id)}>
                                                            <Edit2 className="size-5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-rose-500 hover:text-white" onClick={() => setQuestionToDelete(q.id)}>
                                                            <Trash2 className="size-5" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upsell Overlay (3-Tier Pricing) */}
                    {!isPremium && step === 'input' && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-12 overflow-y-auto bg-slate-950/20 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 py-10"
                            >
                                {/* FREE PLAN */}
                                <Card className="border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] overflow-hidden flex flex-col shadow-xl">
                                    <CardContent className="p-8 flex-1 flex flex-col">
                                        <div className="mb-8">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold px-3 py-1 mb-4">Starter</Badge>
                                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">Free</h3>
                                            <div className="flex items-baseline mt-2">
                                                <span className="text-4xl font-black">$0</span>
                                                <span className="text-slate-400 font-bold ml-1">/mo</span>
                                            </div>
                                        </div>
                                        <ul className="space-y-4 mb-8 flex-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                                            <li className="flex items-center gap-2"><Check className="size-4 text-emerald-500" /> Manual Quiz Creation</li>
                                            <li className="flex items-center gap-2"><Check className="size-4 text-emerald-500" /> Basic Question Types</li>
                                            <li className="flex items-center gap-2 opacity-40"><Lock className="size-4" /> 1 AI Trial / month</li>
                                            <li className="flex items-center gap-2 opacity-40"><Lock className="size-4" /> No PDF Uploads</li>
                                        </ul>
                                        <Button variant="outline" className="h-14 w-full rounded-2xl border-slate-200 dark:border-slate-800 font-bold text-slate-400 cursor-not-allowed">
                                            Current Plan
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* PRO PLAN (Recommended) */}
                                <Card className="border-4 border-indigo-600 bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative scale-105 z-10">
                                    <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-600" />
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-indigo-600 text-white border-none font-black px-3 py-1 animate-pulse">MOST POPULAR</Badge>
                                    </div>
                                    <CardContent className="p-10 flex-1 flex flex-col">
                                        <div className="mb-8">
                                            <Badge className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-none font-bold px-3 py-1 mb-4">Professional</Badge>
                                            <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Pro Access</h3>
                                            <div className="flex items-baseline mt-2">
                                                <span className="text-5xl font-black text-indigo-600">₹399</span>
                                                <span className="text-slate-400 font-bold ml-1">/mo</span>
                                            </div>
                                        </div>
                                        <ul className="space-y-5 mb-10 flex-1 text-base font-bold text-slate-700 dark:text-slate-200">
                                            <li className="flex items-center gap-3"><Zap className="size-5 text-indigo-500 fill-current" /> 50 AI Quizzes / month</li>
                                            <li className="flex items-center gap-3"><FileUp className="size-5 text-indigo-500" /> Unlimited PDF Uploads</li>
                                            <li className="flex items-center gap-3"><Brain className="size-5 text-indigo-500" /> Premium AI Models</li>
                                            <li className="flex items-center gap-3"><ShieldCheck className="size-5 text-indigo-500" /> Priority Support</li>
                                        </ul>
                                        <Button
                                            onClick={() => handleUpgrade('pro')}
                                            disabled={isRedirecting}
                                            className="h-16 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-600/20 group mb-3 transition-all active:scale-95"
                                        >
                                            {isRedirecting ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 size-5 fill-current" />}
                                            Get Pro Access
                                            <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>

                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => handleSimulatePayment('pro')}
                                                disabled={isRedirecting}
                                                className="w-full text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5 py-1"
                                            >
                                                <Shield className="size-3" />
                                                Run Webhook Simulation
                                            </button>
                                            <div className="flex items-center justify-center gap-4">
                                                <button
                                                    onClick={handleTestSuccessPage}
                                                    className="text-[9px] font-bold uppercase tracking-tighter text-emerald-500 hover:text-emerald-600 transition-colors underline underline-offset-2"
                                                >
                                                    Success Page
                                                </button>
                                                <button
                                                    onClick={handleTestFailPage}
                                                    className="text-[9px] font-bold uppercase tracking-tighter text-rose-500 hover:text-rose-600 transition-colors underline underline-offset-2"
                                                >
                                                    Fail Page
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* PRO PLUS PLAN */}
                                <Card className="border border-slate-200 dark:border-slate-800 bg-black text-white rounded-[2rem] overflow-hidden flex flex-col shadow-xl">
                                    <CardContent className="p-8 flex-1 flex flex-col">
                                        <div className="mb-8">
                                            <Badge className="bg-amber-500 text-black border-none font-bold px-3 py-1 mb-4 text-xs font-black">ELITE</Badge>
                                            <h3 className="text-3xl font-black uppercase tracking-tight">Pro Plus</h3>
                                            <div className="flex items-baseline mt-2">
                                                <span className="text-4xl font-black text-amber-500">₹999</span>
                                                <span className="text-slate-500 font-bold ml-1">/mo</span>
                                            </div>
                                        </div>
                                        <ul className="space-y-4 mb-8 flex-1 text-sm font-medium text-slate-300">
                                            <li className="flex items-center gap-3"><Check className="size-5 text-amber-500" /> Everything in Pro</li>
                                            <li className="flex items-center gap-3"><Sparkles className="size-5 text-amber-500 fill-current" /> Unlimited AI Quizzes</li>
                                            <li className="flex items-center gap-3"><Zap className="size-5 text-amber-500 fill-current" /> Unlimited Course Gen</li>
                                            <li className="flex items-center gap-3"><CreditCard className="size-5 text-amber-500" /> Early Access Features</li>
                                        </ul>
                                        <Button
                                            onClick={() => handleUpgrade('pro_plus')}
                                            className="h-14 w-full bg-amber-500 hover:bg-amber-600 text-black font-black text-lg rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 border-none"
                                        >
                                            <Zap className="mr-2 size-5 fill-current" />
                                            Get Pro Plus
                                        </Button>

                                        <button
                                            onClick={() => handleSimulatePayment('pro_plus')}
                                            disabled={isRedirecting}
                                            className="w-full text-[10px] font-black uppercase tracking-widest text-amber-400/60 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5 py-4"
                                        >
                                            <Shield className="size-3" />
                                            Test Sub (Plus)
                                        </button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmDialog
                open={!!questionToDelete}
                onOpenChange={(open) => !open && setQuestionToDelete(null)}
                onConfirm={() => {
                    if (questionToDelete) {
                        handleDeleteQuestion(questionToDelete);
                        setQuestionToDelete(null);
                    }
                }}
                title="Delete Question?"
                description="This will remove the question from the generated set. This action cannot be undone."
            />
        </DashboardLayout>
    );
}
