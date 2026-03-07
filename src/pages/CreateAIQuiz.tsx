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
import { notifyQuizPublished } from '@/lib/notificationService';
import { useClasses } from '@/hooks/useClasses';
import { SectionClassCard } from '@/components/common/SectionClassCard';
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
    Check,
    Search,
    ChevronRight,
    Book,
    Users,
    Bot
} from 'lucide-react';
import {
    generateFromTopic,
    generateFromFile,
    extractTextFromPDF,
    type Difficulty,
} from '@/lib/aiQuizService';
import { motion, AnimatePresence } from 'framer-motion';

type InputMethod = 'topic' | 'file';
type Step = 'select-class' | 'input' | 'generating' | 'review';
type PersistedStep = 'select-class' | 'input' | 'review';

interface AIQuizDraft {
    step: PersistedStep;
    inputMethod: InputMethod;
    topic: string;
    difficulty: Difficulty;
    questionCount: number;
    fileQuestionCount: number;
    questions: QuizQuestion[];
    title: string;
    description: string;
    passPercentage: number;
}

const MAX_FILE_SIZE_MB = 5;

export default function CreateAIQuiz() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { classes } = useClasses();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Step state
    const [step, setStep] = useState<Step>(classId ? 'input' : 'select-class');

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
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

    // Publishing
    const [saving, setSaving] = useState(false);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [isLoadingDraft, setIsLoadingDraft] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Filter classes for selection
    const [classSearch, setClassSearch] = useState('');
    const filteredClassesSelection = classes.filter(cls =>
        cls.class_name?.toLowerCase().includes(classSearch.toLowerCase()) ||
        cls.course_code.toLowerCase().includes(classSearch.toLowerCase())
    );

    const clearDraftInSupabase = useCallback(async () => {
        if (!classId || !user?.id) return;

        const { error } = await supabase
            .from('quiz_drafts')
            .delete()
            .eq('class_id', classId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to delete AI quiz draft:', error);
            return;
        }

        setDraftId(null);
        setLastSaved(null);
    }, [classId, user?.id]);

    useEffect(() => {
        if (!classId) {
            setStep('select-class');
        }
    }, [classId]);

    useEffect(() => {
        const loadDraftFromSupabase = async () => {
            if (!classId || !user?.id) {
                if (classId) setStep('input');
                return;
            }

            setIsLoadingDraft(true);
            try {
                const { data: draft, error } = await supabase
                    .from('quiz_drafts')
                    .select('*')
                    .eq('class_id', classId)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    throw error;
                }

                if (!draft) {
                    setStep('input');
                    return;
                }

                setDraftId(draft.id);
                const draftData = (draft.data ?? {}) as Partial<AIQuizDraft>;

                setInputMethod(draftData.inputMethod ?? 'topic');
                setTopic(draftData.topic ?? '');
                setDifficulty(draftData.difficulty ?? 'medium');
                setQuestionCount(Math.min(15, Math.max(1, Number(draftData.questionCount) || 10)));
                setFileQuestionCount(Math.min(15, Math.max(1, Number(draftData.fileQuestionCount) || 10)));
                setQuestions(Array.isArray(draftData.questions) ? draftData.questions : []);
                setTitle(draftData.title ?? '');
                setDescription(draftData.description ?? '');
                setPassPercentage(Math.max(0, Number(draftData.passPercentage) || 50));
                setLastSaved(new Date(draft.updated_at));

                if (draftData.step === 'review' && Array.isArray(draftData.questions) && draftData.questions.length > 0) {
                    setStep('review');
                } else {
                    setStep('input');
                }
            } catch (error) {
                console.error('Failed to load AI quiz draft from Supabase:', error);
                setStep('input');
            } finally {
                setIsLoadingDraft(false);
            }
        };

        loadDraftFromSupabase();
    }, [classId, user?.id]);

    const saveDraftNow = useCallback(async (showToast = false) => {
        if (!classId || !user?.id) return;
        if (step === 'select-class' || step === 'generating') return;

        const draft: AIQuizDraft = {
            step: step === 'generating' ? (questions.length > 0 ? 'review' : 'input') : step,
            inputMethod,
            topic,
            difficulty,
            questionCount,
            fileQuestionCount,
            questions,
            title,
            description,
            passPercentage,
        };

        try {
            setIsAutoSaving(true);
            const { data: savedDraft, error } = await supabase
                .from('quiz_drafts')
                .upsert({
                    class_id: classId,
                    user_id: user.id,
                    data: draft,
                    updated_at: new Date().toISOString(),
                    ...(draftId ? { id: draftId } : {}),
                })
                .select()
                .single();

            if (error) throw error;

            if (!draftId && savedDraft) {
                setDraftId(savedDraft.id);
            }

            setLastSaved(new Date());
            if (showToast) {
                toast.success('Draft saved');
            }
        } catch (error) {
            console.error('Failed to save AI quiz draft:', error);
            if (showToast) {
                toast.error('Failed to save draft');
            }
        } finally {
            setIsAutoSaving(false);
        }
    }, [
        classId,
        user?.id,
        step,
        inputMethod,
        topic,
        difficulty,
        questionCount,
        fileQuestionCount,
        questions,
        title,
        description,
        passPercentage,
        draftId,
    ]);

    useEffect(() => {
        if (!classId || !user?.id || isLoadingDraft) return;
        if (step === 'select-class' || step === 'generating') return;
        if (!title.trim() && !description.trim() && !topic.trim() && questions.length === 0) return;

        const timeoutId = setTimeout(async () => {
            await saveDraftNow(false);
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [
        isLoadingDraft,
        step,
        saveDraftNow,
        classId,
        user?.id,
        title,
        description,
        topic,
        questions.length,
    ]);

    const calculateTotalMarks = () => questions.reduce((sum, q) => sum + q.marks, 0);
    const editingQuestion = editingQuestionId
        ? questions.find((question) => question.id === editingQuestionId) ?? null
        : null;
    const editingQuestionNumber = editingQuestion
        ? questions.findIndex((question) => question.id === editingQuestion.id) + 1
        : 1;

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
        setQuestions((prevQuestions) => {
            const existingIndex = prevQuestions.findIndex((q) => q.id === updatedQuestion.id);
            if (existingIndex === -1) {
                return [...prevQuestions, updatedQuestion];
            }
            return prevQuestions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q));
        });
        setEditingQuestionId(null);
        setIsAddingQuestion(false);
        toast.success('Question updated');
    };

    const handleDeleteQuestion = (id: string) => {
        setQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== id));
        if (editingQuestionId === id) {
            setEditingQuestionId(null);
        }
        setIsAddingQuestion(false);
        toast.info('Question removed');
    };

    const handlePublishQuiz = async () => {
        if (!classId) {
            toast.error('No class context found. You can generate and preview quizes, but you must select a class from the list to publish.');
            return;
        }

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
                    await notifyQuizPublished(quizData.id, classId, title, user?.id || '');
                } catch (notifError) {
                    console.error('Notification failed:', notifError);
                }
            }

            toast.success('AI-generated quiz published successfully!');
            await clearDraftInSupabase();
            navigate(`/lecturer/quizzes/${classId}`);
        } catch (error: any) {
            console.error('Error publishing quiz:', error);
            toast.error('Failed to publish quiz. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleStartOver = async () => {
        setQuestions([]);
        setEditingQuestionId(null);
        setIsAddingQuestion(false);
        setQuestionToDelete(null);
        setTitle('');
        setDescription('');
        setPassPercentage(50);
        setStep('input');
        setTopic('');
        setSelectedFile(null);
        await clearDraftInSupabase();
    };



    return (
        <DashboardLayout>
            <div className={step === 'select-class' && !classId
                ? "w-full flex flex-col gap-10 animate-in fade-in duration-500"
                : "w-full min-h-[calc(100vh-4rem)] bg-background text-foreground p-3 md:p-10 animate-in fade-in duration-500 rounded-3xl overflow-x-hidden md:overflow-hidden shadow-none md:shadow-sm filter-none"
            }>
                <div className="relative w-full">

                    {/* Header - Only show for wizard steps */}
                    {step !== 'select-class' && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4">
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
                                        <Badge
                                            variant="secondary"
                                            className="w-fit px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 font-bold uppercase tracking-tighter text-[10px]"
                                        >
                                            <Sparkles className="size-3 mr-1.5 fill-current" />
                                            Llama-3 Powered
                                        </Badge>
                                        {!classId && (
                                            <Badge variant="outline" className="w-fit px-3 py-1 bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 font-bold uppercase tracking-tighter text-[10px]">
                                                Class Selection Mode
                                            </Badge>
                                        )}
                                        {classId && isLoadingDraft && (
                                            <Badge variant="outline" className="w-fit px-3 py-1 font-bold uppercase tracking-tighter text-[10px]">
                                                Loading Draft...
                                            </Badge>
                                        )}
                                        {classId && isAutoSaving && !isLoadingDraft && (
                                            <Badge variant="outline" className="w-fit px-3 py-1 font-bold uppercase tracking-tighter text-[10px]">
                                                Saving Draft...
                                            </Badge>
                                        )}
                                        {classId && !isAutoSaving && !isLoadingDraft && lastSaved && (
                                            <Badge variant="outline" className="w-fit px-3 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 font-bold uppercase tracking-tighter text-[10px]">
                                                Draft Saved
                                            </Badge>
                                        )}
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
                    )}

                    {/* ============ STEP: SELECT CLASS (MATCHING QUIZZES PAGE DESIGN) ============ */}
                    {step === 'select-class' && (
                        <div className="w-full flex flex-col gap-10 animate-in fade-in duration-500">
                            {/* Header */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                                        <Bot className="size-8 text-blue-600 dark:text-blue-400 fill-blue-500/10" />
                                        Generate AI Quiz
                                    </h1>
                                    <p className="text-muted-foreground mt-2 text-lg">
                                        Select a class to generate a new quiz using AI.
                                    </p>
                                </div>

                                {/* Search Bar - Wider on Desktop */}
                                <div className="relative w-full lg:w-96 group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search class or course code..."
                                        value={classSearch}
                                        onChange={(e) => setClassSearch(e.target.value)}
                                        className="pl-11 h-12 bg-white dark:bg-slate-900 border-none shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 text-lg rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Stats Overview - Premium Look */}
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="border-none bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl rounded-2xl overflow-hidden group">
                                    <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                            <BookOpen className="size-12 sm:size-20 text-white" />
                                        </div>
                                        <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                            <BookOpen className="size-5 sm:size-7 text-white" />
                                        </div>
                                        <div className="relative z-10 min-w-0">
                                            <p className="text-[10px] sm:text-sm text-blue-100/80 font-semibold uppercase tracking-wider truncate">
                                                Total Classes
                                            </p>
                                            <p className="text-xl sm:text-3xl font-black text-white">{classes.length}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none bg-gradient-to-br from-emerald-600 to-teal-700 shadow-xl rounded-2xl overflow-hidden group">
                                    <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="size-12 sm:size-20 text-white" />
                                        </div>
                                        <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                            <CheckCircle className="size-5 sm:size-7 text-white" />
                                        </div>
                                        <div className="relative z-10 min-w-0">
                                            <p className="text-[10px] sm:text-sm text-emerald-100/80 font-semibold uppercase tracking-wider truncate">
                                                AI Tokens
                                            </p>
                                            <p className="text-xl sm:text-3xl font-black text-white">Unlimited</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Classes Grid */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold">Your Academic Classes</h2>
                                    <Badge variant="outline" className="px-4 py-1.5 rounded-full text-base font-medium">
                                        {filteredClassesSelection.length} Results
                                    </Badge>
                                </div>

                                {filteredClassesSelection.length === 0 ? (
                                    <div className="py-20 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No matching classes</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-6">
                                        {filteredClassesSelection.map((cls, index) => (
                                            <SectionClassCard
                                                key={cls.id}
                                                classData={cls}
                                                variant="quizzes"
                                                onAction={() => navigate(`/lecturer/quizzes/${cls.id}/create-ai`)}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Stepper */}
                    {step !== 'generating' && step !== 'select-class' && (
                        <div className="grid grid-cols-3 gap-2 md:flex md:items-center md:gap-4 mb-6 md:mb-10 w-full">
                            {[
                                { key: 'input', label: 'Configure', icon: Zap },
                                { key: 'generating', label: 'Generate', icon: Brain },
                                { key: 'review', label: 'Review', icon: CheckCircle },
                            ].map((s) => (
                                <div key={s.key} className="flex items-center justify-center shrink-0 w-full md:w-auto">
                                    <div
                                        className={`flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-4 py-2.5 rounded-xl md:rounded-full text-[10px] md:text-xs font-bold transition-all border w-full md:w-auto ${step === s.key
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                                            }`}
                                    >
                                        <s.icon className="size-3.5 shrink-0" />
                                        <span className="truncate">{s.label}</span>
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
                        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 pb-40 md:pb-0 max-md:bg-slate-50 dark:max-md:bg-[#0f0714] max-md:text-slate-900 dark:max-md:text-slate-100 max-md:-mx-3 max-md:px-4 max-md:pt-4">
                            <section className="space-y-6 order-1">
                                <nav className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-md:text-slate-400">
                                    <span>Quizzes</span>
                                    <ChevronRight className="size-3.5" />
                                    <span>New Quiz</span>
                                    <ChevronRight className="size-3.5" />
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 max-md:text-indigo-600 dark:max-md:text-violet-300">Review</span>
                                </nav>

                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 max-md:border-slate-200 dark:max-md:border-[#2d1b42] pb-4 sm:pb-6">
                                    <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-8 w-full">
                                        {[
                                            { label: 'Configure', active: false, number: 1 },
                                            { label: 'Generate', active: false, number: 2 },
                                            { label: 'Review', active: true, number: 3 },
                                        ].map((item) => (
                                            <div key={item.label} className={`flex flex-col items-center gap-1.5 ${item.active ? '' : 'opacity-50'}`}>
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${item.active ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'border border-slate-400 max-md:border-slate-300 dark:max-md:border-violet-500/60'}`}>
                                                    {item.number}
                                                </div>
                                                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${item.active ? 'text-indigo-600 max-md:text-indigo-600 dark:max-md:text-violet-300' : 'max-md:text-slate-500 dark:max-md:text-slate-500'}`}>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Review Content</h3>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setIsAddingQuestion(true); setEditingQuestionId(null); }}
                                        className="flex items-center gap-1 text-indigo-600 max-md:text-indigo-600 dark:max-md:text-violet-300 font-semibold"
                                    >
                                        <Plus className="size-4" />
                                        Add Question
                                    </Button>
                                </div>
                                <div>
                                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                                        Review and edit your generated questions before publishing.
                                    </p>
                                </div>

                                {(editingQuestion || isAddingQuestion) && (
                                    <QuestionEditor
                                        question={isAddingQuestion ? undefined : editingQuestion ?? undefined}
                                        questionNumber={isAddingQuestion ? questions.length + 1 : editingQuestionNumber}
                                        onSave={handleSaveQuestion}
                                        onCancel={() => { setEditingQuestionId(null); setIsAddingQuestion(false); }}
                                    />
                                )}

                                <div className="space-y-4 sm:space-y-5">
                                    {questions.map((q, i) => (
                                        <Card key={q.id} className="group bg-white/80 dark:bg-indigo-950/10 border border-slate-200 dark:border-indigo-900/40 max-md:bg-white dark:max-md:bg-[#160b22] max-md:border-slate-200 dark:max-md:border-[#2d1b42] rounded-xl sm:rounded-2xl p-0 hover:border-indigo-500/50 transition-all">
                                            <CardContent className="p-4 sm:p-6">
                                                <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[10px] sm:text-xs font-bold text-indigo-600 max-md:text-indigo-600 dark:max-md:text-violet-300 uppercase tracking-widest mb-2 block">
                                                            Question {i + 1} Multiple Choice
                                                        </span>
                                                        <h4 className="text-base sm:text-lg font-semibold leading-relaxed break-words">
                                                            {q.question_text}
                                                        </h4>
                                                    </div>
                                                    <div className="flex gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                                        <Button variant="ghost" size="icon" className="size-9 rounded-lg text-slate-500 max-md:text-slate-600 dark:max-md:text-slate-300 hover:bg-slate-100 dark:hover:bg-indigo-500/20" onClick={() => { setEditingQuestionId(q.id); setIsAddingQuestion(false); }}>
                                                            <Edit2 className="size-4.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-9 rounded-lg text-slate-500 max-md:text-slate-600 dark:max-md:text-slate-300 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20" onClick={() => setQuestionToDelete(q.id)}>
                                                            <Trash2 className="size-4.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-indigo-500/20 max-md:bg-slate-100 dark:max-md:bg-[#1c0f2a] max-md:border max-md:border-slate-200 dark:max-md:border-violet-500/30 rounded-full">
                                                        <CheckCircle className="size-3.5 text-indigo-600 max-md:text-indigo-600 dark:max-md:text-violet-300" />
                                                        <span className="text-[11px] font-bold">{q.marks} Points</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-indigo-500/20 max-md:bg-slate-100 dark:max-md:bg-[#1c0f2a] max-md:border max-md:border-slate-200 dark:max-md:border-violet-500/30 rounded-full">
                                                        <Book className="size-3.5 text-indigo-600 max-md:text-indigo-600 dark:max-md:text-violet-300" />
                                                        <span className="text-[11px] font-bold">{q.options.length} Options</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>

                            <aside className="order-2 xl:order-2 xl:sticky xl:top-24 self-start border border-slate-200 dark:border-indigo-900/40 max-md:border-t max-md:border-x-0 max-md:border-b-0 max-md:border-slate-200 dark:max-md:border-[#2d1b42] bg-white dark:bg-slate-950/50 max-md:bg-transparent rounded-2xl max-md:rounded-none p-4 sm:p-6 max-md:px-0 max-md:pt-8 space-y-6">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold mb-1">Finalize Details</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-md:text-slate-500 dark:max-md:text-slate-400">Configure quiz settings before publish.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold max-md:text-slate-700 dark:max-md:text-slate-300">Quiz Title</Label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="h-11 bg-slate-100 dark:bg-indigo-500/10 max-md:bg-white dark:max-md:bg-[#1c0f2a] max-md:border-slate-200 dark:max-md:border-[#2d1b42] border-none rounded-lg font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold max-md:text-slate-700 dark:max-md:text-slate-300">Description</Label>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[90px] bg-slate-100 dark:bg-indigo-500/10 max-md:bg-white dark:max-md:bg-[#1c0f2a] max-md:border-slate-200 dark:max-md:border-[#2d1b42] border-none rounded-lg"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold max-md:text-slate-700 dark:max-md:text-slate-300">Pass %</Label>
                                            <Input
                                                type="number"
                                                value={passPercentage}
                                                onChange={(e) => setPassPercentage(parseInt(e.target.value) || 0)}
                                                className="h-11 bg-slate-100 dark:bg-indigo-500/10 max-md:bg-white dark:max-md:bg-[#1c0f2a] max-md:border-slate-200 dark:max-md:border-[#2d1b42] border-none rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold max-md:text-slate-700 dark:max-md:text-slate-300">Points</Label>
                                            <Input
                                                value={calculateTotalMarks()}
                                                readOnly
                                                className="h-11 bg-slate-100 dark:bg-indigo-500/10 max-md:bg-white dark:max-md:bg-[#1c0f2a] max-md:border-slate-200 dark:max-md:border-[#2d1b42] border-none rounded-lg opacity-80"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-indigo-500/10 max-md:bg-indigo-50 dark:max-md:bg-[#1c0f2a] rounded-xl border border-indigo-500/20 max-md:border-indigo-200 dark:max-md:border-[#2d1b42] text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400 max-md:text-slate-600 dark:max-md:text-slate-400">Total Questions</span>
                                        <span className="font-bold">{questions.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-slate-500 dark:text-slate-400 max-md:text-slate-600 dark:max-md:text-slate-400">Total Points</span>
                                        <span className="font-bold">{calculateTotalMarks()}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 hidden md:block">
                                    <Button
                                        onClick={handlePublishQuiz}
                                        disabled={saving || questions.length === 0}
                                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20"
                                    >
                                        {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                                        Publish to Class
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => saveDraftNow(true)}
                                        className="w-full h-11 rounded-xl"
                                    >
                                        Save as Draft
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={handleStartOver}
                                        className="w-full h-10 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                    >
                                        Discard
                                    </Button>
                                </div>
                            </aside>

                            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f0714]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#2d1b42] p-4">
                                <div className="max-w-md mx-auto space-y-3">
                                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col">
                                            <span>Total Questions</span>
                                            <span className="text-slate-900 dark:text-white font-bold text-sm">{questions.length}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span>Total Points</span>
                                            <span className="text-slate-900 dark:text-white font-bold text-sm">{calculateTotalMarks()}</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handlePublishQuiz}
                                        disabled={saving || questions.length === 0}
                                        className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30"
                                    >
                                        {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                                        Publish to Class
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => saveDraftNow(true)}
                                        className="w-full h-11 rounded-xl border-slate-300 dark:border-[#2d1b42] bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                                    >
                                        Save as Draft
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={handleStartOver}
                                        className="w-full h-10 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                    >
                                        Discard
                                    </Button>
                                </div>
                            </div>
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
        </DashboardLayout >
    );
}
