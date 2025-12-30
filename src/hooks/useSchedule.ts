import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Schedule {
    id: string;
    course_id: string | null;
    lecturer_id: string;
    title: string;
    type: 'lecture' | 'lab' | 'tutorial' | 'exam' | 'office_hours' | 'event';
    day_of_week: number;
    start_time: string;
    end_time: string;
    location: string | null;
    is_recurring: boolean;
    specific_date: string | null;
    notes: string | null;
    color: string | null;
    created_at: string;
    updated_at: string;
    course_title?: string;
    course_code?: string;
}

export function useSchedule() {
    const { user, role } = useAuth();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSchedules = useCallback(async () => {
        if (!user) return;

        try {
            let query;
            
            if (role === 'lecturer') {
                // Lecturer sees their own schedules
                query = supabase
                    .from('schedules')
                    .select(`
                        *,
                        courses:course_id (title, course_code)
                    `)
                    .eq('lecturer_id', user.id)
                    .order('day_of_week', { ascending: true });
            } else {
                // Student sees schedules for enrolled courses
                query = supabase
                    .from('schedules')
                    .select(`
                        *,
                        courses:course_id (title, course_code)
                    `)
                    .order('day_of_week', { ascending: true });
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                console.warn('Error fetching schedules:', fetchError);
                setSchedules([]);
            } else {
                const formattedSchedules = (data || []).map((s: any) => ({
                    ...s,
                    course_title: s.courses?.title,
                    course_code: s.courses?.course_code,
                }));
                setSchedules(formattedSchedules);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching schedules:', err);
            setSchedules([]);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, [user, role]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

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
                },
                () => {
                    fetchSchedules();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, fetchSchedules]);

    // Create schedule (lecturer only)
    const createSchedule = async (data: {
        course_id?: string;
        title: string;
        type?: 'lecture' | 'lab' | 'tutorial' | 'exam' | 'office_hours' | 'event';
        day_of_week: number;
        start_time: string;
        end_time: string;
        location?: string;
        is_recurring?: boolean;
        specific_date?: string;
        notes?: string;
        color?: string;
    }) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { data: newSchedule, error } = await supabase
                .from('schedules')
                .insert({
                    ...data,
                    lecturer_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;

            await fetchSchedules();
            return { success: true, data: newSchedule };
        } catch (err: any) {
            console.error('Error creating schedule:', err);
            return { success: false, error: err.message };
        }
    };

    // Update schedule (lecturer only)
    const updateSchedule = async (id: string, data: Partial<Schedule>) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('schedules')
                .update(data)
                .eq('id', id)
                .eq('lecturer_id', user.id);

            if (error) throw error;

            await fetchSchedules();
            return { success: true };
        } catch (err: any) {
            console.error('Error updating schedule:', err);
            return { success: false, error: err.message };
        }
    };

    // Delete schedule (lecturer only)
    const deleteSchedule = async (id: string) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', id)
                .eq('lecturer_id', user.id);

            if (error) throw error;

            await fetchSchedules();
            return { success: true };
        } catch (err: any) {
            console.error('Error deleting schedule:', err);
            return { success: false, error: err.message };
        }
    };

    // Get schedules for a specific day
    const getSchedulesForDay = (dayOfWeek: number) => {
        return schedules.filter(s => s.day_of_week === dayOfWeek);
    };

    // Get upcoming schedules
    const getUpcomingSchedules = () => {
        const today = new Date().getDay();
        return schedules
            .filter(s => s.day_of_week >= today)
            .slice(0, 5);
    };

    return {
        schedules,
        loading,
        error,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        getSchedulesForDay,
        getUpcomingSchedules,
        refreshSchedules: fetchSchedules,
    };
}
