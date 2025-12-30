import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Course {
    id: string;
    lecturer_id: string;
    course_code: string;
    title: string;
    description: string | null;
    department: string | null;
    credits: number;
    semester: string | null;
    schedule_info: string | null;
    max_students: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    enrolled_count?: number;
}

interface Enrollment {
    id: string;
    course_id: string;
    student_id: string;
    enrolled_at: string;
    status: 'active' | 'dropped' | 'completed';
    grade: string | null;
    student_name?: string;
    student_email?: string;
}

export function useCourses() {
    const { user, role } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCourses = useCallback(async () => {
        if (!user) return;

        try {
            let query;
            
            if (role === 'lecturer') {
                query = supabase
                    .from('courses')
                    .select('*')
                    .eq('lecturer_id', user.id)
                    .order('created_at', { ascending: false });
            } else {
                // Student sees active courses
                query = supabase
                    .from('courses')
                    .select('*')
                    .eq('is_active', true)
                    .order('title', { ascending: true });
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                console.warn('Error fetching courses:', fetchError);
                setCourses([]);
            } else {
                // Get enrollment count for each course
                const coursesWithCount = await Promise.all(
                    (data || []).map(async (course) => {
                        const { count } = await supabase
                            .from('course_enrollments')
                            .select('*', { count: 'exact', head: true })
                            .eq('course_id', course.id)
                            .eq('status', 'active');

                        return {
                            ...course,
                            enrolled_count: count || 0,
                        };
                    })
                );
                setCourses(coursesWithCount);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setCourses([]);
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

        fetchCourses();
    }, [user, fetchCourses]);

    // Create course (lecturer only)
    const createCourse = async (data: {
        course_code: string;
        title: string;
        description?: string;
        department?: string;
        credits?: number;
        semester?: string;
        schedule_info?: string;
        max_students?: number;
    }) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { data: newCourse, error } = await supabase
                .from('courses')
                .insert({
                    ...data,
                    lecturer_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;

            await fetchCourses();
            return { success: true, data: newCourse };
        } catch (err: any) {
            console.error('Error creating course:', err);
            return { success: false, error: err.message };
        }
    };

    // Update course (lecturer only)
    const updateCourse = async (id: string, data: Partial<Course>) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('courses')
                .update(data)
                .eq('id', id)
                .eq('lecturer_id', user.id);

            if (error) throw error;

            await fetchCourses();
            return { success: true };
        } catch (err: any) {
            console.error('Error updating course:', err);
            return { success: false, error: err.message };
        }
    };

    // Delete course (lecturer only)
    const deleteCourse = async (id: string) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', id)
                .eq('lecturer_id', user.id);

            if (error) throw error;

            await fetchCourses();
            return { success: true };
        } catch (err: any) {
            console.error('Error deleting course:', err);
            return { success: false, error: err.message };
        }
    };

    // Fetch enrollments for a course (lecturer only)
    const fetchEnrollments = async (courseId: string) => {
        if (!user || role !== 'lecturer') return [];

        try {
            const { data, error } = await supabase
                .from('course_enrollments')
                .select('*')
                .eq('course_id', courseId)
                .order('enrolled_at', { ascending: false });

            if (error) throw error;

            // Fetch student names
            const enrollmentsWithNames = await Promise.all(
                (data || []).map(async (enrollment) => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, email')
                        .eq('user_id', enrollment.student_id)
                        .single();

                    return {
                        ...enrollment,
                        student_name: profile?.full_name || 'Unknown Student',
                        student_email: profile?.email,
                    };
                })
            );

            setEnrollments(enrollmentsWithNames as Enrollment[]);
            return enrollmentsWithNames;
        } catch (err) {
            console.error('Error fetching enrollments:', err);
            return [];
        }
    };

    // Enroll student in course (lecturer can add, student can self-enroll)
    const enrollStudent = async (courseId: string, studentId?: string) => {
        if (!user) return { success: false, error: 'Unauthorized' };

        const targetStudentId = studentId || user.id;

        try {
            const { error } = await supabase
                .from('course_enrollments')
                .insert({
                    course_id: courseId,
                    student_id: targetStudentId,
                    status: 'active',
                });

            if (error) throw error;

            await fetchCourses();
            return { success: true };
        } catch (err: any) {
            console.error('Error enrolling student:', err);
            return { success: false, error: err.message };
        }
    };

    // Update enrollment (lecturer only)
    const updateEnrollment = async (enrollmentId: string, data: { status?: string; grade?: string }) => {
        if (!user || role !== 'lecturer') return { success: false, error: 'Unauthorized' };

        try {
            const { error } = await supabase
                .from('course_enrollments')
                .update(data)
                .eq('id', enrollmentId);

            if (error) throw error;

            return { success: true };
        } catch (err: any) {
            console.error('Error updating enrollment:', err);
            return { success: false, error: err.message };
        }
    };

    return {
        courses,
        enrollments,
        loading,
        error,
        createCourse,
        updateCourse,
        deleteCourse,
        fetchEnrollments,
        enrollStudent,
        updateEnrollment,
        refreshCourses: fetchCourses,
    };
}
