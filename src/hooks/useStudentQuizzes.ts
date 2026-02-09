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
            // Robust Approach: Fetch raw data first, then fetch related profiles separately
            const { data: quizzesData, error } = await supabase
                .from('quizzes')
                .select(`
                    *,
                    classes (
                        class_name,
                        course_code
                    ),
                    quiz_questions (count)
                `)
                .in('class_id', classIds)
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching quizzes data:', error.message || error);
                throw error;
            }

            // 3. Fetch Instructor Profiles separately (to avoid join failures)
            const instructorIds = [...new Set(quizzesData?.map(q => q.created_by).filter(Boolean))];
            let instructorMap: Record<string, any> = {};

            if (instructorIds.length > 0) {
                const { data: instructors } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', instructorIds);

                if (instructors) {
                    instructorMap = instructors.reduce((acc, curr) => ({
                        ...acc,
                        [curr.id]: curr
                    }), {});
                }
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

                // Transform the count to a number and extract instructor details
                const quizData = q as any;
                const questionCount = quizData.quiz_questions?.[0]?.count || 0;
                const instructor = instructorMap[q.created_by] || null;

                return {
                    ...q,
                    _count: {
                        questions: questionCount
                    },
                    instructor: instructor ? {
                        full_name: instructor.full_name,
                        avatar_url: instructor.avatar_url
                    } : null,
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
