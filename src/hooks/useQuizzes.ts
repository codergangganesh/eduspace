import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz, QuizQuestion } from '@/types/quiz';
import { toast } from 'sonner';
import { notifyQuizPublished } from '@/lib/notificationService';
import { createRegisteredMap } from '@/lib/cacheRegistry';

// ── Module-level cache ───────────────────────────────────────────────────────
const quizzesCache = createRegisteredMap<string, Quiz[]>();

function getLecturerQuizCacheKey(userId?: string, classId?: string) {
    if (!userId || !classId) return null;
    return `${userId}_${classId}`;
}

export function useQuizzes(classId?: string) {
    const { user } = useAuth();
    const cacheKey = getLecturerQuizCacheKey(user?.id, classId);
    const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
        if (cacheKey && quizzesCache.has(cacheKey)) {
            return quizzesCache.get(cacheKey) || [];
        }
        return [];
    });
    const [loading, setLoading] = useState(() => {
        return cacheKey ? !quizzesCache.has(cacheKey) : false;
    });

    // Update state synchronously if classId changes and we have cached data
    useEffect(() => {
        if (!cacheKey) {
            setQuizzes([]);
            setLoading(false);
        } else if (quizzesCache.has(cacheKey)) {
            setQuizzes(quizzesCache.get(cacheKey) || []);
            setLoading(false);
        } else {
            setQuizzes([]);
            setLoading(true);
        }
    }, [cacheKey]);

    const fetchQuizzes = useCallback(async (silentRefresh = false) => {
        if (!user || !classId) {
            setLoading(false);
            return;
        }
        try {
            if (!cacheKey) {
                setQuizzes([]);
                setLoading(false);
                return;
            }

            if (!silentRefresh && !quizzesCache.has(cacheKey)) {
                setLoading(true);
            }
            const { data, error } = await supabase
                .from('quizzes')
                .select(`
                    *,
                    classes(class_name, course_code),
                    quiz_questions(count),
                    quiz_submissions(count)
                `)
                .eq('class_id', classId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform count to number
            const transformedQuizzes = data.map(q => ({
                ...q,
                _count: {
                    questions: q.quiz_questions?.[0]?.count || 0,
                    submissions: q.quiz_submissions?.[0]?.count || 0
                }
            }));

            setQuizzes(transformedQuizzes as unknown as Quiz[]);
            quizzesCache.set(cacheKey, transformedQuizzes as unknown as Quiz[]);
        } catch (error: any) {
            console.error('Error fetching quizzes:', JSON.stringify(error, null, 2));
            toast.error(`Error loading quizzes: ${error.message || 'Unknown error'}`);
            if (cacheKey && !quizzesCache.has(cacheKey)) {
                setQuizzes([]);
            }
        } finally {
            setLoading(false);
        }
    }, [cacheKey, user, classId]);

    // React to changes
    useEffect(() => {
        fetchQuizzes();

        if (!classId) return;

        const channel = supabase
            .channel(`quizzes_channel_${classId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'quizzes',
                    filter: `class_id=eq.${classId}`
                },
                () => {
                    fetchQuizzes(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchQuizzes, classId]);


    const createQuiz = async (quizData: Partial<Quiz>) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { data, error } = await supabase
                .from('quizzes')
                .insert([quizData as any])
                .select()
                .single();

            if (error) throw error;

            // Send notifications to enrolled students if quiz is published
            if (quizData.status === 'published' && quizData.class_id) {
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
