import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AccessRequest {
    id: string;
    class_id: string;
    lecturer_id: string;
    student_id: string;
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
                .select('student_id, email, student_name')
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
                // Check if access request already exists
                const { data: existing } = await supabase
                    .from('access_requests')
                    .select('id')
                    .eq('class_id', classId)
                    .eq('student_id', student.student_id)
                    .single();

                if (existing) {
                    skipped++;
                    continue;
                }

                // Create access request
                const { error: requestError } = await supabase
                    .from('access_requests')
                    .insert({
                        class_id: classId,
                        lecturer_id: user.id,
                        student_id: student.student_id,
                        student_email: student.email,
                        status: 'pending',
                    });

                if (requestError) {
                    console.error('Error creating access request:', requestError);
                    skipped++;
                    continue;
                }

                // Create notification for student
                await supabase.from('notifications').insert({
                    recipient_id: student.student_id,
                    sender_id: user.id,
                    class_id: classId,
                    title: 'Class Access Request',
                    message: `${classData?.lecturer_name || 'A lecturer'} has invited you to join ${classData?.course_code || 'a class'}${classData?.class_name ? ` - ${classData.class_name}` : ''}`,
                    type: 'access_request',
                    is_read: false,
                });

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

    const sendAccessRequest = async (classId: string, studentId: string, studentEmail: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            setLoading(true);

            // Check if access request already exists
            const { data: existing } = await supabase
                .from('access_requests')
                .select('id')
                .eq('class_id', classId)
                .eq('student_id', studentId)
                .single();

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
            const { error: requestError } = await supabase
                .from('access_requests')
                .insert({
                    class_id: classId,
                    lecturer_id: user.id,
                    student_id: studentId,
                    student_email: studentEmail,
                    status: 'pending',
                });

            if (requestError) throw requestError;

            // Create notification
            await supabase.from('notifications').insert({
                recipient_id: studentId,
                sender_id: user.id,
                class_id: classId,
                title: 'Class Access Request',
                message: `${classData?.lecturer_name || 'A lecturer'} has invited you to join ${classData?.course_code || 'a class'}${classData?.class_name ? ` - ${classData.class_name}` : ''}`,
                type: 'access_request',
                is_read: false,
            });

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

    const respondToAccessRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
        if (!user) throw new Error('User not authenticated');

        try {
            setLoading(true);

            const { error: updateError } = await supabase
                .from('access_requests')
                .update({
                    status,
                    responded_at: new Date().toISOString(),
                })
                .eq('id', requestId)
                .eq('student_id', user.id);

            if (updateError) throw updateError;

            // Mark notification as read
            const { data: request } = await supabase
                .from('access_requests')
                .select('class_id')
                .eq('id', requestId)
                .single();

            if (request) {
                await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('recipient_id', user.id)
                    .eq('class_id', request.class_id)
                    .eq('type', 'access_request');
            }

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
        respondToAccessRequest,
    };
}
