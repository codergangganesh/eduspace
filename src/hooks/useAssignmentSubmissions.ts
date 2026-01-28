import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AssignmentSubmissionDetail {
    student_id: string;
    student_name: string;
    register_number: string;
    email: string;
    status: 'submitted' | 'pending';
    submitted_at?: string;
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    submission_id?: string;
    grade?: string | null;
    feedback?: string | null;
}

export function useAssignmentSubmissions(assignmentId: string, classId: string) {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<AssignmentSubmissionDetail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !assignmentId || !classId) {
            setLoading(false);
            return;
        }

        fetchData();

        // Subscribe to new submissions
        const submissionSubscription = supabase
            .channel(`assignment_detail_submissions_${assignmentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignment_submissions',
                    filter: `assignment_id=eq.${assignmentId}`
                },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        // Subscribe to student changes (e.g. new student joins class)
        const studentSubscription = supabase
            .channel(`assignment_detail_students_${classId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'class_students',
                    filter: `class_id=eq.${classId}`
                },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            submissionSubscription.unsubscribe();
            studentSubscription.unsubscribe();
        };
    }, [user, assignmentId, classId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch all students in the class
            const { data: students, error: studentsError } = await supabase
                .from('class_students')
                .select('*')
                .eq('class_id', classId);

            if (studentsError) throw studentsError;

            // 2. Fetch all submissions for this assignment
            const { data: submitted, error: submissionsError } = await supabase
                .from('assignment_submissions')
                .select('*')
                .eq('assignment_id', assignmentId);

            if (submissionsError) throw submissionsError;

            // 3. Merge data
            const combinedData: AssignmentSubmissionDetail[] = (students || []).map(student => {
                const submission = submitted?.find(s => s.student_id === student.student_id);

                return {
                    student_id: student.student_id || student.id,
                    student_name: student.student_name,
                    register_number: student.register_number,
                    email: student.email,
                    status: submission ? 'submitted' : 'pending',
                    submitted_at: submission?.submitted_at || submission?.created_at,
                    file_url: submission?.attachment_url, // Use attachment_url from database
                    file_name: submission?.attachment_name,
                    file_type: submission?.file_type,
                    file_size: submission?.file_size,
                    submission_id: submission?.id,
                    grade: submission?.grade,
                    feedback: submission?.feedback
                };
            });

            // Sort: Pending first, then by name
            combinedData.sort((a, b) => {
                if (a.status === b.status) {
                    return a.student_name.localeCompare(b.student_name);
                }
                return a.status === 'pending' ? -1 : 1;
            });

            setSubmissions(combinedData);

        } catch (error) {
            console.error('Error fetching assignment details:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        submissions,
        loading,
        refetch: fetchData
    };
}
