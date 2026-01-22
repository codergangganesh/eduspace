import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEnrolledClassIds } from '@/lib/studentUtils';

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
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSchedules = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            let query;

            // Fetch Schedules
            if (role === 'lecturer') {
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
                // For students, only fetch schedules for classes they're enrolled in
                // Strict check using shared utility
                const enrolledClassIds = await getEnrolledClassIds(user.id);

                if (enrolledClassIds.length === 0) {
                    setSchedules([]);
                    setLoading(false);
                    return;
                }

                // Get course codes for enrolled classes
                const { data: classesData } = await supabase
                    .from('classes')
                    .select('course_code')
                    .in('id', enrolledClassIds);

                if (!classesData || classesData.length === 0) {
                    setSchedules([]);
                    setLoading(false);
                    return;
                }

                const enrolledCourseCodes = classesData.map(c => c.course_code);

                const { data: enrolledCourses } = await supabase
                    .from('courses')
                    .select('id')
                    .in('course_code', enrolledCourseCodes);

                const enrolledCourseIds = enrolledCourses?.map(c => c.id) || [];

                if (enrolledCourseIds.length === 0) {
                    setSchedules([]);
                    setLoading(false);
                    return;
                }

                // Fetch schedules only for enrolled courses
                query = supabase
                    .from('schedules')
                    .select(`
                        *,
                        lecturer_name,
                        subject_name,
                        courses:course_id (title, course_code)
                    `)
                    .in('course_id', enrolledCourseIds)
                    .order('day_of_week', { ascending: true });
            }

            const { data: scheduleData, error: fetchError } = await query;

            if (fetchError) {
                console.warn('Error fetching schedules:', fetchError);
                setSchedules([]);
            } else {
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
                    lecturer_name: s.lecturer_name || profilesMap[s.lecturer_id] || 'Unknown Lecturer',
                    subject_name: s.subject_name || s.courses?.title || s.title
                }));
                setSchedules(formattedSchedules as Schedule[]);
            }

            // Fetch Assignments - wrapped in try-catch to prevent errors
            try {
                const today = new Date().toISOString();
                let assignQuery = supabase
                    .from('assignments')
                    .select('id, title, due_date, course_id')
                    .gte('due_date', today)
                    .order('due_date', { ascending: true });

                if (role === 'lecturer') {
                    assignQuery = assignQuery.eq('lecturer_id', user.id);
                }

                const { data: assignData, error: assignError } = await assignQuery;

                if (!assignError && assignData) {
                    setAssignments(assignData);
                } else {
                    setAssignments([]);
                }
            } catch (assignErr) {
                // Silently fail - assignments table might not be set up correctly
                console.log('Assignments not available');
                setAssignments([]);
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

        const scheduleSub = supabase
            .channel('schedules_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => fetchSchedules())
            .subscribe();

        const assignSub = supabase
            .channel('assignments_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => fetchSchedules())
            .subscribe();

        return () => {
            scheduleSub.unsubscribe();
            assignSub.unsubscribe();
        };
    }, [user, fetchSchedules]);

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
        lecturer_name: string;
        subject_name: string;
    }) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        const daySchedules = schedules.filter(s => {
            if (data.specific_date && s.specific_date) {
                return s.specific_date === data.specific_date;
            }
            if (data.specific_date) {
                const dateDay = new Date(data.specific_date).getDay();
                return (s.is_recurring && s.day_of_week === dateDay) || s.specific_date === data.specific_date;
            }
            if (data.is_recurring) {
                return s.is_recurring && s.day_of_week === data.day_of_week;
            }
            return false;
        });

        const hasOverlap = daySchedules.some(s => {
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

            // Send notifications to enrolled students
            try {
                if (data.course_id) {
                    // Get the course to find associated class
                    const { data: course } = await supabase
                        .from('courses')
                        .select('course_code')
                        .eq('id', data.course_id)
                        .single();

                    if (course) {
                        // Find the class associated with this course (by matching course_code)
                        const { data: matchingClass } = await supabase
                            .from('classes')
                            .select('id')
                            .eq('course_code', course.course_code)
                            .eq('lecturer_id', user.id)
                            .eq('is_active', true)
                            .maybeSingle();

                        if (matchingClass) {
                            // Get enrolled students from class_students table
                            const { data: enrolledStudents } = await supabase
                                .from('class_students')
                                .select('student_id')
                                .eq('class_id', matchingClass.id)
                                .not('student_id', 'is', null);

                            if (enrolledStudents && enrolledStudents.length > 0) {
                                const studentIds = enrolledStudents.map(s => s.student_id);

                                // Import and use the notification service
                                const { notifyScheduleCreated } = await import('@/lib/notificationService');

                                const scheduleDetails = `${data.type || 'Event'} on ${data.is_recurring ? getDayName(data.day_of_week) : new Date(data.specific_date!).toLocaleDateString()} at ${data.start_time}${data.location ? ` - ${data.location}` : ''}`;

                                await notifyScheduleCreated(
                                    studentIds,
                                    data.title,
                                    scheduleDetails,
                                    newSchedule.id,
                                    user.id,
                                    matchingClass.id
                                );
                            }
                        }
                    }
                }
            } catch (notifError) {
                console.warn('Failed to send schedule creation notifications:', notifError);
            }

            await fetchSchedules();
            return { success: true, data: newSchedule };
        } catch (err: any) {
            console.error('Error creating schedule:', err);
            return { success: false, error: err.message };
        }
    };

    // Helper function to get day name
    const getDayName = (dayOfWeek: number): string => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayOfWeek] || 'Unknown';
    };


    const updateSchedule = async (id: string, data: Partial<Schedule>) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('schedules')
                .update(data)
                .eq('id', id)
                .eq('lecturer_id', user.id);

            if (error) throw error;

            // Send notifications to enrolled students
            try {
                // Get the schedule details to find the course
                const { data: schedule } = await supabase
                    .from('schedules')
                    .select('title, course_id, type, day_of_week, start_time, location, is_recurring, specific_date')
                    .eq('id', id)
                    .single();

                if (schedule && schedule.course_id) {
                    // Get the course to find associated class
                    const { data: course } = await supabase
                        .from('courses')
                        .select('course_code')
                        .eq('id', schedule.course_id)
                        .single();

                    if (course) {
                        // Find the class associated with this course
                        const { data: matchingClass } = await supabase
                            .from('classes')
                            .select('id')
                            .eq('course_code', course.course_code)
                            .eq('lecturer_id', user.id)
                            .eq('is_active', true)
                            .maybeSingle();

                        if (matchingClass) {
                            // Get enrolled students from class_students table
                            const { data: enrolledStudents } = await supabase
                                .from('class_students')
                                .select('student_id')
                                .eq('class_id', matchingClass.id)
                                .not('student_id', 'is', null);

                            if (enrolledStudents && enrolledStudents.length > 0) {
                                const studentIds = enrolledStudents.map(s => s.student_id);

                                // Import and use the notification service
                                const { notifyScheduleUpdated } = await import('@/lib/notificationService');

                                // Build update details based on what changed
                                let updateDetails = '';
                                if (data.start_time || data.end_time) {
                                    updateDetails = `Time changed to ${data.start_time || schedule.start_time}`;
                                } else if (data.location) {
                                    updateDetails = `Location changed to ${data.location}`;
                                } else if (data.day_of_week !== undefined) {
                                    updateDetails = `Day changed to ${getDayName(data.day_of_week)}`;
                                } else {
                                    updateDetails = 'Schedule has been updated';
                                }

                                await notifyScheduleUpdated(
                                    studentIds,
                                    schedule.title,
                                    updateDetails,
                                    id,
                                    user.id,
                                    matchingClass.id
                                );
                            }
                        }
                    }
                }
            } catch (notifError) {
                console.warn('Failed to send schedule update notifications:', notifError);
            }

            await fetchSchedules();
            return { success: true };
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

            await fetchSchedules();
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
        error,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        getSchedulesForDay,
        getUpcomingSchedules,
        refreshSchedules: fetchSchedules,
    };
}
