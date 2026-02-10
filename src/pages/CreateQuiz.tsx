import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import { useQuizzes } from '@/hooks/useQuizzes';
import { QuestionEditor } from '@/components/quizzes/QuestionEditor';
import { QuizQuestion } from '@/types/quiz';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { DeleteConfirmDialog } from '@/components/layout/DeleteConfirmDialog';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';

// Simple UUID generator to avoid external dependency
const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default function CreateQuiz() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createQuiz } = useQuizzes(classId);

    // Quiz Details State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [passPercentage, setPassPercentage] = useState(50);

    // Questions State
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

    const calculateTotalMarks = () => {
        return questions.reduce((sum, q) => sum + q.marks, 0);
    };

    // Load draft from DB on mount
    useEffect(() => {
        const loadDraft = async () => {
            if (!classId || !user) {
                setIsLoading(false);
                return;
            }

            try {
                // Check quiz_drafts table
                const { data: draft, error } = await supabase
                    .from('quiz_drafts')
                    .select('*')
                    .eq('class_id', classId)
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                    console.error('Error fetching draft:', error);
                } else if (draft) {
                    setDraftId(draft.id);
                    const data = draft.data as any;

                    if (data) {
                        setTitle(data.title || '');
                        setDescription(data.description || '');
                        setPassPercentage(data.passPercentage || 50);
                        setQuestions(data.questions || []);
                    }
                }
            } catch (error) {
                console.error('Error loading draft:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDraft();
    }, [classId, user]);

    // Unified Auto-Save Logic (Supabase only)
    useEffect(() => {
        // Skip if still loading initial data or empty state
        if (isLoading) return;
        if (!title && questions.length === 0 && !description) return;

        const saveEverything = async () => {
            if (!classId || !user) return;
            setIsAutoSaving(true);

            try {
                const draftData = {
                    title,
                    description,
                    passPercentage,
                    questions
                };

                const { data: savedDraft, error } = await supabase
                    .from('quiz_drafts')
                    .upsert({
                        class_id: classId,
                        user_id: user.id,
                        data: draftData,
                        updated_at: new Date().toISOString(),
                        ...(draftId ? { id: draftId } : {})
                    })
                    .select()
                    .single();

                if (error) throw error;

                if (!draftId && savedDraft) {
                    setDraftId(savedDraft.id);
                }

                setLastSaved(new Date());

            } catch (error) {
                console.error('Auto-save failed:', error);
            } finally {
                setIsAutoSaving(false);
            }
        };

        const timeoutId = setTimeout(saveEverything, 1000); // 1s debounce
        return () => clearTimeout(timeoutId);
    }, [title, description, passPercentage, questions, classId, user, draftId, isLoading]);


    const handleSaveQuestion = (question: QuizQuestion) => {
        if (editingQuestionId) {
            setQuestions(questions.map(q => q.id === editingQuestionId ? question : q));
        } else {
            setQuestions([...questions, { ...question, id: generateId() }]);
        }
        setIsEditingQuestion(false);
        setEditingQuestionId(null);
    };

    const handleEditQuestion = (question: QuizQuestion) => {
        setEditingQuestionId(question.id);
        setIsEditingQuestion(true);
    };

    const handleDeleteQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handlePublishQuiz = async () => {
        if (!title.trim()) {
            toast.error('Please enter a quiz title');
            return;
        }
        if (questions.length === 0) {
            toast.error('Please add at least one question');
            return;
        }

        try {
            setSaving(true);
            const totalMarks = calculateTotalMarks();

            // 1. Create Quiz Record in REAL table
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

            // 3. Delete Draft
            if (draftId) {
                await supabase.from('quiz_drafts').delete().eq('id', draftId);
            }

            toast.success('Quiz created and published successfully!');
            navigate(`/lecturer/quizzes/${classId}`);

        } catch (error) {
            console.error('Error publishing quiz:', error);
            toast.error('Failed to publish quiz');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <FormSkeleton />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="w-full pb-10 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 rounded-full hover:bg-muted transition-colors shrink-0 mt-1 hidden md:flex">
                                <ArrowLeft className="size-6" />
                            </Button>
                            <div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Create New Quiz</h1>
                                        {isAutoSaving && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] md:text-xs font-medium animate-in fade-in">
                                                <Loader2 className="size-3 animate-spin" />
                                                Saving...
                                            </div>
                                        )}
                                        {!isAutoSaving && lastSaved && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] md:text-xs font-medium animate-in zoom-in">
                                                <Save className="size-3" />
                                                <span className="hidden sm:inline">Auto-saved at {lastSaved.toLocaleTimeString()}</span>
                                                <span className="sm:hidden">Saved</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground text-xs md:text-lg">Design your assessment and set grading criteria</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto sm:self-end">
                        <Button variant="outline" onClick={() => navigate(-1)} className="h-10 md:h-11 px-4 md:px-6 flex-1 sm:flex-none">Discard</Button>
                        <Button
                            onClick={handlePublishQuiz}
                            disabled={saving || questions.length === 0}
                            className="h-10 md:h-11 px-6 md:px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex-1 sm:flex-none"
                        >
                            {saving ? 'Publishing...' : 'Publish Quiz'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar: Basic Info & Criteria */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="shadow-md border-none bg-gradient-to-br from-card to-card/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Edit2 className="size-5 text-primary" />
                                    Quiz Overview
                                </CardTitle>
                                <CardDescription>Basic information and passing rules</CardDescription>
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
                                    <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Detailed Description</Label>
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


                    </div>

                    {/* Main Section: Questions List */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="shadow-md border-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="text-2xl">Exam Questions</CardTitle>
                                    <CardDescription>Manage and organize your question bank</CardDescription>
                                </div>
                                <Button
                                    onClick={() => setIsEditingQuestion(true)}
                                    disabled={isEditingQuestion}
                                    variant="outline"
                                    className="gap-2 border-primary text-primary hover:bg-primary hover:text-white"
                                >
                                    <Plus className="size-4" />
                                    New Question
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEditingQuestion && (
                                    <div className="bg-muted/30 p-6 rounded-xl border-2 border-dashed border-primary/20 animate-in slide-in-from-top-4 duration-300">
                                        <QuestionEditor
                                            question={editingQuestionId ? questions.find(q => q.id === editingQuestionId) : undefined}
                                            onSave={handleSaveQuestion}
                                            onCancel={() => {
                                                setIsEditingQuestion(false);
                                                setEditingQuestionId(null);
                                            }}
                                            questionNumber={editingQuestionId ? questions.findIndex(q => q.id === editingQuestionId) + 1 : questions.length + 1}
                                        />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {questions.map((question, index) => (
                                        <Card key={question.id} className="relative group hover:border-primary/50 transition-colors shadow-sm bg-muted/20">
                                            <CardContent className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:gap-6 relative">
                                                <div className="flex flex-row md:flex-col items-center gap-3 md:gap-0">
                                                    <div className="flex flex-col items-center justify-center p-2 md:p-3 bg-white dark:bg-slate-900 rounded-xl w-10 h-10 md:w-14 md:h-14 shrink-0 shadow-sm border font-bold text-lg md:text-xl text-primary">
                                                        {index + 1}
                                                    </div>
                                                    <Badge variant="outline" className="md:hidden bg-white dark:bg-slate-900 px-2 py-0.5 border-primary/20 shadow-sm text-xs">
                                                        {question.marks} Pts
                                                    </Badge>
                                                </div>

                                                <div className="flex-1 space-y-2 md:space-y-3 pt-8 md:pt-0">
                                                    <p className="font-semibold text-base md:text-lg leading-tight pr-0 md:pr-0">{question.question_text}</p>
                                                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                                        <Badge variant="outline" className="hidden md:inline-flex bg-white dark:bg-slate-900 px-3 py-1 border-primary/20 shadow-sm">
                                                            {question.marks} Points
                                                        </Badge>
                                                        <span className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5">
                                                            <div className="size-1.5 rounded-full bg-muted-foreground" />
                                                            {question.options.length} Choices
                                                        </span>
                                                        <span className="text-xs md:text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                                                            <div className="size-1.5 rounded-full bg-emerald-600" />
                                                            Answer Set
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="absolute right-3 top-3 md:right-auto md:top-auto md:relative flex md:flex-col gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(question)} className="h-8 w-8 md:h-10 md:w-10 hover:bg-white dark:hover:bg-slate-900 shadow-sm border border-transparent hover:border-border">
                                                        <Edit2 className="size-3 md:size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 md:h-10 md:w-10 text-destructive hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20"
                                                        onClick={() => setQuestionToDelete(question.id)}
                                                    >
                                                        <Trash2 className="size-3 md:size-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {questions.length === 0 && !isEditingQuestion && (
                                    <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/10 opacity-60">
                                        <div className="p-4 rounded-full bg-muted w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                            <Plus className="size-8 text-muted-foreground" />
                                        </div>
                                        <h4 className="text-lg font-bold">No questions yet</h4>
                                        <p className="text-muted-foreground mt-1">Start building your quiz by adding your first question.</p>
                                        <Button onClick={() => setIsEditingQuestion(true)} className="mt-6" variant="secondary">
                                            Add First Question
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
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
                description="This will remove the question from your draft. Your changes are automatically saved."
            />
        </DashboardLayout>
    );
}
