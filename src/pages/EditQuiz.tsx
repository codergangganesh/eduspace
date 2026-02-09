import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { QuestionEditor } from '@/components/quizzes/QuestionEditor';
import { QuizQuestion } from '@/types/quiz';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DeleteConfirmDialog } from '@/components/layout/DeleteConfirmDialog';

// Simple UUID generator
// Robust UUID generator for client-side IDs
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function EditQuiz() {
    const { classId, quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Quiz Details State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [passPercentage, setPassPercentage] = useState(50);
    const [status, setStatus] = useState('draft');

    // Questions State
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasSubmissions, setHasSubmissions] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

    const calculateTotalMarks = () => {
        return questions.reduce((sum, q) => sum + q.marks, 0);
    };

    // Load quiz from DB on mount
    useEffect(() => {
        const loadQuiz = async () => {
            if (!quizId || !user) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch quiz data
                const { data: quiz, error: quizError } = await supabase
                    .from('quizzes')
                    .select('*, questions:quiz_questions(*)')
                    .eq('id', quizId)
                    .single();

                if (quizError) throw quizError;

                if (quiz) {
                    setTitle(quiz.title || '');
                    setDescription(quiz.description || '');
                    setPassPercentage(quiz.pass_percentage || 50);
                    setStatus(quiz.status || 'draft');

                    // Sort questions by order_index
                    const sortedQuestions = (quiz.questions || []).sort((a: any, b: any) => a.order_index - b.order_index);
                    setQuestions(sortedQuestions.map((q: any) => ({
                        id: q.id,
                        quiz_id: q.quiz_id,
                        question_text: q.question_text,
                        question_type: q.question_type,
                        marks: q.marks,
                        options: q.options,
                        correct_answer: q.correct_answer,
                        order_index: q.order_index
                    })));
                }

                // Check if quiz has submissions
                const { count } = await supabase
                    .from('quiz_submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('quiz_id', quizId);

                setHasSubmissions((count || 0) > 0);

            } catch (error) {
                console.error('Error loading quiz:', error);
                toast.error('Failed to load quiz');
                navigate(`/lecturer/quizzes/${classId}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadQuiz();
    }, [quizId, user, classId, navigate]);

    // Auto-save logic
    useEffect(() => {
        if (isLoading) return;
        if (!title && questions.length === 0 && !description) return;

        const saveEverything = async () => {
            if (!classId || !user || !quizId) return;

            try {
                // Update Quiz Metadata
                const { error: quizError } = await supabase
                    .from('quizzes')
                    .update({
                        title: title || 'Untitled Quiz',
                        description,
                        total_marks: calculateTotalMarks(),
                        pass_percentage: passPercentage,
                    })
                    .eq('id', quizId);

                if (quizError) throw quizError;

                // Smart Sync Questions: Upsert all current, Delete missing
                if (questions.length > 0) {
                    const questionsToUpsert = questions.map((q, index) => ({
                        id: q.id, // Include ID for upsert
                        quiz_id: quizId,
                        question_text: q.question_text,
                        question_type: q.question_type,
                        marks: q.marks,
                        options: q.options,
                        correct_answer: q.correct_answer,
                        order_index: index
                    }));

                    const { error: upsertError } = await supabase
                        .from('quiz_questions')
                        .upsert(questionsToUpsert);

                    if (upsertError) throw upsertError;

                    // Delete questions that are no longer in the list
                    const currentIds = questions.map(q => q.id);
                    const { error: deleteError } = await supabase
                        .from('quiz_questions')
                        .delete()
                        .eq('quiz_id', quizId)
                        .not('id', 'in', currentIds);

                    if (deleteError) console.error("Error deleting removed questions:", deleteError);
                } else {
                    // If no questions, delete all
                    await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
                }

                setLastSaved(new Date());

            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        };

        const timeoutId = setTimeout(saveEverything, 1000); // 1s debounce
        return () => clearTimeout(timeoutId);
    }, [title, description, passPercentage, questions, classId, user, quizId, isLoading]);

    const handleSaveQuestion = (question: QuizQuestion) => {
        if (editingQuestionId) {
            setQuestions(questions.map(q => q.id === editingQuestionId ? question : q));
        } else {
            setQuestions([...questions, { ...question, id: generateUUID() }]);
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

    const handleSaveAndClose = async () => {
        if (!title.trim()) {
            toast.error('Please enter a quiz title');
            return;
        }

        try {
            setSaving(true);
            const totalMarks = calculateTotalMarks();

            // Update Quiz
            const { error: quizError } = await supabase
                .from('quizzes')
                .update({
                    title,
                    description,
                    total_marks: totalMarks,
                    pass_percentage: passPercentage,
                })
                .eq('id', quizId);

            if (quizError) throw quizError;

            // Smart Sync Questions (same as auto-save)
            if (questions.length > 0) {
                const questionsToUpsert = questions.map((q, index) => ({
                    id: q.id,
                    quiz_id: quizId,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    marks: q.marks,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    order_index: index
                }));

                const { error: upsertError } = await supabase
                    .from('quiz_questions')
                    .upsert(questionsToUpsert);

                if (upsertError) throw upsertError;

                // Delete missing
                const currentIds = questions.map(q => q.id);
                await supabase
                    .from('quiz_questions')
                    .delete()
                    .eq('quiz_id', quizId)
                    .not('id', 'in', currentIds);

            } else {
                await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
            }

            // If republishing, archive existing submissions to allow retake
            if (status === 'published') {
                const { error: archiveError } = await supabase
                    .from('quiz_submissions')
                    .update({ is_archived: true })
                    .eq('quiz_id', quizId)
                    .eq('is_archived', false);

                if (archiveError) console.error("Error archiving submissions:", archiveError);
            }

            toast.success('Quiz updated successfully!');
            navigate(`/lecturer/quizzes/${classId}`);

        } catch (error) {
            console.error('Error saving quiz:', error);
            toast.error('Failed to update quiz');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="size-10 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium">Loading quiz...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="w-full pb-10 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-12 w-12 rounded-full hover:bg-muted transition-colors">
                            <ArrowLeft className="size-6" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">Edit Quiz</h1>
                                <Badge variant={status === 'published' ? 'default' : status === 'closed' ? 'destructive' : 'secondary'}>
                                    {status}
                                </Badge>
                                {lastSaved && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium animate-in zoom-in">
                                        <Save className="size-3" />
                                        Auto-saved at {lastSaved.toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                            <p className="text-muted-foreground text-lg mt-1">Modify your quiz questions and settings</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => navigate(-1)} className="h-11 px-6">Cancel</Button>
                        <Button
                            onClick={handleSaveAndClose}
                            disabled={saving || questions.length === 0}
                            className="h-11 px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                        >
                            {saving ? (status === 'published' ? 'Republishing...' : 'Saving...') : (status === 'published' ? 'Republish Quiz' : 'Save Changes')}
                        </Button>
                    </div>
                </div>

                {hasSubmissions && (
                    <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
                        <AlertCircle className="size-4 text-amber-500" />
                        <AlertDescription className="text-amber-700 dark:text-amber-400">
                            <strong>Note:</strong> This quiz has student submissions. Editing questions may affect the grading consistency.
                            Consider creating a new quiz instead if major changes are needed.
                        </AlertDescription>
                    </Alert>
                )}

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
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(question)} className="h-10 w-10 hover:bg-white dark:hover:bg-slate-900 shadow-sm border border-transparent hover:border-border">
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
                description="This will remove the question from your quiz. You'll need to save your changes to make this permanent."
            />
        </DashboardLayout>
    );
}
