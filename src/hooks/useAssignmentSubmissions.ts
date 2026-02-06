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

            // 2. Fetch all submissions for this assignment using secure RPC
            const { data: submitted, error: submissionsError } = await supabase
                .rpc('get_assignment_submissions_for_lecturer', { p_assignment_id: assignmentId });

            if (submissionsError) throw submissionsError;

            // 2.5 Fetch profile images
            const studentIds = (students || []).map(s => s.student_id);
            let profileMap: Record<string, string> = {};

            if (studentIds.length > 0) {
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
            }

            // 3. Merge data
            const combinedData: AssignmentSubmissionDetail[] = (students || []).map(student => {
                const submission = submitted?.find(s => s.student_id === student.student_id);

                return {
                    student_id: student.student_id || student.id,
                    student_name: student.student_name,
                    register_number: student.register_number || 'N/A',
                    email: student.email,
                    status: submission ? (submission.status as any) : 'pending',
                    submitted_at: submission?.submitted_at || submission?.created_at,
                    file_url: submission?.attachment_url,
                    file_name: submission?.attachment_name,
                    file_type: submission?.file_type,
                    file_size: submission?.file_size,
                    submission_id: submission?.id,
                    submission_text: submission?.submission_text,
                    grade: submission?.grade,
                    feedback: submission?.feedback,
                    profile_image: profileMap[student.student_id] || null
                };
            });

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
                () => fetchData()
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
