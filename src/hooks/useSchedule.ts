import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEnrolledClassIds } from '@/lib/studentUtils';
import { toast } from 'sonner';

export interface Schedule {
    id: string;
    course_id?: string | null;
    class_id: string | null;
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
    lecturer_name?: string;
    subject_name?: string;
    class_name?: string;
    course_code?: string;
}

export function useSchedule(classId?: string) {
    const { user, role } = useAuth();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]); // Kept for compatibility if needed, but primary focus is schedules
    const [loading, setLoading] = useState(true);
    // Cache enrolled class IDs for real-time filtering updates
    const enrolledClassIdsRef = useRef<string[]>([]);

    const fetchSchedules = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);

        try {
            let query = supabase
                .from('schedules')
                .select(`
                    *,
                    classes:class_id (class_name, course_code)
                `);

            if (role === 'lecturer') {
                // If a specific class is selected, filter by it
                if (classId) {
                    query = query.eq('class_id', classId);
                } else {
                    // Otherwise show all schedules created by this lecturer
                    query = query.eq('lecturer_id', user.id);
                }
            } else if (role === 'student') {
                // Students see schedules for ALL their enrolled classes
                const enrolledClassIds = await getEnrolledClassIds(user.id);
                enrolledClassIdsRef.current = enrolledClassIds;

                if (enrolledClassIds.length === 0) {
                    setSchedules([]);
                    setLoading(false);
                    return;
                }

                query = query.in('class_id', enrolledClassIds);
            }

            const { data, error } = await query.order('start_time', { ascending: true });

            if (error) throw error;

            // Transform data to ensure display fields are present
            const formattedData: Schedule[] = (data || []).map((item: any) => ({
                ...item,
                class_name: item.classes?.class_name,
                course_code: item.classes?.course_code,
                // Ensure legacy fields don't break if present
                lecturer_name: item.lecturer_name || user?.user_metadata?.full_name || 'Unknown',
                subject_name: item.subject_name || item.title
            }));

            setSchedules(formattedData);
        } catch (err) {
            console.error('Error fetching schedules:', err);
            // toast.error('Failed to load schedule'); // Optional: don't spam toasts on load
        } finally {
            setLoading(false);
        }
    }, [user, role, classId]);

    // Set up Real-time Subscription
    useEffect(() => {
        fetchSchedules();

        if (!user) return;

        const channel = supabase
            .channel(`schedules-${role}-${user.id}-${classId || 'all'}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'schedules'
                },
                async (payload) => {
                    // Logic to determine if we should refresh based on the payload
                    let shouldRefresh = false;

                    const newItem = payload.new as any; // Cast to any to access dynamic fields
                    const oldItem = payload.old as any;

                    if (role === 'lecturer') {
                        // Lecturer cares if they are the owner OR if it's in the viewed class
                        if (classId) {
                            // Viewing specific class
                            if (newItem?.class_id === classId || oldItem?.class_id === classId) {
                                shouldRefresh = true;
                            }
                        } else {
                            // Viewing all their schedules
                            if (newItem?.lecturer_id === user.id || oldItem?.lecturer_id === user.id) {
                                shouldRefresh = true;
                            }
                        }
                    } else {
                        // Student cares if the schedule is for one of their enrolled classes
                        // We use the ref to check against the list we fetched earlier
                        const relevantClassId = newItem?.class_id || oldItem?.class_id;
                        if (relevantClassId && enrolledClassIdsRef.current.includes(relevantClassId)) {
                            shouldRefresh = true;
                        }
                    }

                    if (shouldRefresh) {
                        await fetchSchedules();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchSchedules, user, role, classId]);

    // Helper function to get day name
    const getDayName = (dayOfWeek: number): string => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayOfWeek] || 'Unknown';
    };

    const createSchedule = async (scheduleData: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'lecturer_id'>) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { data, error } = await supabase
                .from('schedules')
                .insert({
                    ...scheduleData,
                    lecturer_id: user.id
                })
                .select('*, classes(class_name, course_code)')
                .single();

            if (error) throw error;

            // Send Notifications
            if (scheduleData.class_id) {
                const { notifyScheduleCreated } = await import('@/lib/notificationService');

                // Get accepted students for this class
                const { data: acceptedRequests } = await supabase
                    .from('access_requests')
                    .select('student_id')
                    .eq('class_id', scheduleData.class_id)
                    .eq('status', 'accepted');

                const studentIds = acceptedRequests?.map(r => r.student_id).filter(id => id !== null) as string[] || [];

                if (studentIds.length > 0) {
                    await notifyScheduleCreated(
                        studentIds,
                        scheduleData.title,
                        `New ${scheduleData.type} scheduled for ${scheduleData.specific_date ? new Date(scheduleData.specific_date).toLocaleDateString() : getDayName(scheduleData.day_of_week)} at ${scheduleData.start_time}`,
                        data.id,
                        user.id,
                        scheduleData.class_id
                    );
                }
            }

            return { success: true, data };
        } catch (err: any) {
            console.error('Error creating schedule:', err);
            return { success: false, error: err.message };
        }
    };

    const updateSchedule = async (id: string, updates: Partial<Omit<Schedule, 'id' | 'created_at' | 'updated_at'>>) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { data, error } = await supabase
                .from('schedules')
                .update(updates)
                .eq('id', id)
                .select('*, classes(class_name, course_code)')
                .single();

            if (error) throw error;

            // Send Notifications
            if (data.class_id) {
                const { notifyScheduleUpdated } = await import('@/lib/notificationService');
                const { data: acceptedRequests } = await supabase
                    .from('access_requests')
                    .select('student_id')
                    .eq('class_id', data.class_id)
                    .eq('status', 'accepted');

                const studentIds = acceptedRequests?.map(r => r.student_id).filter(id => id !== null) as string[] || [];

                if (studentIds.length > 0) {
                    // Build update details
                    let updateDetails = 'Schedule updated';
                    if (updates.start_time) updateDetails = `Time changed to ${updates.start_time}`;
                    else if (updates.location) updateDetails = `Location changed to ${updates.location}`;
                    else if (updates.specific_date) updateDetails = `Date changed to ${new Date(updates.specific_date).toLocaleDateString()}`;

                    await notifyScheduleUpdated(
                        studentIds,
                        data.title,
                        updateDetails,
                        data.id,
                        user.id,
                        data.class_id
                    );
                }
            }

            return { success: true, data };
        } catch (err: any) {
            console.error('Error updating schedule:', err);
            return { success: false, error: err.message };
        }
    };

    const deleteSchedule = async (id: string) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', id)
                .eq('lecturer_id', user.id);

            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('Error deleting schedule:', err);
            return { success: false, error: err.message };
        }
    };

    const getSchedulesForDay = (dayOfWeek: number) => {
        return schedules.filter(s => s.day_of_week === dayOfWeek);
    };

    const getUpcomingSchedules = () => {
        const today = new Date().getDay();
        return schedules
            .filter(s => s.day_of_week >= today)
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .slice(0, 5);
    };

    return {
        schedules,
        assignments,
        loading,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        refreshSchedules: fetchSchedules,
        getSchedulesForDay,
        getUpcomingSchedules
    };
}
