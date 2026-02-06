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
            const studentEmail = user.email || '';

            // 1. Get enrolled classes
            // Only use email filter if email exists
            const emailFilter = studentEmail ? `,email.ilike.${studentEmail}` : '';
            const { data: enrollments, error: enrollmentError } = await supabase
                .from('class_students')
                .select('class_id')
                .or(`student_id.eq.${user.id}${emailFilter}`);

            if (enrollmentError) {
                console.error('Error fetching enrollments:', enrollmentError);
                // Don't throw here, just treat as empty to avoid crashing if table permissions are weird
            }

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
                    classes (class_name, course_code)
                `)
                .in('class_id', classIds)
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching quizzes data:', error.message || error);
                throw error;
            }

            // For each quiz, fetch the student's submission status
            const processedQuizzes = await Promise.all(quizzesData?.map(async (q) => {
                // Fetch student's active submission for this quiz
                const { data: submissionData } = await supabase
                    .from('quiz_submissions')
                    .select('id, status, total_obtained, is_archived, quiz_version, submitted_at, time_taken, started_at')
                    .eq('quiz_id', q.id)
                    .eq('student_id', user.id)
                    .eq('is_archived', false)
                    .maybeSingle();

                // DEBUG LOGGING - Temporary
                console.log(`[DEBUG] Quiz '${q.title}' (ID: ${q.id}):`, {
                    hasSubmission: !!submissionData,
                    submissionStatus: submissionData?.status,
                    isArchived: submissionData?.is_archived,
                    quizVersion: submissionData?.quiz_version,
                    currentQuizVersion: q.version
                });

                return {
                    ...q,
                    my_submission: submissionData || null,
                };
            }) || []);

            setQuizzes(processedQuizzes);

        } catch (error: any) {
            console.error('Error fetching student quizzes:', error.message || JSON.stringify(error, null, 2));
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
