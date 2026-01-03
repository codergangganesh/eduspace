import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PendingRequest {
    id: string;
    class_id: string;
    lecturer_id: string;
    student_id: string | null;
    student_email: string;
    status: 'pending' | 'accepted' | 'rejected';
    sent_at: string;
    responded_at: string | null;
    classes: {
        course_code: string;
        class_name: string | null;
        semester: string | null;
        academic_year: string | null;
        lecturer_name: string | null;
        lecturer_department: string | null;
    };
}

export function useRealtimeAccessRequests() {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingRequests = useCallback(async () => {
        if (!user?.email) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
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
                .eq('student_email', user.email)
                .eq('status', 'pending')
                .order('sent_at', { ascending: false });

            if (error) throw error;

            setPendingRequests(data || []);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.email]);

    useEffect(() => {
        fetchPendingRequests();

        if (!user?.email) return;

        const subscription = supabase
            .channel(`access_requests_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'access_requests',
                    filter: `student_email=eq.${user.email}`,
                },
                async (payload) => {
                    const newRequest = payload.new as any;
                    
                    if (newRequest.status === 'pending') {
                        const { data: classData } = await supabase
                            .from('classes')
                            .select('course_code, class_name, semester, academic_year, lecturer_name, lecturer_department')
                            .eq('id', newRequest.class_id)
                            .single();

                        const fullRequest: PendingRequest = {
                            ...newRequest,
                            classes: classData || {
                                course_code: 'Unknown',
                                class_name: null,
                                semester: null,
                                academic_year: null,
                                lecturer_name: null,
                                lecturer_department: null
                            }
                        };

                        setPendingRequests(prev => [fullRequest, ...prev]);

                        toast('New Class Invitation', {
                            description: `You've been invited to join ${classData?.course_code || 'a class'}`,
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'access_requests',
                    filter: `student_email=eq.${user.email}`,
                },
                (payload) => {
                    const updatedRequest = payload.new as any;
                    
                    if (updatedRequest.status !== 'pending') {
                        setPendingRequests(prev => 
                            prev.filter(r => r.id !== updatedRequest.id)
                        );
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'access_requests',
                    filter: `student_email=eq.${user.email}`,
                },
                (payload) => {
                    const deletedRequest = payload.old as any;
                    setPendingRequests(prev => 
                        prev.filter(r => r.id !== deletedRequest.id)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user?.id, user?.email, fetchPendingRequests]);

    return {
        pendingRequests,
        loading,
        refetch: fetchPendingRequests,
        pendingCount: pendingRequests.length,
    };
}
