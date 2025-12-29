import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Assignment {
    id: string;
    title: string;
    description: string | null;
    course_name: string | null;
    due_date: string | null;
    status: 'pending' | 'completed' | 'submitted';
    student_id: string;
    created_at: string;
    updated_at: string;
}

interface AssignmentStats {
    total: number;
    completed: number;
    pending: number;
}

export function useAssignments() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Fetch assignments
        const fetchAssignments = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('assignments')
                    .select('*')
                    .eq('student_id', user.id)
                    .order('due_date', { ascending: true });

                if (fetchError) {
                    // If table doesn't exist or RLS blocks access, just use empty array
                    console.warn('Error fetching assignments:', fetchError);
                    setAssignments([]);
                } else {
                    setAssignments(data || []);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching assignments:', err);
                // Don't set error state, just use empty array
                setAssignments([]);
                setError(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();

        // Set up real-time subscription
        const subscription = supabase
            .channel('assignments_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignments',
                    filter: `student_id=eq.${user.id}`,
                },
                () => {
                    fetchAssignments();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    const stats: AssignmentStats = {
        total: assignments.length,
        completed: assignments.filter((a) => a.status === 'completed').length,
        pending: assignments.filter((a) => a.status === 'pending' || a.status === 'submitted').length,
    };

    return { assignments, stats, loading, error };
}
