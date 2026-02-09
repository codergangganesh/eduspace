import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useStudentQuizzes(selectedClassId?: string) {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolledClasses, setEnrolledClasses] = useState<{ id: string, class_name: string, course_code: string }[]>([]);
    const [enrolledClassIds, setEnrolledClassIds] = useState<string[]>([]); // Keep this for real-time subscriptions

    // Use ref to track active channels for cleanup
    const channelsRef = useRef<RealtimeChannel[]>([]);

    const fetchEnrolledClasses = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            // Get student email for fallback matching
            const studentEmail = user.email || '';
            const emailFilter = studentEmail ? `,email.ilike.${studentEmail}` : '';

            // Get enrolled class IDs first
            const { data: enrollments, error: enrollmentError } = await supabase
                .from('class_students')
                .select('class_id')
                .or(`student_id.eq.${user.id}${emailFilter}`);

            if (enrollmentError) {
                console.error('Error fetching enrollments:', enrollmentError);
                setLoading(false);
                return;
            }

            const classIds = enrollments?.map(e => e.class_id).filter(Boolean) as string[] || [];
            setEnrolledClassIds(classIds); // Update the internal list of IDs

            if (classIds.length === 0) {
                setEnrolledClasses([]);
                setLoading(false);
                return;
            }

            // Fetch class details
            const { data: classesData, error: classesError } = await supabase
                .from('classes')
                .select('id, class_name, course_code')
                .in('id', classIds);

            if (classesError) {
                console.error('Error fetching class details:', classesError);
                setLoading(false);
                return;
            }

            setEnrolledClasses(classesData || []);

        } catch (error) {
            console.error('Error in fetchEnrolledClasses:', error);
            setLoading(false);
        }
    }, [user]);

    const fetchStudentQuizzes = useCallback(async (overrideClassId?: string) => {
        const targetClassId = overrideClassId || selectedClassId;
        if (!user) return;
        if (!targetClassId) {
            setQuizzes([]);
            setLoading(false);
            return;
        }

        try {
            console.log(`[useStudentQuizzes] Fetching quizzes for class: ${targetClassId}`);
            setLoading(true);

            // 2. Fetch published quizzes for THIS class only - BASIC INFO ONLY
            const { data: quizzesData, error } = await supabase
                .from('quizzes')
                .select('*')
                .eq('class_id', targetClassId)
                .in('status', ['published', 'closed'])
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[useStudentQuizzes] Error fetching quizzes data:', error.message || error);
                throw error;
            }

            console.log(`[useStudentQuizzes] Found ${quizzesData?.length || 0} quizzes for class ${targetClassId}`);

            if (!quizzesData || quizzesData.length === 0) {
                setQuizzes([]);
                setLoading(false);
                return;
            }

            // Fetch Related Data Separately to avoid RLS join issues
            // Fetch Class Details
            const classIds = [...new Set(quizzesData.map(q => q.class_id))];
            const { data: classesData } = await supabase
                .from('classes')
                .select('id, class_name, course_code')
                .in('id', classIds);

            const classMap = new Map(classesData?.map(c => [c.id, c]) || []);

            // Fetch Question Counts
            const quizIds = quizzesData.map(q => q.id);
            const { data: questionCounts } = await supabase
                .from('quiz_questions')
                .select('quiz_id')
                .in('quiz_id', quizIds);

            // Calculate counts manually since we just got IDs
            const questionCountMap = new Map<string, number>();
            if (questionCounts) {
                questionCounts.forEach((q: { quiz_id: string }) => {
                    questionCountMap.set(q.quiz_id, (questionCountMap.get(q.quiz_id) || 0) + 1);
                });
            }


            // 3. Fetch Instructor Profiles separately (to avoid join failures)
            const instructorIds = [...new Set(quizzesData?.map(q => q.created_by).filter(Boolean))];
            let instructorMap: Record<string, any> = {};

            if (instructorIds.length > 0) {
                const { data: instructors } = await supabase
                    .from('profiles')
                    .select('user_id, full_name, avatar_url')
                    .in('user_id', instructorIds);

                if (instructors) {
                    instructorMap = instructors.reduce((acc, curr) => ({
                        ...acc,
                        [curr.user_id]: curr
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
                const instructor = instructorMap[q.created_by] || null;
                const relatedClass = classMap.get(q.class_id);

                return {
                    ...q,
                    classes: relatedClass ? {
                        class_name: relatedClass.class_name,
                        course_code: relatedClass.course_code
                    } : null,
                    _count: {
                        questions: questionCountMap.get(q.id) || 0
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
    }, [user, selectedClassId]);

    // Initial fetch of classes
    useEffect(() => {
        fetchEnrolledClasses();
    }, [fetchEnrolledClasses]);

    // Fetch quizzes when selectedClassId changes
    useEffect(() => {
        if (selectedClassId) {
            setQuizzes([]); // Clear stale data immediately
            setLoading(true); // Trigger loading state immediately
            fetchStudentQuizzes(); // Fetch new data
        } else {
            setQuizzes([]);
            // Ensure loading is false if no class is selected
            setLoading(false);
        }
    }, [selectedClassId, fetchStudentQuizzes]);

    const refreshQuizzes = useCallback(() => {
        fetchStudentQuizzes();
    }, [fetchStudentQuizzes]);

    // Real-time subscriptions - needing selectedClassId to be passed in from component potentially?
    // Actually, we can subscribe to changes for the *selected* class if we moved state up, 
    // OR just subscribe to all enrolled classes and selectively refresh.
    // Ideally, the hook should know the selected class. 
    // Let's change the hook signature to accept `selectedClassId`.


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
                    const oldRecord = payload.old as any;

                    if (payload.eventType === 'DELETE') {
                        // For deletes, we might not know the class_id easily without querying, 
                        // but we should refresh if the deleted quiz was in our list or just refresh to be safe.
                        // Since we can't check class_id on DELETE payloads easily (unless replica identity is full),
                        // we'll optimistically refresh if we have a selected class.
                        console.log('Quiz deleted, refreshing...', payload);
                        fetchStudentQuizzes();
                    } else if (newRecord?.class_id && enrolledClassIds.includes(newRecord.class_id)) {
                        // Filter for INSERT/UPDATE: Only refresh if the affected quiz belongs to an enrolled class
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
        enrolledClasses,
        fetchStudentQuizzes
    };
}
