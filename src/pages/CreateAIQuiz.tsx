import { useState, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import {
    generateFromTopic,
    generateFromFile,
    extractTextFromPDF,
    type Difficulty,
} from '@/lib/aiQuizService';

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

    // ---------- GENERATION ----------
    const handleGenerate = useCallback(async () => {
        if (isGenerating) return; // Prevent double clicks

        setIsGenerating(true);
        setStep('generating');

        try {
            let generated: QuizQuestion[];

            if (inputMethod === 'topic') {
                if (!topic.trim()) {
                    toast.error('Please enter a topic.');
                    setStep('input');
                    setIsGenerating(false);
                    return;
                }
                setGenerationProgress('Analyzing topic and generating questions...');
                generated = await generateFromTopic({ topic: topic.trim(), difficulty, count: questionCount });
            } else {
                if (!selectedFile) {
                    toast.error('Please select a PDF file.');
                    setStep('input');
                    setIsGenerating(false);
                    return;
                }
                setGenerationProgress('Extracting text from PDF...');
                const text = await extractTextFromPDF(selectedFile);

                setGenerationProgress('Generating questions from document content...');
                generated = await generateFromFile({ fileText: text, count: fileQuestionCount });
            }

            setQuestions(generated);

            // Pre-fill title
            if (inputMethod === 'topic' && !title) {
                setTitle(`${topic.trim()} Quiz`);
            } else if (inputMethod === 'file' && !title && selectedFile) {
                setTitle(`${selectedFile.name.replace('.pdf', '')} Quiz`);
            }

            setStep('review');
            toast.success(`${generated.length} questions generated successfully!`);
        } catch (error: any) {
            console.error('Generation error:', error);
            toast.error(error.message || 'Unable to generate quiz. Please try again.');
            setStep('input');
        } finally {
            setIsGenerating(false);
            setGenerationProgress('');
        }
    }, [isGenerating, inputMethod, topic, difficulty, questionCount, selectedFile, fileQuestionCount, title]);

    // ---------- QUESTION EDITING ----------
    const handleSaveQuestion = (question: QuizQuestion) => {
        if (editingQuestionId) {
            setQuestions(questions.map(q => q.id === editingQuestionId ? question : q));
        }
        setEditingQuestionId(null);
    };

    const handleDeleteQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    // ---------- PUBLISH ----------
    const handlePublishQuiz = async () => {
        if (!title.trim()) {
            toast.error('Please enter a quiz title.');
            return;
        }
        if (questions.length === 0) {
            toast.error('No questions to publish. Generate or add questions first.');
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
                options: q.options,
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
    return (
        <DashboardLayout>
            <div className="w-full min-h-[calc(100vh-4rem)] bg-background text-foreground p-3 md:p-10 animate-in fade-in duration-500 rounded-3xl overflow-hidden shadow-none md:shadow-sm filter-none">
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
                                    <h1 className="text-xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400">
                                        Create Quiz with AI
                                    </h1>
                                </div>
                                <Badge className="w-fit bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none px-2 py-0.5 md:px-3 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-purple-500/20">
                                    <Brain className="size-3 mr-1" />
                                    AI Powered
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-xs md:text-sm md:pl-14">
                                Choose how you want AI to generate your quiz
                            </p>
                        </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center">
                        {[
                            { key: 'input', label: 'Configure', icon: Zap },
                            { key: 'generating', label: 'Generate', icon: Brain },
                            { key: 'review', label: 'Review & Publish', icon: CheckCircle },
                        ].map((s, i, arr) => {
                            const isActive = step === s.key;
                            const isPast = ['generating', 'review'].indexOf(step) > ['input', 'generating', 'review'].indexOf(s.key as Step);
                            const isFuture = !isActive && !isPast;

                            return (
                                <div key={s.key} className="flex items-center">
                                    <div
                                        className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-full text-[10px] md:text-xs font-semibold transition-all border ${isActive
                                            ? 'bg-primary border-primary text-primary-foreground shadow-lg z-10'
                                            : isPast
                                                ? 'bg-muted border-muted-foreground/20 text-muted-foreground'
                                                : 'bg-transparent border-muted-foreground/20 text-muted-foreground'
                                            }`}
                                    >
                                        <s.icon className="size-3.5" />
                                        <span className={`${isActive ? 'inline' : 'hidden sm:inline'}`}>{s.label}</span>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div className={`w-4 md:w-8 h-[2px] ${isPast ? 'bg-primary' : 'bg-muted'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ============ STEP: INPUT ============ */}
                {step === 'input' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
                        {/* LEFT COLUMN: Generation Method */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="shadow-lg">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Brain className="size-5 text-primary" />
                                        Generation Method
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <button
                                        onClick={() => setInputMethod('topic')}
                                        className={`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${inputMethod === 'topic'
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-border bg-card hover:bg-muted/50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-lg ${inputMethod === 'topic' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-muted text-muted-foreground'}`}>
                                                <BookOpen className="size-6" />
                                            </div>
                                            <div>
                                                <p className={`font-semibold text-sm ${inputMethod === 'topic' ? 'text-foreground' : 'text-muted-foreground'}`}>Topic-Based</p>
                                                <p className="text-xs text-muted-foreground mt-1">Enter a topic and let AI generate questions</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setInputMethod('file')}
                                        className={`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${inputMethod === 'file'
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-border bg-card hover:bg-muted/50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-lg ${inputMethod === 'file' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-muted text-muted-foreground'}`}>
                                                <FileUp className="size-6" />
                                            </div>
                                            <div>
                                                <p className={`font-semibold text-sm ${inputMethod === 'file' ? 'text-foreground' : 'text-muted-foreground'}`}>File-Based</p>
                                                <p className="text-xs text-muted-foreground mt-1">Upload a PDF and generate from its content</p>
                                            </div>
                                        </div>
                                    </button>
                                </CardContent>
                            </Card>


                        </div>

                        {/* RIGHT COLUMN: Configuration */}
                        <div className="lg:col-span-8">
                            <Card className="shadow-lg h-full">
                                <CardHeader className="pb-6">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        {inputMethod === 'topic' ? <BookOpen className="size-5 text-primary" /> : <FileUp className="size-5 text-primary" />}
                                        {inputMethod === 'topic' ? 'Topic Configuration' : 'File Configuration'}
                                    </CardTitle>
                                    <CardDescription>
                                        Specify the topic, difficulty, and number of questions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {inputMethod === 'topic' ? (
                                        <>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Topic Name</Label>
                                                <Input
                                                    placeholder="e.g., Photosynthesis, Data Structures – Trees, World War II"
                                                    value={topic}
                                                    onChange={(e) => setTopic(e.target.value)}
                                                    className="h-12 md:h-14 text-base"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Difficulty Level</Label>
                                                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                                                        <SelectTrigger className="h-12 md:h-14 px-4">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="easy">Easy — Basic recall</SelectItem>
                                                            <SelectItem value="medium">Medium — Application</SelectItem>
                                                            <SelectItem value="hard">Hard — Critical thinking</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Number of Questions</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={15}
                                                        value={questionCount}
                                                        onChange={(e) => setQuestionCount(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                                                        className="h-12 md:h-14 font-mono text-lg"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">Between 1 and 15 questions</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Upload PDF</Label>
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-muted/50 ${selectedFile ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}`}
                                                >
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept=".pdf"
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                    {selectedFile ? (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="p-3 bg-primary/10 rounded-full">
                                                                <FileText className="size-8 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-lg">{selectedFile.name}</p>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Click to change
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="p-4 bg-muted rounded-full">
                                                                <Upload className="size-8 text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-lg">Click to upload a PDF</p>
                                                                <p className="text-sm text-muted-foreground mt-1">Maximum file size: {MAX_FILE_SIZE_MB} MB</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Number of Questions</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={15}
                                                    value={fileQuestionCount}
                                                    onChange={(e) => setFileQuestionCount(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                                                    className="h-12 md:h-14 font-mono text-lg w-32"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="pt-4">
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || (inputMethod === 'topic' && !topic.trim()) || (inputMethod === 'file' && !selectedFile)}
                                            className="w-full h-12 md:h-14 text-lg font-bold shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-none rounded-xl"
                                        >
                                            {isGenerating ? (
                                                <Loader2 className="size-5 mr-2 animate-spin" />
                                            ) : (
                                                <Brain className="size-5 mr-2" />
                                            )}
                                            {isGenerating ? 'Generating...' : 'Generate Questions with AI'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ============ STEP: GENERATING ============ */}
                {step === 'generating' && (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping">
                                <div className="w-32 h-32 rounded-full bg-indigo-500/20" />
                            </div>
                            <div className="relative p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-2xl shadow-indigo-500/30">
                                <Brain className="size-16 text-white animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold mt-8 mb-3">AI is Working...</h2>
                        <p className="text-muted-foreground text-lg mb-8">{generationProgress || 'Preparing your quiz...'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-border">
                            <Loader2 className="size-4 animate-spin text-primary" />
                            <span>This usually takes 10–30 seconds</span>
                        </div>
                    </div>
                )}

                {/* ============ STEP: REVIEW ============ */}
                {step === 'review' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
                        {/* Sidebar: Quiz Info */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Edit2 className="size-5 text-primary" />
                                        Quiz Overview
                                    </CardTitle>
                                    <CardDescription>Set quiz details before publishing</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2.5">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quiz Title</Label>
                                        <Input
                                            placeholder="e.g., Mid-Term Physics Assessment"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</Label>
                                        <Textarea
                                            placeholder="Add instructions, rules, or learning objectives..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[120px] resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-2.5">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pass Score (%)</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={passPercentage}
                                                    onChange={(e) => setPassPercentage(parseInt(e.target.value) || 0)}
                                                    className="h-11 pr-8 font-bold"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Points</Label>
                                            <div className="h-11 px-4 bg-muted rounded-md border border-border font-bold flex items-center justify-center text-xl">
                                                {calculateTotalMarks()}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handlePublishQuiz}
                                        disabled={saving || questions.length === 0 || !title.trim()}
                                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 font-bold"
                                    >
                                        {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                        Publish Quiz
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => { setStep('input'); setQuestions([]); }}
                                        className="w-full"
                                    >
                                        <RefreshCw className="mr-2 size-4" />
                                        Discard & Regeneration
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main: Questions Review */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">Generated Questions</h3>
                                    <p className="text-muted-foreground text-sm">{questions.length} questions ready for review</p>
                                </div>
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5 font-mono">
                                    AI Generated
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                                {questions.map((question, index) => (
                                    editingQuestionId === question.id ? (
                                        <div key={question.id} className="bg-card border border-primary/20 p-6 rounded-xl animate-in slide-in-from-top-4 duration-300 shadow-md">
                                            <QuestionEditor
                                                question={question}
                                                onSave={handleSaveQuestion}
                                                onCancel={() => setEditingQuestionId(null)}
                                                questionNumber={index + 1}
                                            />
                                        </div>
                                    ) : (
                                        <Card key={question.id} className="relative group hover:border-primary/50 transition-all shadow-sm">
                                            <CardContent className="p-2 sm:p-5 flex gap-2 sm:gap-6 relative">
                                                <div className="flex flex-col items-center justify-center p-1 sm:p-3 bg-muted rounded-lg sm:rounded-xl size-7 sm:size-14 shrink-0 border border-border font-bold text-xs sm:text-xl text-primary font-mono">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 space-y-1 sm:space-y-3 min-w-0 pr-6 sm:pr-0">
                                                    <p className="font-semibold text-[10px] sm:text-lg leading-tight line-clamp-3 sm:line-clamp-none">{question.question_text}</p>
                                                    <div className="flex flex-wrap items-center gap-1 sm:gap-4">
                                                        <Badge variant="outline" className="bg-muted px-1 py-0 sm:px-3 sm:py-1 border-border text-muted-foreground text-[8px] sm:text-xs">
                                                            {question.marks} Pts
                                                        </Badge>
                                                        <span className="text-[8px] sm:text-sm text-muted-foreground flex items-center gap-1">
                                                            <div className="size-1 rounded-full bg-muted-foreground/50" />
                                                            {question.options.length} Ch
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row sm:flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-3 top-3 sm:static bg-background/80 sm:bg-transparent rounded-lg p-1 sm:p-0 backdrop-blur-sm sm:backdrop-blur-none border sm:border-none border-border shadow-sm sm:shadow-none">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingQuestionId(question.id)}>
                                                        <Edit2 className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => setQuestionToDelete(question.id)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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
