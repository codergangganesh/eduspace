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
            toast.error('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    }, [user, classId]);

    // React to changes
    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);


    const createQuiz = async (quizData: Partial<Quiz>) => {
        try {
            const { data, error } = await supabase
                .from('quizzes')
                .insert([quizData])
                .select()
                .single();

            if (error) throw error;
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
        try {
            const { error } = await supabase
                .from('quizzes')
                .update({ status })
                .eq('id', quizId);

            if (error) throw error;
            toast.success(`Quiz ${status === 'published' ? 'published' : 'closed'} successfully`);
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
