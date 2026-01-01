import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AccessRequest {
    id: string;
    class_id: string;
    lecturer_id: string;
    student_id: string | null;
    student_email: string;
    status: 'pending' | 'accepted' | 'rejected';
    sent_at: string;
    responded_at: string | null;
}

export function useAccessRequests() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const sendAccessRequestToAll = async (classId: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            setLoading(true);

            // Get all students in the class
            const { data: students, error: studentsError } = await supabase
                .from('class_students')
                .select('id, student_id, email, student_name')
                .eq('class_id', classId);

            if (studentsError) throw studentsError;

            if (!students || students.length === 0) {
                return {
                    success: true,
                    sent: 0,
                    skipped: 0,
                    message: 'No students found in this class',
                };
            }

            // Get class details for notification
            const { data: classData } = await supabase
                .from('classes')
                .select('course_code, class_name, lecturer_name')
                .eq('id', classId)
                .single();

            let sent = 0;
            let skipped = 0;

            for (const student of students) {
                // Check if access request already exists for this email
                const { data: existing } = await supabase
                    .from('access_requests')
                    .select('id')
                    .eq('class_id', classId)
                    .eq('student_email', student.email)
                    .maybeSingle();

                if (existing) {
                    skipped++;
                    continue;
                }

                // Create access request
                const { data: newRequest, error: requestError } = await supabase
                    .from('access_requests')
                    .insert({
                        class_id: classId,
                        lecturer_id: user.id,
                        student_id: student.student_id, // Can be null
                        student_email: student.email,
                        status: 'pending',
                    })
                    .select()
                    .single();

                if (requestError) {
                    console.error('Error creating access request:', requestError);
                    skipped++;
                    continue;
                }

                // Create notification - if student_id exists, send to them
                if (student.student_id) {
                    await supabase.from('notifications').insert({
                        user_id: student.student_id,
                        title: 'Class Access Request',
                        message: `${classData?.lecturer_name || 'A lecturer'} has invited you to join ${classData?.course_code || 'a class'}${classData?.class_name ? ` - ${classData.class_name}` : ''}`,
                        type: 'access_request',
                        related_id: newRequest.id,
                        is_read: false,
                    });
                }

                sent++;
            }

            return {
                success: true,
                sent,
                skipped,
                message: `Sent ${sent} access requests, skipped ${skipped} (already sent)`,
            };
        } catch (err) {
            console.error('Error sending access requests:', err);
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const sendAccessRequest = async (classId: string, studentEmail: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            setLoading(true);

            // Get student from class_students by email
            const { data: student } = await supabase
                .from('class_students')
                .select('id, student_id, email, student_name')
                .eq('class_id', classId)
                .eq('email', studentEmail)
                .single();

            if (!student) {
                throw new Error('Student not found in this class');
            }

            // Check if access request already exists
            const { data: existing } = await supabase
                .from('access_requests')
                .select('id')
                .eq('class_id', classId)
                .eq('student_email', studentEmail)
                .maybeSingle();

            if (existing) {
                throw new Error('Access request already sent to this student');
            }

            // Get class details
            const { data: classData } = await supabase
                .from('classes')
                .select('course_code, class_name, lecturer_name')
                .eq('id', classId)
                .single();

            // Create access request
            const { data: newRequest, error: requestError } = await supabase
                .from('access_requests')
                .insert({
                    class_id: classId,
                    lecturer_id: user.id,
                    student_id: student.student_id, // Can be null
                    student_email: studentEmail,
                    status: 'pending',
                })
                .select()
                .single();

            if (requestError) throw requestError;

            // Create notification if student has registered
            if (student.student_id) {
                await supabase.from('notifications').insert({
                    user_id: student.student_id,
                    title: 'Class Access Request',
                    message: `${classData?.lecturer_name || 'A lecturer'} has invited you to join ${classData?.course_code || 'a class'}${classData?.class_name ? ` - ${classData.class_name}` : ''}`,
                    type: 'access_request',
                    related_id: newRequest.id,
                    is_read: false,
                });
            }

            return { success: true };
        } catch (err) {
            console.error('Error sending access request:', err);
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getAccessRequests = async (classId: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { data, error: fetchError } = await supabase
                .from('access_requests')
                .select('*')
                .eq('class_id', classId)
                .order('sent_at', { ascending: false });

            if (fetchError) throw fetchError;

            return data as AccessRequest[];
        } catch (err) {
            console.error('Error fetching access requests:', err);
            setError(err as Error);
            throw err;
        }
    };

    const getMyAccessRequests = async () => {
        if (!user) throw new Error('User not authenticated');

        try {
            // Get user's email from auth
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const userEmail = authUser?.email;

            if (!userEmail) {
                console.error('User email not found');
                return [];
            }

            console.log('Fetching access requests for email:', userEmail);

            // Get requests by email - this will match students imported via Excel
            const { data, error: fetchError } = await supabase
                .from('access_requests')
                .select(`
                    *,
                    classes (
                        course_code,
                        class_name,
                        semester,
                        academic_year,
                        lecturer_name,
                        lecturer_department
                    )
                `)
                .eq('student_email', userEmail)
                .eq('status', 'pending')
                .order('sent_at', { ascending: false });

            if (fetchError) {
                console.error('Error fetching access requests:', fetchError);
                throw fetchError;
            }

            console.log('Found access requests:', data?.length || 0);
            return data || [];
        } catch (err) {
            console.error('Error in getMyAccessRequests:', err);
            setError(err as Error);
            return [];
        }
    };

    const respondToAccessRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
        if (!user) throw new Error('User not authenticated');

        try {
            setLoading(true);

            // Get the request details first
            const { data: request, error: requestFetchError } = await supabase
                .from('access_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (requestFetchError) throw requestFetchError;
            if (!request) throw new Error('Access request not found');

            console.log('Responding to request:', request);

            // Update access request
            const { error: updateError } = await supabase
                .from('access_requests')
                .update({
                    status,
                    student_id: user.id, // Link the student
                    responded_at: new Date().toISOString(),
                })
                .eq('id', requestId);

            if (updateError) {
                console.error('Error updating access request:', updateError);
                throw updateError;
            }

            // If accepted, update class_students to link the student
            if (status === 'accepted') {
                const { error: linkError } = await supabase
                    .from('class_students')
                    .update({ student_id: user.id })
                    .eq('class_id', request.class_id)
                    .eq('email', request.student_email);

                if (linkError) {
                    console.error('Error linking student:', linkError);
                    // Don't throw - the request was still accepted
                }
            }

            // Mark notification as read if it exists
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('related_id', requestId)
                .eq('type', 'access_request');

            console.log('Successfully responded to request');
            return { success: true };
        } catch (err) {
            console.error('Error responding to access request:', err);
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        sendAccessRequestToAll,
        sendAccessRequest,
        getAccessRequests,
        getMyAccessRequests,
        respondToAccessRequest,
    };
}
