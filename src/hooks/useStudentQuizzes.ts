import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useStudentQuizzes() {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolledClassIds, setEnrolledClassIds] = useState<string[]>([]);

    // Use ref to track active channels for cleanup
    const channelsRef = useRef<RealtimeChannel[]>([]);

    const fetchStudentQuizzes = useCallback(async () => {
        if (!user) return;
        try {
            // Keep loading state only on initial load if we don't have data yet
            setLoading(prev => prev && quizzes.length === 0);

            // Get student email for fallback matching
            const studentEmail = user.email;

            // 1. Get enrolled classes
            const { data: enrollments } = await supabase
                .from('class_students')
                .select('class_id')
                .or(`student_id.eq.${user.id},email.ilike.${studentEmail}`);

            const classIds = enrollments?.map(e => e.class_id).filter(Boolean) as string[] || [];

            // Update state only if changed to prevent unnecessary re-subscriptions
            setEnrolledClassIds(prev => {
                if (JSON.stringify(prev.sort()) === JSON.stringify(classIds.sort())) {
                    return prev;
                }
                return classIds;
            });

            if (classIds.length === 0) {
                setQuizzes([]);
                setLoading(false);
                return;
            }

            // 2. Fetch published quizzes for these classes
            const { data: quizzesData, error } = await supabase
                .from('quizzes')
                .select(`
                    *,
                    classes (class_name, course_code),
                    quiz_submissions (id, status, total_obtained, is_archived, quiz_version, created_at, submitted_at, student_id),
                    questions: quiz_questions (count)
                `)
                .in('class_id', classIds)
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching quizzes data:', error);
                throw error;
            }

            // Check if student attempted (filter out archived submissions)
            const processedQuizzes = quizzesData?.map(q => {
                const activeSubmission = q.quiz_submissions?.find((s: any) => s.student_id === user.id && !s.is_archived);
                return {
                    ...q,
                    my_submission: activeSubmission || null,
                    questions_count: q.questions?.[0]?.count || 0
                };
            }) || [];

            setQuizzes(processedQuizzes);

        } catch (error) {
            console.error('Error fetching student quizzes:', error);
        } finally {
            setLoading(false);
        }
    }, [user]); // Removed unnecessary dependencies

    // Initial fetch
    useEffect(() => {
        fetchStudentQuizzes();
    }, [fetchStudentQuizzes]);

    // Real-time subscriptions
    useEffect(() => {
        if (!user || enrolledClassIds.length === 0) return;

        // Cleanup previous subscriptions
        channelsRef.current.forEach(channel => supabase.removeChannel(channel));
        channelsRef.current = [];

        console.log('Setting up quiz subscriptions for classes:', enrolledClassIds);

        // 1. Subscribe to QUIZZES for enrolled classes
        // We create one channel for all quiz updates in these classes? 
        // Or separate channels? 
        // Supabase channel filtering by `in` is not standard.
        // Optimization: Use one global channel for quizzes, but filter inside the callback using the Ref to the latest class IDs.
        // Wait, the requirement says "Subscribe only to quizzes for their enrolled classes".
        // The most robust way without creating N channels is to subscribe to 'quizzes' and filter.
        // However, if we MUST stick to "subscribe only", we'd need per-class or per-row. 
        // Given Supabase limitations, Global + Filter is standard. 
        // BUT, we can make it cleaner.

        const channel = supabase
            .channel(`student_quizzes_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'quizzes'
                    // We can't easily filter by class_id list here
                },
                (payload) => {
                    const newRecord = payload.new as any;
                    // Filter: Only refresh if the affected quiz belongs to an enrolled class
                    if (newRecord?.class_id && enrolledClassIds.includes(newRecord.class_id)) {
                        console.log('Relevant quiz update detected:', payload);
                        fetchStudentQuizzes();
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'quiz_submissions',
                    filter: `student_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Submission update detected:', payload);
                    fetchStudentQuizzes();
                }
            )
            .subscribe();

        channelsRef.current.push(channel);

        return () => {
            channelsRef.current.forEach(channel => supabase.removeChannel(channel));
            channelsRef.current = [];
        };
    }, [user, enrolledClassIds, fetchStudentQuizzes]);

    return {
        quizzes,
        loading,
        refreshQuizzes: fetchStudentQuizzes
    };
}
