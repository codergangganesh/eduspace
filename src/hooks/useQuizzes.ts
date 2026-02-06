import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz, QuizQuestion } from '@/types/quiz';
import { toast } from 'sonner';

export function useQuizzes(classId?: string) {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQuizzes = useCallback(async () => {
        if (!user || !classId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('quizzes')
                .select(`
                    *,
                    questions:quiz_questions(count),
                    submissions:quiz_submissions(count)
                `)
                .eq('class_id', classId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform count to number
            const transformedQuizzes = data.map(q => ({
                ...q,
                _count: {
                    questions: q.questions?.[0]?.count || 0,
                    submissions: q.submissions?.[0]?.count || 0
                }
            }));

            setQuizzes(transformedQuizzes as unknown as Quiz[]);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            // Don't show error toast for empty results - UI will show empty state
            setQuizzes([]);
        } finally {
            setLoading(false);
        }
    }, [user, classId]);

    // React to changes
    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);


    const createQuiz = async (quizData: Partial<Quiz>) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { data, error } = await supabase
                .from('quizzes')
                .insert([quizData])
                .select()
                .single();

            if (error) throw error;

            // Send notifications to enrolled students if quiz is published
            if (quizData.status === 'published' && quizData.class_id) {
                const { notifyQuizPublished } = await import('@/lib/notificationService');
                await notifyQuizPublished(
                    data.id,
                    quizData.class_id,
                    quizData.title || 'New Quiz',
                    user.id
                );
            }

            toast.success('Quiz created successfully');
            fetchQuizzes();
            return data;
        } catch (error) {
            console.error('Error creating quiz:', error);
            toast.error('Failed to create quiz');
            throw error;
        }
    };

    const updateQuizStatus = async (quizId: string, status: 'published' | 'closed') => {
        if (!user) return;

        try {
            // If publishing, we want to increment the version to allow re-attempts
            let versionUpdate = {};
            if (status === 'published') {
                const { data: currentQuiz } = await supabase.from('quizzes').select('version').eq('id', quizId).single();
                const newVersion = (currentQuiz?.version || 1) + 1;
                versionUpdate = { version: newVersion };
            }

            const { error } = await supabase
                .from('quizzes')
                .update({ status, ...versionUpdate })
                .eq('id', quizId);

            if (error) throw error;

            // Send notifications when publishing
            if (status === 'published') {
                const quiz = quizzes.find(q => q.id === quizId);
                if (quiz?.class_id) {
                    const { notifyQuizPublished } = await import('@/lib/notificationService');
                    await notifyQuizPublished(
                        quizId,
                        quiz.class_id,
                        quiz.title || 'Quiz',
                        user.id
                    );
                }
            }

            toast.success(`Quiz ${status === 'published' ? 'published (v' + (versionUpdate as any).version + ')' : 'closed'} successfully`);
            fetchQuizzes();
        } catch (error) {
            console.error('Error updating quiz status:', error);
            toast.error('Failed to update quiz status');
        }
    };

    const deleteQuiz = async (quizId: string) => {
        try {
            const { error } = await supabase
                .from('quizzes')
                .delete()
                .eq('id', quizId);

            if (error) throw error;
            toast.success('Quiz deleted');
            fetchQuizzes();
        } catch (error) {
            console.error('Error deleting quiz:', error);
            toast.error('Failed to delete quiz');
        }
    };

    return {
        quizzes,
        loading,
        fetchQuizzes,
        createQuiz,
        updateQuizStatus,
        deleteQuiz
    };
}
