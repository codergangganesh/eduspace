import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InvitationUpdate {
    id: string;
    class_id: string;
    student_email: string;
    status: 'pending' | 'accepted' | 'rejected';
    sent_at: string;
}

export function useRealtimeInvitations(onNewInvitation?: (invitation: InvitationUpdate) => void) {
    const { user } = useAuth();
    const [invitations, setInvitations] = useState<InvitationUpdate[]>([]);

    useEffect(() => {
        if (!user?.email) return;

        // Set up real-time subscription for access_requests
        const channel = supabase
            .channel(`invitations_${user.email}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'access_requests',
                    filter: `student_email=eq.${user.email}`
                },
                async (payload) => {
                    console.log('New invitation received:', payload);

                    const newInvitation = payload.new as InvitationUpdate;

                    // Fetch class details
                    const { data: classData } = await supabase
                        .from('classes')
                        .select('course_code, class_name, lecturer_name')
                        .eq('id', newInvitation.class_id)
                        .single();

                    // Show toast notification
                    if (classData) {
                        toast.info(
                            `New Class Invitation`,
                            {
                                description: `${classData.lecturer_name || 'A lecturer'} has invited you to join ${classData.course_code}${classData.class_name ? ` - ${classData.class_name}` : ''}`,
                                duration: 5000
                            }
                        );
                    }

                    setInvitations(prev => [newInvitation, ...prev]);

                    if (onNewInvitation) {
                        onNewInvitation(newInvitation);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'access_requests',
                    filter: `student_email=eq.${user.email}`
                },
                (payload) => {
                    console.log('Invitation updated:', payload);

                    const updatedInvitation = payload.new as InvitationUpdate;

                    setInvitations(prev =>
                        prev.map(inv =>
                            inv.id === updatedInvitation.id ? updatedInvitation : inv
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.email, onNewInvitation]);

    return { invitations };
}
