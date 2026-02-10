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
            <div className="w-full pb-10 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => step === 'review' ? setStep('input') : navigate(-1)}
                            className="h-12 w-12 rounded-full hover:bg-muted transition-colors"
                        >
                            <ArrowLeft className="size-6" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">Create Quiz with AI</h1>
                                <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-none px-3 py-1 text-xs font-bold">
                                    <Sparkles className="size-3 mr-1" />
                                    AI Powered
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-lg mt-1">
                                {step === 'input' && 'Choose how you want AI to generate your quiz'}
                                {step === 'generating' && 'AI is crafting your questions...'}
                                {step === 'review' && 'Review, edit, and publish your AI-generated quiz'}
                            </p>
                        </div>
                    </div>

                    {step === 'review' && (
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => { setStep('input'); setQuestions([]); }} className="h-11 px-6">
                                <RefreshCw className="size-4 mr-2" />
                                Regenerate
                            </Button>
                            <Button
                                onClick={handlePublishQuiz}
                                disabled={saving || questions.length === 0 || !title.trim()}
                                className="h-11 px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-4 mr-2" />
                                        Publish Quiz Now
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-3 mb-8">
                    {[
                        { key: 'input', label: 'Configure', icon: Zap },
                        { key: 'generating', label: 'Generate', icon: Brain },
                        { key: 'review', label: 'Review & Publish', icon: CheckCircle },
                    ].map((s, i) => (
                        <div key={s.key} className="flex items-center gap-3">
                            {i > 0 && <div className={`h-0.5 w-8 rounded-full transition-colors ${['generating', 'review'].indexOf(step) >= i ? 'bg-primary' : 'bg-muted'}`} />}
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${step === s.key ? 'bg-primary text-primary-foreground shadow-md' : ['generating', 'review'].indexOf(step) > ['input', 'generating', 'review'].indexOf(s.key) ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <s.icon className="size-4" />
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ============ STEP: INPUT ============ */}
                {step === 'input' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Input Method Selector */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="shadow-md border-none bg-gradient-to-br from-card to-card/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="size-5 text-purple-500" />
                                        Generation Method
                                    </CardTitle>
                                    <CardDescription>Choose how AI generates your questions</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <button
                                        onClick={() => setInputMethod('topic')}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${inputMethod === 'topic'
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-border hover:border-primary/30 hover:bg-muted/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${inputMethod === 'topic' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                <BookOpen className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">Topic-Based</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Enter a topic and let AI generate questions</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setInputMethod('file')}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${inputMethod === 'file'
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-border hover:border-primary/30 hover:bg-muted/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${inputMethod === 'file' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                <FileUp className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">File-Based</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Upload a PDF and generate from its content</p>
                                            </div>
                                        </div>
                                    </button>
                                </CardContent>
                            </Card>

                            <div className="bg-gradient-to-br from-violet-500/5 to-purple-500/5 rounded-2xl p-6 border border-violet-500/10">
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <Brain className="size-4 text-violet-500" />
                                    How It Works
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    AI will generate multiple-choice questions with 4 options each. You'll be able to review, edit, and delete any question before publishing.
                                </p>
                            </div>
                        </div>

                        {/* Input Form */}
                        <div className="lg:col-span-8">
                            <Card className="shadow-md border-none">
                                <CardHeader>
                                    <CardTitle className="text-2xl flex items-center gap-2">
                                        {inputMethod === 'topic' ? (
                                            <>
                                                <BookOpen className="size-6 text-primary" />
                                                Topic Configuration
                                            </>
                                        ) : (
                                            <>
                                                <FileUp className="size-6 text-primary" />
                                                Upload Document
                                            </>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {inputMethod === 'topic'
                                            ? 'Specify the topic, difficulty, and number of questions'
                                            : 'Upload a PDF file to generate questions from its content'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {inputMethod === 'topic' ? (
                                        <>
                                            <div className="space-y-2.5">
                                                <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Topic Name</Label>
                                                <Input
                                                    placeholder="e.g., Photosynthesis, Data Structures – Trees, World War II"
                                                    value={topic}
                                                    onChange={(e) => setTopic(e.target.value)}
                                                    className="h-12 text-lg font-medium"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2.5">
                                                    <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Difficulty Level</Label>
                                                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                                                        <SelectTrigger className="h-12">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="easy">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-2 rounded-full bg-emerald-500" />
                                                                    Easy — Basic recall
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="medium">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-2 rounded-full bg-amber-500" />
                                                                    Medium — Application
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="hard">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-2 rounded-full bg-red-500" />
                                                                    Hard — Critical thinking
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2.5">
                                                    <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Number of Questions</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={15}
                                                        value={questionCount}
                                                        onChange={(e) => setQuestionCount(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                                                        className="h-12 font-bold text-lg"
                                                    />
                                                    <p className="text-xs text-muted-foreground">Between 1 and 15</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2.5">
                                                <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Upload PDF</Label>
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/[0.02] ${selectedFile ? 'border-primary bg-primary/5' : 'border-border'}`}
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

                                            <div className="space-y-2.5">
                                                <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Number of Questions</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={15}
                                                    value={fileQuestionCount}
                                                    onChange={(e) => setFileQuestionCount(Math.min(15, Math.max(1, parseInt(e.target.value) || 1)))}
                                                    className="h-12 font-bold text-lg w-40"
                                                />
                                                <p className="text-xs text-muted-foreground">Between 1 and 15</p>
                                            </div>
                                        </>
                                    )}

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || (inputMethod === 'topic' && !topic.trim()) || (inputMethod === 'file' && !selectedFile)}
                                        className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                                    >
                                        <Sparkles className="size-5 mr-2" />
                                        Generate Questions with AI
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ============ STEP: GENERATING ============ */}
                {step === 'generating' && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping">
                                <div className="w-32 h-32 rounded-full bg-violet-500/20" />
                            </div>
                            <div className="relative p-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full shadow-2xl shadow-violet-500/30">
                                <Brain className="size-16 text-white animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mt-8 mb-3">AI is Working...</h2>
                        <p className="text-muted-foreground text-lg mb-6">{generationProgress || 'Preparing your quiz...'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            This usually takes 10–30 seconds
                        </div>
                    </div>
                )}

                {/* ============ STEP: REVIEW ============ */}
                {step === 'review' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Sidebar: Quiz Info */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="shadow-md border-none bg-gradient-to-br from-card to-card/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Edit2 className="size-5 text-primary" />
                                        Quiz Overview
                                    </CardTitle>
                                    <CardDescription>Set quiz details before publishing</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2.5">
                                        <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quiz Title</Label>
                                        <Input
                                            placeholder="e.g., Mid-Term Physics Assessment"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="h-11 text-lg font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                                        <Textarea
                                            placeholder="Add instructions, rules, or learning objectives..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[120px] resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pass Score (%)</Label>
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
                                            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Points</Label>
                                            <div className="h-11 px-4 bg-muted/50 rounded-md border-2 border-dashed border-muted text-foreground font-bold flex items-center justify-center text-xl">
                                                {calculateTotalMarks()}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-md border-none bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/10">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                                            <CheckCircle className="size-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">Ready to Publish</h4>
                                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                Review each question carefully. Edit or delete questions as needed, then click "Publish Quiz Now" when satisfied.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main: Questions Review */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="shadow-md border-none">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div>
                                        <CardTitle className="text-2xl">Generated Questions</CardTitle>
                                        <CardDescription>{questions.length} questions ready for review</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-violet-500/10 text-violet-500 border-violet-500/20 px-3 py-1.5 font-bold">
                                        <Sparkles className="size-3 mr-1.5" />
                                        AI Generated
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {questions.map((question, index) => (
                                        editingQuestionId === question.id ? (
                                            <div key={question.id} className="bg-muted/30 p-6 rounded-xl border-2 border-dashed border-primary/20 animate-in slide-in-from-top-4 duration-300">
                                                <QuestionEditor
                                                    question={question}
                                                    onSave={handleSaveQuestion}
                                                    onCancel={() => setEditingQuestionId(null)}
                                                    questionNumber={index + 1}
                                                />
                                            </div>
                                        ) : (
                                            <Card key={question.id} className="relative group hover:border-primary/50 transition-colors shadow-sm bg-muted/20">
                                                <CardContent className="p-5 flex gap-6">
                                                    <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-xl w-14 h-14 shrink-0 shadow-sm border font-bold text-xl text-primary">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        <p className="font-semibold text-lg leading-tight">{question.question_text}</p>
                                                        <div className="flex flex-wrap items-center gap-4">
                                                            <Badge variant="outline" className="bg-white dark:bg-slate-900 px-3 py-1 border-primary/20 shadow-sm">
                                                                {question.marks} Points
                                                            </Badge>
                                                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                                <div className="size-1.5 rounded-full bg-muted-foreground" />
                                                                {question.options.length} Choices
                                                            </span>
                                                            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                                                                <div className="size-1.5 rounded-full bg-emerald-600" />
                                                                Answer Set
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingQuestionId(question.id)} className="h-10 w-10 hover:bg-white dark:hover:bg-slate-900 shadow-sm border border-transparent hover:border-border">
                                                            <Edit2 className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 text-destructive hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20"
                                                            onClick={() => setQuestionToDelete(question.id)}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    ))}

                                    {questions.length === 0 && (
                                        <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/10">
                                            <AlertTriangle className="size-12 text-amber-500 mx-auto mb-4" />
                                            <h4 className="text-lg font-bold">All questions have been removed</h4>
                                            <p className="text-muted-foreground mt-1">Click "Regenerate" to generate new questions.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
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
