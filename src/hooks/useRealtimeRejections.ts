import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface RejectionNotification {
    id: string;
    class_id: string;
    student_email: string;
    status: 'rejected';
    responded_at: string;
}

export function useRealtimeRejections() {
    const { user } = useAuth();
    const [rejections, setRejections] = useState<RejectionNotification[]>([]);

    useEffect(() => {
        if (!user?.id) return;

        // Set up real-time subscription for rejection events
        const channel = supabase
            .channel(`rejections_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'access_requests',
                    filter: `lecturer_id=eq.${user.id}`
                },
                async (payload) => {
                    const updated = payload.new as any;

                    // Only process rejections
                    if (updated.status === 'rejected' && payload.old.status === 'pending') {
                        console.log('Student rejected invitation:', updated);

                        // Fetch class and student details
                        const { data: classData } = await supabase
                            .from('classes')
                            .select('course_code, class_name')
                            .eq('id', updated.class_id)
                            .single();

                        const { data: studentData } = await supabase
                            .from('class_students')
                            .select('student_name')
                            .eq('class_id', updated.class_id)
                            .eq('email', updated.student_email)
                            .single();

                        const studentName = studentData?.student_name || updated.student_email;
                        const courseInfo = classData
                            ? `${classData.course_code}${classData.class_name ? ` - ${classData.class_name}` : ''}`
                            : 'your class';

                        // Show toast notification
                        toast.error(
                            'Class Invitation Rejected',
                            {
                                description: `${studentName} has declined the invitation to join ${courseInfo}`,
                                duration: 6000
                            }
                        );

                        setRejections(prev => [updated as RejectionNotification, ...prev]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    return { rejections };
}
