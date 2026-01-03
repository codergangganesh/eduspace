import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
    sendInvitationsToClass,
    sendInvitationToStudent,
    acceptInvitation,
    rejectInvitation,
    getStudentPendingInvitations,
    InvitationResult
} from '@/lib/classInvitationService';

export interface AccessRequest {
    id: string;
    class_id: string;
    lecturer_id: string;
    student_id: string | null;
    student_email: string;
    status: 'pending' | 'accepted' | 'rejected';
    sent_at: string;
    responded_at: string | null;
    invitation_email_sent?: boolean;
    invitation_email_sent_at?: string | null;
}

export function useAccessRequests() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const sendAccessRequestToAll = async (classId: string): Promise<InvitationResult> => {
        if (!user) throw new Error('User not authenticated');

        try {
            setLoading(true);
            const result = await sendInvitationsToClass(classId);
            return result;
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
            const result = await sendInvitationToStudent(classId, studentEmail);
            return result;
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

            const { success, data } = await getStudentPendingInvitations(userEmail);

            if (success && data) {
                console.log('Found access requests:', data.length);
                return data;
            }

            return [];
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

            if (status === 'accepted') {
                const result = await acceptInvitation(requestId, user.id);
                if (!result.success) {
                    throw new Error(result.error || 'Failed to accept invitation');
                }
            } else {
                const result = await rejectInvitation(requestId, user.id);
                if (!result.success) {
                    throw new Error(result.error || 'Failed to reject invitation');
                }
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
        getMyAccessRequests,
        respondToAccessRequest,
    };
}
