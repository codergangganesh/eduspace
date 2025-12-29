import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Schedule {
    id: string;
    title: string;
    course_code: string | null;
    type: 'lecture' | 'lab' | 'tutorial' | 'exam';
    start_time: string;
    end_time: string;
    day_of_week: number;
    location: string | null;
    instructor: string | null;
    color: string | null;
    student_id: string;
    created_at: string;
}

export function useSchedule() {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchSchedules = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('student_id', user.id)
                    .order('day_of_week', { ascending: true });

                if (fetchError) {
                    console.warn('Error fetching schedules:', fetchError);
                    setSchedules([]);
                } else {
                    setSchedules(data || []);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching schedules:', err);
                setSchedules([]);
                setError(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();

        // Real-time subscription
        const subscription = supabase
            .channel('schedules_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'schedules',
                    filter: `student_id=eq.${user.id}`,
                },
                () => {
                    fetchSchedules();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    // Get schedules for a specific day
    const getSchedulesForDay = (dayOfWeek: number) => {
        return schedules.filter(s => s.day_of_week === dayOfWeek);
    };

    // Get upcoming schedules
    const getUpcomingSchedules = () => {
        const today = new Date().getDay();
        const currentDay = today === 0 ? 7 : today; // Convert Sunday from 0 to 7

        return schedules
            .filter(s => s.day_of_week >= currentDay)
            .slice(0, 5);
    };

    return {
        schedules,
        loading,
        error,
        getSchedulesForDay,
        getUpcomingSchedules,
    };
}
