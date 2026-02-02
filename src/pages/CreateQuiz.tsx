import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2, Edit2 } from 'lucide-react';
import { useQuizzes } from '@/hooks/useQuizzes';
import { QuestionEditor } from '@/components/quizzes/QuestionEditor';
import { QuizQuestion } from '@/types/quiz';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';

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
    const [quizId, setQuizId] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const calculateTotalMarks = () => {
        return questions.reduce((sum, q) => sum + q.marks, 0);
    };

    // Load draft from DB on mount
    useEffect(() => {
        const loadDraft = async () => {
            if (!classId || !user) return;
            try {
                // Check for latest draft
                const { data: draft } = await supabase
                    .from('quizzes')
                    .select('*, questions:quiz_questions(*)')
                    .eq('class_id', classId)
                    .eq('created_by', user.id)
                    .eq('status', 'draft')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (draft) {
                    setQuizId(draft.id);
                    setTitle(draft.title);
                    setDescription(draft.description || '');
                    setPassPercentage(draft.pass_percentage);

                    // Sort questions by order_index
                    const sortedQuestions = (draft.questions || []).sort((a: any, b: any) => a.order_index - b.order_index);
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
                    // toast removed
                }
            } catch (error) {
                console.error('Error loading draft:', error);
            }
        };

        loadDraft();
    }, [classId, user]);

    // Unified Auto-Save Logic
    useEffect(() => {
        // Skip initial mount or empty state if nothing to save
        if (!title && questions.length === 0 && !description) return;

        const saveEverything = async () => {
            if (!classId || !user) return;
            // Don't set global saving state to avoid flickering UI, just background save

            try {
                // 1. Upsert Quiz Metadata
                const quizData = {
                    class_id: classId,
                    title: title || 'Untitled Quiz',
                    description,
                    total_marks: calculateTotalMarks(),
                    pass_percentage: passPercentage,
                    status: 'draft',
                    created_by: user.id,
                    ...(quizId ? { id: quizId } : {})
                };

                const { data: savedQuiz, error: quizError } = await supabase
                    .from('quizzes')
                    .upsert(quizData)
                    .select()
                    .single();

                if (quizError) throw quizError;

                let currentQuizId = quizId;
                if (!currentQuizId) {
                    setQuizId(savedQuiz.id);
                    currentQuizId = savedQuiz.id;
                }

                // 2. Sync Questions
                if (currentQuizId) {
                    // Delete existing to handle re-ordering/deletions cleanly
                    await supabase.from('quiz_questions').delete().eq('quiz_id', currentQuizId);

                    if (questions.length > 0) {
                        const questionsToInsert = questions.map((q, index) => ({
                            quiz_id: currentQuizId,
                            question_text: q.question_text,
                            question_type: q.question_type,
                            marks: q.marks,
                            options: q.options,
                            correct_answer: q.correct_answer,
                            order_index: index
                        }));
                        const { error: qError } = await supabase.from('quiz_questions').insert(questionsToInsert);
                        if (qError) throw qError;
                    }
                }

                setLastSaved(new Date());

            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        };

        const timeoutId = setTimeout(saveEverything, 1000); // 1s debounce
        return () => clearTimeout(timeoutId);
    }, [title, description, passPercentage, questions, classId, user, quizId]);

    // Cleanup local storage if it existed (migration)
    useEffect(() => {
        localStorage.removeItem(`quiz_draft_${classId}`);
    }, [classId]);

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
                    created_by: user?.id,
                    ...(quizId ? { id: quizId } : {})
                })
                .select()
                .single();

            if (quizError) throw quizError;

            // Ensure questions are up to date
            await supabase.from('quiz_questions').delete().eq('quiz_id', quizData.id);

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

            toast.success('Quiz created and published successfully!');
            localStorage.removeItem(`quiz_draft_${classId}`);
            navigate(`/lecturer/quizzes/${classId}`);

        } catch (error) {
            console.error('Error saving quiz:', error);
            toast.error('Failed to create quiz');
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto pb-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">Create New Quiz</h1>
                            {lastSaved && (
                                <span className="text-xs text-muted-foreground flex items-center animate-in fade-in">
                                    <Save className="size-3 mr-1" />
                                    Saved {lastSaved.toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground">Add questions and set passing criteria</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quiz Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Quiz Title</Label>
                                <Input
                                    placeholder="e.g., Mid-Term Physics Assessment"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <Textarea
                                    placeholder="Instructions for students..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="space-y-2 flex-1">
                                    <Label>Pass Percentage (%)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={passPercentage}
                                        onChange={(e) => setPassPercentage(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <Label>Total Marks</Label>
                                    <div className="h-10 px-3 py-2 bg-muted rounded-md border text-muted-foreground flex items-center">
                                        {calculateTotalMarks()}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
                            <Button onClick={() => setIsEditingQuestion(true)} disabled={isEditingQuestion}>
                                <Plus className="size-4 mr-2" />
                                Add Question
                            </Button>
                        </div>

                        {isEditingQuestion ? (
                            <QuestionEditor
                                question={editingQuestionId ? questions.find(q => q.id === editingQuestionId) : undefined}
                                onSave={handleSaveQuestion}
                                onCancel={() => {
                                    setIsEditingQuestion(false);
                                    setEditingQuestionId(null);
                                }}
                                questionNumber={editingQuestionId ? questions.findIndex(q => q.id === editingQuestionId) + 1 : questions.length + 1}
                            />
                        ) : null}

                        <div className="space-y-3">
                            {questions.map((question, index) => (
                                <Card key={question.id} className="relative group">
                                    <CardContent className="p-4 flex gap-4">
                                        <div className="flex flex-col items-center justify-center p-2 bg-muted rounded w-12 h-12 shrink-0">
                                            <span className="font-bold text-lg">Q{index + 1}</span>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="font-medium">{question.question_text}</p>
                                            <div className="flex gap-2 text-sm text-muted-foreground">
                                                <Badge variant="secondary">{question.marks} Marks</Badge>
                                                <span>{question.options.length} Options</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(question)}>
                                                <Edit2 className="size-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteQuestion(question.id)}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {questions.length === 0 && !isEditingQuestion && (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                                <p>No questions added yet. Click "Add Question" to start.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-4 mt-8">
                        <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button onClick={handlePublishQuiz} disabled={saving || questions.length === 0} className="w-40">
                            {saving ? 'Publishing...' : 'Publish Quiz'}
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
