import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Assignment {
    id: string;
    course_id: string;
    lecturer_id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    due_date: string | null;
    max_points: number;
    attachment_url: string | null;
    attachment_name: string | null;
    status: 'draft' | 'published' | 'closed';
    created_at: string;
    updated_at: string;
    course_title?: string;
    course_code?: string;
    lecturer_name?: string;
    studentStatus?: 'pending' | 'submitted' | 'graded' | 'overdue';
    submission?: AssignmentSubmission;
    grade?: number;
    earnedPoints?: number;
}

interface AssignmentSubmission {
    id: string;
    assignment_id: string;
    student_id: string;
    submission_text: string | null;
    attachment_url: string | null;
    attachment_name: string | null;
    submitted_at: string;
    grade: number | null;
    feedback: string | null;
    graded_at: string | null;
    status: 'submitted' | 'graded' | 'returned';
    student_name?: string;
}

interface AssignmentStats {
    total: number;
    completed: number;
    pending: number;
}

export function useAssignments() {
    const { user, role } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchAssignments = useCallback(async () => {
        if (!user) return;

        try {
            let data: any[] = [];
            let mySubmissions: AssignmentSubmission[] = [];

            if (role === 'lecturer') {
                // Lecturer sees their own assignments
                const { data: assignmentsData, error: fetchError } = await supabase
                    .from('assignments')
                    .select('*')
                    .eq('lecturer_id', user.id)
                    .order('created_at', { ascending: false });

                if (fetchError) throw fetchError;
                data = assignmentsData || [];

            } else {
                // Student sees published assignments
                const { data: assignmentsData, error: fetchError } = await supabase
                    .from('assignments')
                    .select('*')
                    .eq('status', 'published')
                    .order('due_date', { ascending: true });

                if (fetchError) throw fetchError;
                data = assignmentsData || [];

                // Fetch My Submissions to determine status
                const { data: submissionsData, error: subError } = await supabase
                    .from('assignment_submissions')
                    .select('*')
                    .eq('student_id', user.id);

                if (subError) throw subError;
                mySubmissions = (submissionsData || []) as any[];
            }

            const formattedAssignments = data.map((a: any) => {
                const base = {
                    ...a,
                    course_title: a.courses?.title,
                    course_code: a.courses?.course_code,
                    lecturer_name: a.lecturer?.full_name,
                };

                if (role === 'student') {
                    // Compute status for student
                    const submission = mySubmissions.find(s => s.assignment_id === a.id);
                    let studentStatus = 'pending';
                    let grade = undefined;
                    let earnedPoints = undefined;

                    if (submission) {
                        studentStatus = submission.status === 'graded' ? 'graded' : 'submitted';
                        if (submission.grade !== null) {
                            grade = submission.grade;
                            earnedPoints = submission.grade;
                        }
                    } else if (a.due_date && new Date(a.due_date) < new Date()) {
                        studentStatus = 'overdue';
                    }

                    return {
                        ...base,
                        studentStatus,
                        submission,
                        grade,
                        earnedPoints
                    };
                }

                return base;
            });

            setAssignments(formattedAssignments);
            setError(null);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            setAssignments([]);
            setError(null); // Don't show error to user, just log it
        } finally {
            setLoading(false);
        }
    }, [user, role]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        fetchAssignments();

        // Real-time subscription
        const subscription = supabase
            .channel('assignments_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignments',
                },
                () => {
                    fetchAssignments();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, fetchAssignments]);

    // Create assignment (lecturer only)
    const createAssignment = async (data: {
        course_id: string;
        title: string;
        description?: string;
        instructions?: string;
        due_date?: string;
        max_points?: number;
        attachment_url?: string;
        attachment_name?: string;
        status?: 'draft' | 'published';
    }) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { data: newAssignment, error } = await supabase
                .from('assignments')
                .insert({
                    ...data,
                    lecturer_id: user.id,
                    status: data.status || 'draft',
                })
                .select()
                .single();

            if (error) throw error;

            await fetchAssignments();
            return { success: true, data: newAssignment };
        } catch (err: any) {
            console.error('Error creating assignment:', err);
            return { success: false, error: err.message };
        }
    };

    // Update assignment (lecturer only)
    const updateAssignment = async (id: string, data: Partial<Assignment>) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('assignments')
                .update(data)
                .eq('id', id)
                .eq('lecturer_id', user.id);

            if (error) throw error;

            await fetchAssignments();
            return { success: true };
        } catch (err: any) {
            console.error('Error updating assignment:', err);
            return { success: false, error: err.message };
        }
    };

    // Delete assignment (lecturer only)
    const deleteAssignment = async (id: string) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('assignments')
                .delete()
                .eq('id', id)
                .eq('lecturer_id', user.id);

            if (error) throw error;

            await fetchAssignments();
            return { success: true };
        } catch (err: any) {
            console.error('Error deleting assignment:', err);
            return { success: false, error: err.message };
        }
    };

    // Fetch submissions for an assignment (lecturer only)
    const fetchSubmissions = async (assignmentId: string) => {
        if (!user || role !== 'lecturer') return [];

        try {
            const { data, error } = await supabase
                .from('assignment_submissions')
                .select('*')
                .eq('assignment_id', assignmentId)
                .order('submitted_at', { ascending: false });

            if (error) throw error;

            // Fetch student names
            const submissionsWithNames = await Promise.all(
                (data || []).map(async (sub) => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('user_id', sub.student_id)
                        .single();

                    return {
                        ...sub,
                        student_name: profile?.full_name || 'Unknown Student',
                    };
                })
            );

            setSubmissions(submissionsWithNames as AssignmentSubmission[]);
            return submissionsWithNames;
        } catch (err) {
            console.error('Error fetching submissions:', err);
            return [];
        }
    };

    // Grade submission (lecturer only)
    const gradeSubmission = async (submissionId: string, grade: number, feedback?: string) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('assignment_submissions')
                .update({
                    grade,
                    feedback,
                    graded_at: new Date().toISOString(),
                    status: 'graded',
                })
                .eq('id', submissionId);

            if (error) throw error;

            return { success: true };
        } catch (err: any) {
            console.error('Error grading submission:', err);
            return { success: false, error: err.message };
        }
    };

    // Submit assignment (student only)
    const submitAssignment = async (assignmentId: string, data: {
        submission_text?: string;
        attachment_url?: string;
        attachment_name?: string;
    }) => {
        if (!user || role !== 'student') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('assignment_submissions')
                .upsert({
                    assignment_id: assignmentId,
                    student_id: user.id,
                    ...data,
                    submitted_at: new Date().toISOString(),
                    status: 'submitted',
                });

            if (error) throw error;

            return { success: true };
        } catch (err: any) {
            console.error('Error submitting assignment:', err);
            return { success: false, error: err.message };
        }
    };

    const stats: AssignmentStats = {
        total: assignments.length,
        completed: role === 'student'
            ? assignments.filter((a) => a.studentStatus === 'submitted' || a.studentStatus === 'graded').length
            : assignments.filter((a) => a.status === 'closed').length,
        pending: role === 'student'
            ? assignments.filter((a) => a.studentStatus === 'pending' || a.studentStatus === 'overdue').length
            : assignments.filter((a) => a.status === 'published').length,
    };

    return {
        assignments,
        submissions,
        stats,
        loading,
        error,
        createAssignment,
        updateAssignment,
        deleteAssignment,
        fetchSubmissions,
        gradeSubmission,
        submitAssignment,
        refreshAssignments: fetchAssignments,
    };
}
