import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
    sendInvitationsToClass,
    sendInvitationToStudent,
    resendInvitationToStudent,
    resendInvitationsToAll,
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
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);

    // Fetch access requests based on user role
    const fetchAccessRequests = useCallback(async () => {
        if (!user) return;

        try {
            if (role === 'lecturer') {
                // Lecturers see all requests they've sent
                const { data, error: fetchError } = await supabase
                    .from('access_requests')
                    .select('*')
                    .eq('lecturer_id', user.id)
                    .order('sent_at', { ascending: false });

                if (fetchError) throw fetchError;
                setAccessRequests(data || []);
            } else if (role === 'student') {
                // Students see requests sent to them
                const { data: { user: authUser } } = await supabase.auth.getUser();
                const userEmail = authUser?.email;

                if (userEmail) {
                    const { data, error: fetchError } = await supabase
                        .from('access_requests')
                        .select('*')
                        .eq('student_email', userEmail)
                        .order('sent_at', { ascending: false });

                    if (fetchError) throw fetchError;
                    setAccessRequests(data || []);
                }
            }
        } catch (err) {
            console.error('Error fetching access requests:', err);
            setError(err as Error);
        }
    }, [user, role]);

    // Set up real-time subscriptions
    useEffect(() => {
        if (!user) return;

        // Initial fetch
        fetchAccessRequests();

        let subscription;

        if (role === 'lecturer') {
            // Subscribe to changes in requests sent by this lecturer
            subscription = supabase
                .channel(`access_requests_lecturer_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'access_requests',
                        filter: `lecturer_id=eq.${user.id}`
                    },
                    () => {
                        fetchAccessRequests();
                    }
                )
                .subscribe();
        } else if (role === 'student') {
            // Subscribe to changes in requests sent to this student
            // Note: We can't filter by email directly in realtime, so we fetch and filter
            subscription = supabase
                .channel(`access_requests_student_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'access_requests'
                    },
                    async (payload) => {
                        // Check if this change is relevant to the current student
                        const { data: { user: authUser } } = await supabase.auth.getUser();
                        const userEmail = authUser?.email;

                        if (payload.new && 'student_email' in payload.new) {
                            if (payload.new.student_email === userEmail) {
                                fetchAccessRequests();
                            }
                        } else {
                            // For DELETE events, refetch to be safe
                            fetchAccessRequests();
                        }
                    }
                )
                .subscribe();
        }

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [user, role, fetchAccessRequests]);

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

    const resendAccessRequest = async (classId: string, studentEmail: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            setLoading(true);
            const result = await resendInvitationToStudent(classId, studentEmail);
            return result;
        } catch (err) {
            console.error('Error resending access request:', err);
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resendAccessRequestToAll = async (classId: string): Promise<InvitationResult> => {
        if (!user) throw new Error('User not authenticated');

        try {
            setLoading(true);
            const result = await resendInvitationsToAll(classId);
            return result;
        } catch (err) {
            console.error('Error resending access requests to all:', err);
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        accessRequests,
        sendAccessRequestToAll,
        sendAccessRequest,
        resendAccessRequest,
        resendAccessRequestToAll,
        getAccessRequests,
        getMyAccessRequests,
        respondToAccessRequest,
        refetchAccessRequests: fetchAccessRequests,
    };
}
