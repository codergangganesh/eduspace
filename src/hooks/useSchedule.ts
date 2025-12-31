import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Schedule {
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
    lecturer_name?: string;
    subject_name?: string;
}

export function useSchedule() {
    const { user, role } = useAuth();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]); // To track due assignments
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSchedules = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            let query;

            // Fetch Schedules
            if (role === 'lecturer') {
                // Lecturer sees their own schedules
                query = supabase
                    .from('schedules')
                    .select(`
                        *,
                        lecturer_name,
                        subject_name,
                        courses:course_id (title, course_code)
                    `)
                    .eq('lecturer_id', user.id)
                    .order('day_of_week', { ascending: true });
            } else {
                // Student sees all schedules
                query = supabase
                    .from('schedules')
                    .select(`
                        *,
                        lecturer_name,
                        subject_name,
                        courses:course_id (title, course_code)
                    `)
                    .order('day_of_week', { ascending: true });
            }

            const { data: scheduleData, error: fetchError } = await query;

            if (fetchError) {
                console.warn('Error fetching schedules:', fetchError);
                setSchedules([]);
            } else {
                // Fetch profiles for lecturers ONLY if lecturer_name is missing in schedule
                // To be robust, we can still fetch profiles to fallback if lecturer_name is null
                const schedulesWithMissingNames = (scheduleData || []).filter((s: any) => !s.lecturer_name);
                const lecturerIds = [...new Set(schedulesWithMissingNames.map((s: any) => s.lecturer_id as string))];

                let profilesMap: Record<string, string> = {};
                if (lecturerIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .in('id', lecturerIds);

                    profiles?.forEach(p => {
                        profilesMap[p.id] = p.full_name || 'Unknown Lecturer';
                    });
                }

                const formattedSchedules = (scheduleData || []).map((s: any) => ({
                    ...s,
                    course_title: s.courses?.title,
                    course_code: s.courses?.course_code,
                    // Use stored lecturer_name, fallback to profile map
                    lecturer_name: s.lecturer_name || profilesMap[s.lecturer_id] || 'Unknown Lecturer',
                    // Use stored subject_name, fallback to course title or default
                    subject_name: s.subject_name || s.courses?.title || s.title
                }));
                setSchedules(formattedSchedules as Schedule[]);
            }

            // Fetch Assignments (for "Assignments Due" count)
            const today = new Date().toISOString();
            let assignQuery = supabase
                .from('assignments')
                .select('id, title, due_date, course_id')
                .gte('due_date', today) // Only future assignments
                .order('due_date', { ascending: true });

            if (role === 'lecturer') {
                assignQuery = assignQuery.eq('lecturer_id', user.id);
            }
            // For students, we'd ideally filter by enrolled courses, but fetching all public ones works for now

            const { data: assignData, error: assignError } = await assignQuery;

            if (!assignError) {
                setAssignments(assignData || []);
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

        // Real-time subscription for schedules
        const scheduleSub = supabase
            .channel('schedules_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => fetchSchedules())
            .subscribe();

        // Real-time subscription for assignments
        const assignSub = supabase
            .channel('assignments_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => fetchSchedules())
            .subscribe();

        return () => {
            scheduleSub.unsubscribe();
            assignSub.unsubscribe();
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
        lecturer_name: string; // Mandatory
        subject_name: string; // Mandatory
    }) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        // VALIDATION: Check for overlaps
        // Filter existing schedules for the same day
        const daySchedules = schedules.filter(s => {
            if (data.specific_date && s.specific_date) {
                return s.specific_date === data.specific_date;
            }
            // For recurring, match day of week (simplified for this context)
            // If new event is recurring, check against recurring events on same day
            // If new event is specific date, check against specific date events AND recurring events for that day of week
            if (data.specific_date) {
                const dateDay = new Date(data.specific_date).getDay();
                // Match recurring events on this day OR specific date match
                return (s.is_recurring && s.day_of_week === dateDay) || s.specific_date === data.specific_date;
            }
            // If new event is recurring
            if (data.is_recurring) {
                return s.is_recurring && s.day_of_week === data.day_of_week;
            }
            return false;
        });

        // Check time overlap
        const hasOverlap = daySchedules.some(s => {
            // Parse times "HH:MM:SS" or "HH:MM"
            const start1 = data.start_time;
            const end1 = data.end_time;
            const start2 = s.start_time;
            const end2 = s.end_time;

            return (start1 < end2 && end1 > start2);
        });

        if (hasOverlap) {
            return { success: false, error: 'A schedule already exists for this time slot.' };
        }

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
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .slice(0, 5);
    };

    return {
        schedules,
        assignments, // Export assignments
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
