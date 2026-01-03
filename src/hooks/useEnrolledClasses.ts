import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EnrolledClass {
    id: string;
    class_id: string;
    student_id: string;
    register_number: string;
    student_name: string;
    email: string;
    department?: string;
    course?: string;
    year?: string;
    section?: string;
    enrollment_status: string;
    enrolled_at: string;
    classes: {
        id: string;
        course_code: string;
        class_name: string | null;
        semester: string | null;
        academic_year: string | null;
        lecturer_name: string | null;
        lecturer_department: string | null;
        lecturer_profile_image: string | null;
        class_image_url: string | null;
    };
}

export function useEnrolledClasses() {
    const { user } = useAuth();
    const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEnrolledClasses = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('class_students')
                .select(`
                    *,
                    classes (
                        id,
                        course_code,
                        class_name,
                        semester,
                        academic_year,
                        lecturer_name,
                        lecturer_department,
                        lecturer_profile_image,
                        class_image_url
                    )
                `)
                .eq('student_id', user.id)
                .eq('enrollment_status', 'enrolled')
                .order('enrolled_at', { ascending: false });

            if (error) throw error;

            setEnrolledClasses(data || []);
        } catch (error) {
            console.error('Error fetching enrolled classes:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchEnrolledClasses();

        if (!user) return;

        const subscription = supabase
            .channel(`enrolled_classes_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'class_students',
                    filter: `student_id=eq.${user.id}`,
                },
                () => {
                    fetchEnrolledClasses();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user, fetchEnrolledClasses]);

    return {
        enrolledClasses,
        loading,
        refetch: fetchEnrolledClasses,
        enrolledCount: enrolledClasses.length,
    };
}
