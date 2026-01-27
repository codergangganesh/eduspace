import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ClassAssignment {
    id: string;
    class_id: string;
    subject_id: string | null;
    subject_name?: string;
    topic: string | null;
    title: string;
    description: string | null;
    due_date: string | null;
    attachment_url: string | null;
    attachment_name: string | null;
    status: 'active' | 'closed';
    created_at: string;
    updated_at: string;
    submission_count?: number;
    total_students?: number;
}

export interface CreateClassAssignmentDTO {
    title: string;
    description: string;
    subject_id: string;
    topic?: string;
    due_date: Date;
    attachment_url: string;
    attachment_name: string;
}

export function useClassAssignments(classId: string | null) {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchAssignments = useCallback(async () => {
        if (!classId || !user) {
            setAssignments([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Fetch assignments for the class
            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('assignments')
                .select('*')
                .eq('class_id', classId)
                .order('created_at', { ascending: false });

            if (assignmentsError) {
                console.error('Error fetching assignments:', assignmentsError);
                throw assignmentsError;
            }

            console.log('Fetched assignments:', assignmentsData);

            // Get total students in class
            const { count: totalStudents } = await supabase
                .from('class_students')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', classId);

            // Fetch submission counts and subject names for each assignment
            const assignmentsWithStats = await Promise.all(
                (assignmentsData || []).map(async (assignment) => {
                    const { count: submissionCount } = await supabase
                        .from('assignment_submissions')
                        .select('*', { count: 'exact', head: true })
                        .eq('assignment_id', assignment.id);

                    // Fetch subject name if subject_id exists
                    let subjectName = null;
                    if (assignment.subject_id) {
                        const { data: subjectData } = await supabase
                            .from('subjects')
                            .select('name')
                            .eq('id', assignment.subject_id)
                            .single();
                        subjectName = subjectData?.name || null;
                    }

                    return {
                        ...assignment,
                        subject_name: subjectName,
                        submission_count: submissionCount || 0,
                        total_students: totalStudents || 0,
                    };
                })
            );

            console.log('Assignments with stats:', assignmentsWithStats);
            setAssignments(assignmentsWithStats);
            setError(null);
        } catch (err) {
            console.error('Error fetching class assignments:', err);
            setError(err as Error);
            toast.error('Failed to load assignments');
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [classId, user]);

    useEffect(() => {
        fetchAssignments();

        if (!classId || !user) return;

        // Real-time subscription for assignments
        const assignmentsSubscription = supabase
            .channel(`assignments_${classId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignments',
                    filter: `class_id=eq.${classId}`,
                },
                () => {
                    fetchAssignments();
                }
            )
            .subscribe();

        // Real-time subscription for assignment_submissions
        // This ensures submission counts update instantly as students submit
        const submissionsSubscription = supabase
            .channel(`submissions_${classId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignment_submissions',
                },
                async (payload) => {
                    // Check if this submission is for an assignment in this class
                    if (payload.new && 'assignment_id' in payload.new) {
                        const assignmentId = payload.new.assignment_id;
                        const isRelevant = assignments.some(a => a.id === assignmentId);

                        if (isRelevant) {
                            // Refetch to update submission counts
                            fetchAssignments();
                        }
                    } else {
                        // For DELETE events, refetch to be safe
                        fetchAssignments();
                    }
                }
            )
            .subscribe();

        return () => {
            assignmentsSubscription.unsubscribe();
            submissionsSubscription.unsubscribe();
        };
    }, [classId, user, fetchAssignments]);

    const createAssignment = async (data: CreateClassAssignmentDTO) => {
        if (!user || !classId) throw new Error('User not authenticated or class not selected');

        try {
            // Insert assignment
            const { data: newAssignment, error: assignmentError } = await supabase
                .from('assignments')
                .insert({
                    lecturer_id: user.id,
                    class_id: classId,
                    subject_id: data.subject_id,
                    topic: data.topic || null,
                    title: data.title,
                    description: data.description,
                    due_date: data.due_date.toISOString(),
                    attachment_url: data.attachment_url,
                    attachment_name: data.attachment_name,
                    status: 'active', // Changed from 'published' to 'active'
                })
                .select()
                .single();

            if (assignmentError) {
                console.error('Assignment creation error:', assignmentError);
                throw assignmentError;
            }

            // Get enrolled students who have accepted the class
            const { data: enrolledStudents, error: studentsError } = await supabase
                .from('class_students')
                .select('student_id')
                .eq('class_id', classId);

            if (!studentsError && enrolledStudents && enrolledStudents.length > 0) {
                // Filter students who have accepted the class
                const { data: acceptedRequests } = await supabase
                    .from('access_requests')
                    .select('student_id')
                    .eq('class_id', classId)
                    .eq('status', 'accepted');

                const acceptedStudentIds = acceptedRequests?.map(r => r.student_id).filter(id => id !== null) || [];

                if (acceptedStudentIds.length > 0) {
                    // Use notification service for consistent handling and preference checking
                    const { notifyNewAssignment } = await import('@/lib/notificationService');
                    await notifyNewAssignment(
                        acceptedStudentIds,
                        data.title,
                        newAssignment.id,
                        user.id,
                        classId,
                        data.due_date.toISOString()
                    );
                }
            }

            toast.success('Assignment created successfully!');
            await fetchAssignments();
            return { success: true };
        } catch (error: any) {
            console.error('Error creating assignment:', error);
            const errorMessage = error.message || 'Failed to create assignment';
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const updateAssignment = async (id: string, data: Partial<CreateClassAssignmentDTO>) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const updates: any = {
                title: data.title,
                description: data.description,
                subject_id: data.subject_id,
                topic: data.topic,
                due_date: data.due_date?.toISOString(),
                attachment_url: data.attachment_url,
                attachment_name: data.attachment_name,
                updated_at: new Date().toISOString(),
            };

            // Remove undefined keys
            Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

            const { error } = await supabase
                .from('assignments')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Send update notifications to enrolled students
            const { data: assignment } = await supabase
                .from('assignments')
                .select('title, class_id')
                .eq('id', id)
                .single();

            if (assignment && assignment.class_id) {
                const { data: enrolledStudents } = await supabase
                    .from('class_students')
                    .select('student_id')
                    .eq('class_id', assignment.class_id);

                if (enrolledStudents && enrolledStudents.length > 0) {
                    const { data: acceptedRequests } = await supabase
                        .from('access_requests')
                        .select('student_id')
                        .eq('class_id', assignment.class_id)
                        .eq('status', 'accepted');

                    const acceptedStudentIds = acceptedRequests?.map(r => r.student_id).filter(id => id !== null) || [];

                    if (acceptedStudentIds.length > 0) {
                        // Build update details based on what changed
                        let updateDetails = 'Assignment has been updated';
                        if (data.title) updateDetails = 'Title updated';
                        else if (data.due_date) updateDetails = `Due date changed to ${data.due_date.toLocaleDateString()}`;
                        else if (data.description) updateDetails = 'Description updated';

                        // Use notification service for consistent handling
                        const { notifyAssignmentUpdated } = await import('@/lib/notificationService');
                        await notifyAssignmentUpdated(
                            acceptedStudentIds,
                            assignment.title,
                            id,
                            updateDetails,
                            user.id,
                            assignment.class_id
                        );
                    }
                }
            }

            toast.success('Assignment updated successfully!');
            await fetchAssignments();
            return { success: true };
        } catch (error: any) {
            console.error('Error updating assignment:', error);
            toast.error(error.message || 'Failed to update assignment');
            return { success: false, error: error.message };
        }
    };

    const deleteAssignment = async (id: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { error } = await supabase
                .from('assignments')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Assignment deleted successfully');
            await fetchAssignments();
        } catch (error: any) {
            console.error('Error deleting assignment:', error);
            toast.error('Failed to delete assignment');
            throw error;
        }
    };

    const updateAssignmentStatus = async (id: string, status: 'active' | 'closed') => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { error } = await supabase
                .from('assignments')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Assignment ${status === 'closed' ? 'closed' : 'activated'} successfully`);
            await fetchAssignments();
        } catch (error: any) {
            console.error('Error updating assignment status:', error);
            toast.error('Failed to update assignment status');
            throw error;
        }
    };

    return {
        assignments,
        loading,
        error,
        createAssignment,
        updateAssignment,
        deleteAssignment,
        updateAssignmentStatus,
        refreshAssignments: fetchAssignments,
    };
}
