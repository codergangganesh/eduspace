import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AssignmentSubmissionDetail {
    student_id: string;
    student_name: string;
    register_number: string;
    email: string;
    status: 'submitted' | 'pending' | 'graded' | 'returned';
    submitted_at?: string;
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    submission_id?: string;
    submission_text?: string;
    grade?: string | null;
    feedback?: string | null;
    profile_image?: string | null;
}

export function useAssignmentSubmissions(assignmentId: string, classId: string) {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<AssignmentSubmissionDetail[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user || !assignmentId || !classId) return;

        try {
            setLoading(true);

            // 1. Fetch all students in the class
            const { data: students, error: studentsError } = await supabase
                .from('class_students')
                .select('*')
                .eq('class_id', classId);

            if (studentsError) throw studentsError;

            // 2. Fetch all submissions for this assignment directly (RLS protected)
            const { data: submitted, error: submissionsError } = await supabase
                .from('assignment_submissions')
                .select('*')
                .eq('assignment_id', assignmentId);

            if (submissionsError) {
                console.error('Error fetching submissions directly:', submissionsError);
                throw submissionsError;
            }

            // 2.5 Fetch student emails for matching
            const allSubmissionUserIds = [...new Set((submitted || []).map(s => s.student_id).filter(Boolean))] as string[];
            let submittedEmailsMap: Record<string, string> = {}; // user_id -> email

            if (allSubmissionUserIds.length > 0) {
                const { data: profileEmails, error: emailsError } = await supabase
                    .from('profiles')
                    .select('user_id, email')
                    .in('user_id', allSubmissionUserIds);

                if (profileEmails) {
                    profileEmails.forEach(p => {
                        if (p.email) submittedEmailsMap[p.user_id] = p.email;
                    });
                }
            }

            console.log('[useAssignmentSubmissions] Fetched submissions:', submitted?.length, submitted);
            console.log('[useAssignmentSubmissions] Total students:', students?.length);

            // 2.6 Fetch profile images
            const studentIds = (students || []).map(s => s.student_id);
            let profileMap: Record<string, string> = {};

            if (studentIds.length > 0) {
                const { data: profiles, error: profilesError } = await supabase
                    .from('student_profiles')
                    .select('user_id, profile_image')
                    .in('user_id', studentIds);

                if (!profilesError && profiles) {
                    profiles.forEach(p => {
                        if (p.profile_image) {
                            profileMap[p.user_id] = p.profile_image;
                        }
                    });
                }
            }

            // 3. Merge data
            const combinedData: AssignmentSubmissionDetail[] = (students || []).map(student => {
                const submission = submitted?.find(s => {
                    // 1. Match by student_id (UUID)
                    const matchId = (s.student_id && student.student_id && s.student_id === student.student_id);

                    // 2. Match by register_number
                    const matchReg = (s.register_number && student.register_number &&
                        s.register_number.trim().toLowerCase() === student.register_number.trim().toLowerCase());

                    // 3. Match by email (ultimate fallback)
                    const submittedEmail = s.student_id ? submittedEmailsMap[s.student_id] : null;
                    const matchEmail = (submittedEmail && student.email &&
                        submittedEmail.trim().toLowerCase() === student.email.trim().toLowerCase());

                    return matchId || matchReg || matchEmail;
                });

                return {
                    student_id: student.student_id || student.id,
                    student_name: student.student_name,
                    register_number: student.register_number || 'N/A',
                    email: student.email,
                    status: submission ? (submission.status as any) : 'pending',
                    submitted_at: submission?.submitted_at,
                    file_url: submission?.attachment_url,
                    file_name: submission?.attachment_name,
                    file_type: submission?.file_type,
                    file_size: submission?.file_size,
                    submission_id: submission?.id,
                    submission_text: submission?.submission_text,
                    grade: submission?.grade?.toString(),
                    feedback: submission?.feedback,
                    profile_image: profileMap[student.student_id] || null
                };
            });

            // Do not filter here, return all students to allow filtering in the UI
            console.log('[useAssignmentSubmissions] Total students:', combinedData.length);
            console.log('[useAssignmentSubmissions] Students with submissions:', submitted.length);

            setSubmissions(combinedData);

        } catch (error) {
            console.error('Error fetching assignment details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || !assignmentId || !classId) {
            setLoading(false);
            return;
        }

        fetchData();

        // Subscribe to changes
        const subscription = supabase
            .channel(`assignment_subs_${assignmentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignment_submissions',
                    filter: `assignment_id=eq.${assignmentId}`
                },
                (payload) => {
                    console.log('[useAssignmentSubmissions] Submission change detected:', payload.eventType, payload);
                    if (payload.eventType === 'DELETE') {
                        console.log('[useAssignmentSubmissions] Submission deleted, refreshing list...');
                    }
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, assignmentId, classId]);

    return {
        submissions,
        loading,
        refetch: fetchData
    };
}
