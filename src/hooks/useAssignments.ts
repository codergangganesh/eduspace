import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEnrolledClassIds } from '@/lib/studentUtils';

export interface Assignment {
    id: string;
    course_id: string;
    class_id?: string;
    subject_id?: string;
    lecturer_id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    due_date: string | null;
    max_points: number;
    attachment_url: string | null;
    attachment_name: string | null;
    status: 'draft' | 'published' | 'closed' | 'active' | 'completed';
    created_at: string;
    updated_at: string;
    course_title?: string;
    course_code?: string;
    class_name?: string;
    subject_name?: string;
    lecturer_name?: string;
    instructor_avatar?: string;
    studentStatus?: 'pending' | 'submitted' | 'graded' | 'overdue';
    submission?: AssignmentSubmission;
    grade?: number;
    earnedPoints?: number;
}

export interface AssignmentSubmission {
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
    averageGrade?: number;
}

export function useAssignments(selectedClassId?: string) {
    const { user, role } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [enrolledClasses, setEnrolledClasses] = useState<{ id: string, class_name: string, course_code: string }[]>([]);

    const fetchEnrolledClasses = useCallback(async () => {
        if (!user || role !== 'student') return;

        try {
            // Use the centralized helper to get robust enrollment IDs
            const classIds = await getEnrolledClassIds(user.id);

            if (classIds.length === 0) {
                setEnrolledClasses([]);
                return;
            }

            const { data: classesData, error: classesError } = await supabase
                .from('classes')
                .select('id, class_name, course_code')
                .in('id', classIds);

            if (classesError) {
                console.error('Error fetching class details:', classesError);
                return;
            }

            setEnrolledClasses(classesData || []);

        } catch (error) {
            console.error('Error in fetchEnrolledClasses:', error);
        }
    }, [user, role]);

    // Initialize enrolled classes for student
    useEffect(() => {
        if (role === 'student') {
            fetchEnrolledClasses();
        }
    }, [fetchEnrolledClasses, role]);

    // silentRefresh: when true, don't trigger loading state (for real-time updates)
    const fetchAssignments = useCallback(async (silentRefresh = false) => {
        if (!user) return;

        try {
            // Only show loading spinner on initial load, not on real-time updates
            if (!silentRefresh && isInitialLoad) {
                setLoading(true);
            }

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
                // Student View
                let targetClassIds: string[] = [];

                if (selectedClassId) {
                    targetClassIds = [selectedClassId];
                } else {
                    // If no class selected, fetch for all enrolled classes (Dashboard view)
                    targetClassIds = await getEnrolledClassIds(user.id);
                }

                if (targetClassIds.length === 0) {
                    data = [];
                    mySubmissions = [];
                } else {
                    // Fetch assignments for the target classes
                    const { data: classAssignments, error: classError } = await supabase
                        .from('assignments')
                        .select('*')
                        .in('class_id', targetClassIds)
                        .or('status.eq.published,status.eq.active,status.eq.completed,status.eq.closed')
                        .order('due_date', { ascending: true });

                    if (classError) {
                        console.error('Error fetching class assignments:', classError);
                        throw classError;
                    }
                    data = classAssignments || [];
                }

                if (data.length > 0) {
                    // Fetch related data for enrichment
                    // Get unique subject IDs and lecturer IDs
                    const subjectIds = [...new Set(data.map(a => a.subject_id).filter(Boolean))];
                    const lecturerIds = [...new Set(data.map(a => a.lecturer_id).filter(Boolean))];

                    // Fetch subject names
                    let subjectMap = new Map<string, string>();
                    if (subjectIds.length > 0) {
                        const { data: subjects } = await supabase
                            .from('subjects')
                            .select('id, name')
                            .in('id', subjectIds);
                        subjectMap = new Map(subjects?.map(s => [s.id, s.name]) || []);
                    }

                    // Fetch lecturer names and avatars
                    let lecturerMap = new Map<string, { name: string, avatar: string | null }>();
                    if (lecturerIds.length > 0) {
                        const { data: lecturers } = await supabase
                            .from('profiles')
                            .select('user_id, full_name, avatar_url')
                            .in('user_id', lecturerIds);

                        lecturers?.forEach(l => {
                            lecturerMap.set(l.user_id, {
                                name: l.full_name,
                                avatar: l.avatar_url
                            });
                        });
                    }

                    // Enrich assignments with class, subject, and lecturer details
                    data = data.map(a => {
                        const lecturer = lecturerMap.get(a.lecturer_id);
                        const clsInfo = enrolledClasses.find(c => c.id === a.class_id);
                        return {
                            ...a,
                            course_code: clsInfo?.course_code || a.course_code,
                            class_name: clsInfo?.class_name || "Assignment",
                            subject_name: subjectMap.get(a.subject_id) || null,
                            lecturer_name: lecturer?.name || null,
                            instructor_avatar: lecturer?.avatar || null,
                        };
                    });

                    // Fetch My Submissions for these assignments
                    const assignmentIds = data.map(a => a.id);
                    if (assignmentIds.length > 0) {
                        const { data: submissionsData, error: subError } = await supabase
                            .from('assignment_submissions')
                            .select('*')
                            .eq('student_id', user.id)
                            .in('assignment_id', assignmentIds);

                        if (subError) throw subError;
                        mySubmissions = (submissionsData || []) as any[];
                        console.log('[useAssignments] Fetched student submissions:', mySubmissions.length, mySubmissions);
                    }
                }
            }

            const formattedAssignments = data.map((a: any) => {
                const base = {
                    ...a,
                    course_title: a.courses?.title,
                    course_code: a.courses?.course_code,
                    lecturer_name: a.lecturer_name || a.lecturer?.full_name,
                    instructor_avatar: a.instructor_avatar || a.lecturer?.avatar_url,
                };

                if (role === 'student') {
                    // Compute status for student
                    const submission = mySubmissions.find(s => s.assignment_id === a.id);
                    let studentStatus = 'pending';
                    let grade = undefined;
                    let earnedPoints = undefined;

                    console.log(`[useAssignments] Processing assignment "${a.title}":`, {
                        assignmentId: a.id,
                        hasSubmission: !!submission,
                        submissionStatus: submission?.status,
                        submissionId: submission?.id
                    });

                    if (submission) {
                        studentStatus = submission.status === 'graded' ? 'graded' : 'submitted';
                        if (submission.grade !== null) {
                            grade = submission.grade;
                            earnedPoints = submission.grade;
                        }
                        console.log(`[useAssignments] Assignment "${a.title}" status: ${studentStatus}`);
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

            console.log('[useAssignments] Final formatted assignments:', formattedAssignments.length);
            setAssignments(formattedAssignments);
            setError(null);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            // Don't clear assignments on error during refresh - keep existing data
            if (isInitialLoad) {
                setAssignments([]);
            }
            setError(null);
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, [user, role, isInitialLoad, selectedClassId]);

    // Fetch assignments when selected class changes (for student)
    useEffect(() => {
        if (role === 'student') {
            if (selectedClassId) {
                setAssignments([]); // Clear stale data
                setLoading(true); // Trigger loading
                fetchAssignments();
            } else {
                fetchAssignments();
            }
        } else if (role === 'lecturer') {
            // Lecturer login handles initial load
            fetchAssignments();
        }
    }, [fetchAssignments, role, selectedClassId]);

    // Helper function to merge new assignments with existing ones, preserving submission states
    const mergeAssignmentsWithSubmissions = useCallback((
        newAssignments: Assignment[],
        existingAssignments: Assignment[]
    ): Assignment[] => {
        const mergedMap = new Map<string, Assignment>();

        // Start with existing assignments (to preserve submission states)
        existingAssignments.forEach(a => {
            mergedMap.set(a.id, a);
        });

        // Merge in new/updated assignments, preserving submission data from existing
        newAssignments.forEach(newAssignment => {
            const existing = mergedMap.get(newAssignment.id);
            if (existing) {
                // Update assignment but preserve submission-related fields if they exist
                mergedMap.set(newAssignment.id, {
                    ...newAssignment,
                    studentStatus: newAssignment.studentStatus || existing.studentStatus,
                    submission: newAssignment.submission || existing.submission,
                    grade: newAssignment.grade !== undefined ? newAssignment.grade : existing.grade,
                    earnedPoints: newAssignment.earnedPoints !== undefined ? newAssignment.earnedPoints : existing.earnedPoints,
                });
            } else {
                // New assignment - add it
                mergedMap.set(newAssignment.id, newAssignment);
            }
        });

        return Array.from(mergedMap.values());
    }, []);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        if (role !== 'student') {
            // Initial fetch for non-students (lecturers view all their assignments usually)
            // or handled by the other useEffect
            fetchAssignments();
        }

        // Real-time subscription for assignments table
        const assignmentsSubscription = supabase
            .channel('assignments_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignments',
                },
                async (payload) => {
                    console.log('[useAssignments] Assignment change detected:', payload.eventType, payload);

                    if (payload.eventType === 'INSERT') {
                        // For new assignments, check if it's relevant to this user and add it
                        const newAssignment = payload.new as any;

                        if (role === 'student') {
                            // If a specific class is selected, ignore assignments from other classes
                            if (selectedClassId && newAssignment.class_id !== selectedClassId) {
                                return;
                            }

                            // Check if student is enrolled in this class
                            const enrolledClassIds = await getEnrolledClassIds(user.id);
                            if (newAssignment.class_id && enrolledClassIds.includes(newAssignment.class_id)) {
                                // Add the new assignment with pending status
                                setAssignments(prev => {
                                    // Check if already exists
                                    if (prev.some(a => a.id === newAssignment.id)) {
                                        return prev;
                                    }
                                    const enrichedAssignment: Assignment = {
                                        ...newAssignment,
                                        studentStatus: 'pending' as const,
                                        submission: undefined,
                                        grade: undefined,
                                        earnedPoints: undefined,
                                    };
                                    console.log('[useAssignments] Adding new assignment to list:', enrichedAssignment.title);
                                    return [...prev, enrichedAssignment];
                                });
                            }
                        } else {
                            // Lecturer: add if they own it
                            if (newAssignment.lecturer_id === user.id) {
                                setAssignments(prev => {
                                    if (prev.some(a => a.id === newAssignment.id)) {
                                        return prev;
                                    }
                                    return [newAssignment, ...prev];
                                });
                            }
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        // Update existing assignment without losing submission data
                        const updatedAssignment = payload.new as any;
                        setAssignments(prev => prev.map(a =>
                            a.id === updatedAssignment.id
                                ? { ...updatedAssignment, studentStatus: a.studentStatus, submission: a.submission, grade: a.grade, earnedPoints: a.earnedPoints }
                                : a
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as any).id;
                        setAssignments(prev => prev.filter(a => a.id !== deletedId));
                    }
                }
            )
            .subscribe();

        // Real-time subscription for assignment_submissions table
        // This ensures students see their submission status update instantly
        const submissionsSubscription = supabase
            .channel(`assignment_submissions_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignment_submissions',
                    filter: role === 'student' ? `student_id=eq.${user.id}` : undefined,
                },
                (payload) => {
                    console.log('[useAssignments] Submission change detected:', payload.eventType, payload);

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const submission = payload.new as AssignmentSubmission;
                        // Update only the affected assignment's submission status
                        setAssignments(prev => prev.map(a => {
                            if (a.id === submission.assignment_id) {
                                const studentStatus = submission.status === 'graded' ? 'graded' : 'submitted';
                                console.log(`[useAssignments] Updating assignment ${a.title} status to ${studentStatus}`);
                                return {
                                    ...a,
                                    studentStatus: studentStatus as 'pending' | 'submitted' | 'graded' | 'overdue',
                                    submission: submission,
                                    grade: submission.grade ?? a.grade,
                                    earnedPoints: submission.grade ?? a.earnedPoints,
                                };
                            }
                            return a;
                        }));
                    } else if (payload.eventType === 'DELETE') {
                        // Submission deleted - reset to pending status
                        const deletedSubmission = payload.old as any;
                        setAssignments(prev => prev.map(a => {
                            if (a.id === deletedSubmission.assignment_id) {
                                return {
                                    ...a,
                                    studentStatus: 'pending' as const,
                                    submission: undefined,
                                    grade: undefined,
                                    earnedPoints: undefined,
                                };
                            }
                            return a;
                        }));
                    }
                }
            )
            .subscribe();

        // Real-time subscription for access_requests (enrollment changes)
        // This ensures students see assignments from newly accepted classes immediately
        const enrollmentSubscription = role === 'student' ? supabase
            .channel(`enrollment_changes_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'access_requests',
                    filter: `student_id=eq.${user.id}`,
                },
                () => {
                    // For enrollment changes, do a full refresh to get new class assignments
                    fetchAssignments(true);
                }
            )
            .subscribe() : null;

        return () => {
            assignmentsSubscription.unsubscribe();
            submissionsSubscription.unsubscribe();
            enrollmentSubscription?.unsubscribe();
        };
    }, [user, fetchAssignments, role, mergeAssignmentsWithSubmissions]);

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

            // Send notification to student about the grade
            try {
                const { data: submission } = await supabase
                    .from('assignment_submissions')
                    .select('student_id, assignment_id')
                    .eq('id', submissionId)
                    .single();

                if (submission) {
                    const { data: assignment } = await supabase
                        .from('assignments')
                        .select('title, class_id')
                        .eq('id', submission.assignment_id)
                        .single();

                    if (assignment) {
                        const { notifyGradePosted } = await import('@/lib/notificationService');
                        await notifyGradePosted(
                            submission.student_id,
                            assignment.title,
                            grade.toString(),
                            submission.assignment_id,
                            user.id,
                            assignment.class_id
                        );
                    }
                }
            } catch (notifyErr) {
                console.error("Error sending grade notification:", notifyErr);
                // Non-blocking error
            }

            return { success: true };
        } catch (error) {
            console.error('Error grading submission:', error);
            return { success: false, error };
        }
    };

    // Delete submission (student only)
    const deleteSubmission = async (submissionId: string) => {
        if (!user) return { success: false, error: 'Not authenticated' };

        try {
            const { error } = await supabase
                .from('assignment_submissions')
                .delete()
                .eq('id', submissionId)
                .eq('student_id', user.id); // Security check

            if (error) throw error;

            const { knowledgeService } = await import('@/lib/knowledgeService');
            await knowledgeService.deleteKnowledgeNode(submissionId);

            return { success: true };
        } catch (error) {
            console.error('Error deleting submission:', error);
            return { success: false, error };
        }
    };

    // Submit assignment (student only)
    const submitAssignment = async (assignmentId: string, data: {
        submission_text?: string;
        attachment_url?: string;
        attachment_name?: string;
        file_type?: string;
        file_size?: number;
    }) => {
        if (!user || role !== 'student') return { success: false, error: 'Unauthorized' };

        try {
            // 1. Fetch assignment details and student profile
            const [assignmentResult, profileResult] = await Promise.all([
                supabase
                    .from('assignments')
                    .select('lecturer_id, title, class_id')
                    .eq('id', assignmentId)
                    .single(),
                supabase
                    .from('profiles')
                    .select('full_name, student_id') // student_id is the register number field in profiles
                    .eq('user_id', user.id)
                    .single()
            ]);

            const assignment = assignmentResult.data;
            const studentProfile = profileResult.data;

            // 2. Insert/Update submission including the snapshot fields
            console.log('[useAssignments] Upserting submission with data:', {
                assignment_id: assignmentId,
                student_id: user.id,
                attachment_url: data.attachment_url,
                attachment_name: data.attachment_name,
                file_type: data.file_type,
                file_size: data.file_size
            });

            const { data: subData, error } = await supabase
                .from('assignment_submissions')
                .upsert({
                    assignment_id: assignmentId,
                    student_id: user.id,
                    class_id: assignment?.class_id,
                    register_number: studentProfile?.student_id, // Map student_id to register_number
                    ...data,
                    submitted_at: new Date().toISOString(),
                    status: 'submitted',
                })
                .select('*')
                .single();

            if (error) throw error;

            console.log('[useAssignments] Submission saved to database:', {
                id: subData.id,
                attachment_name: subData.attachment_name,
                attachment_url: subData.attachment_url
            });

            // Manually refresh assignments to ensure UI updates immediately
            console.log('[useAssignments] Triggering manual refresh...');
            await fetchAssignments(true);
            console.log('[useAssignments] Manual refresh complete');

            // 3. Send notification to lecturer
            try {
                if (assignment && assignment.class_id) {
                    // Use notification service for consistent handling
                    const { notifyAssignmentSubmission } = await import('@/lib/notificationService');
                    await notifyAssignmentSubmission(
                        assignment.lecturer_id,
                        studentProfile?.full_name || 'A student',
                        assignment.title,
                        assignmentId,
                        assignment.class_id,
                        user.id
                    );
                }
            } catch (notifError) {
                console.warn('Failed to send submission notification:', notifError);
            }

            // Sync with Knowledge Map
            try {
                const { knowledgeService } = await import('@/lib/knowledgeService');
                await knowledgeService.upsertKnowledgeNode({
                    type: 'assignment',
                    sourceId: subData.id,
                    label: assignment?.title || 'Assignment',
                    text: assignment?.title || 'Assignment'
                });
            } catch (kmError) {
                console.warn('Failed to sync assignment with Knowledge Map:', kmError);
            }

            return { success: true };
        } catch (err: any) {
            console.error('Error submitting assignment:', err);
            return { success: false, error: err.message };
        }
    };


    // Calculate Average Grade for Students
    let averageGrade = 0;
    if (role === 'student' && assignments.length > 0) {
        let totalWeightedScore = 0;
        let count = 0;

        assignments.forEach(a => {
            const maxPoints = a.max_points || 100;
            let score = 0;
            let shouldCount = false;

            if (a.studentStatus === 'graded' && a.grade !== undefined && a.grade !== null) {
                // 1. Graded: Use actual grade (percentage)
                score = (a.grade / maxPoints) * 100;
                shouldCount = true;
            } else if (a.studentStatus === 'submitted' && a.submission) {
                // 2 & 3. Submitted (Ungraded)
                const submittedAt = new Date(a.submission.submitted_at);
                const dueDate = a.due_date ? new Date(a.due_date) : new Date();

                // Check if late (submitted after due date)
                if (a.due_date && submittedAt > dueDate) {
                    // Late penalty: 10% deduction from full score
                    score = 90;
                } else {
                    // On time: Award full base grade (100%)
                    score = 100;
                }
                shouldCount = true;
            } else if (a.studentStatus === 'overdue') {
                // 4. Overdue (Not submitted): 0%
                score = 0;
                shouldCount = true;
            }
            // Pending/Future assignments are excluded from the denominator

            if (shouldCount) {
                totalWeightedScore += score;
                count++;
            }
        });

        averageGrade = count > 0 ? Math.round(totalWeightedScore / count) : 0;
    }

    const stats: AssignmentStats & { averageGrade: number } = {
        total: assignments.length,
        completed: role === 'student'
            ? assignments.filter((a) => a.studentStatus === 'submitted' || a.studentStatus === 'graded').length
            : assignments.filter((a) => a.status === 'closed').length,
        pending: role === 'student'
            ? assignments.filter((a) => a.studentStatus === 'pending' || a.studentStatus === 'overdue').length
            : assignments.filter((a) => a.status === 'published').length,
        averageGrade
    };

    return {
        assignments,
        submissions,
        loading,
        stats,
        createAssignment,
        updateAssignment,
        deleteAssignment,
        fetchSubmissions,
        gradeSubmission,
        submitAssignment,
        deleteSubmission,
        refreshAssignments: fetchAssignments,
        enrolledClasses
    };
}
