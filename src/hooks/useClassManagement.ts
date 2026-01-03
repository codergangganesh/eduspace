import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Class {
    id: string;
    lecturer_id: string;
    course_code: string;
    class_name?: string;
    semester?: string;
    academic_year?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    student_count?: number;
}

export function useClassManagement() {
    const { user } = useAuth();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        fetchClasses();

        // Set up real-time subscription
        const subscription = supabase
            .channel('classes_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'classes',
                    filter: `lecturer_id=eq.${user.id}`
                },
                () => {
                    fetchClasses();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('classes')
                .select('*')
                .eq('lecturer_id', user?.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Get student counts for each class
            if (data && data.length > 0) {
                const classIds = data.map(c => c.id);
                const { data: studentCounts } = await supabase
                    .from('class_students')
                    .select('class_id')
                    .in('class_id', classIds);

                const countMap = new Map<string, number>();
                studentCounts?.forEach(sc => {
                    countMap.set(sc.class_id, (countMap.get(sc.class_id) || 0) + 1);
                });

                const enrichedClasses = data.map(cls => ({
                    ...cls,
                    student_count: countMap.get(cls.id) || 0
                }));

                setClasses(enrichedClasses);
            } else {
                setClasses([]);
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    const createClass = async (classData: {
        course_code: string;
        class_name?: string;
        semester?: string;
        academic_year?: string;
    }) => {
        try {
            // Get lecturer profile data
            const { data: lecturerProfile } = await supabase
                .from('lecturer_profiles')
                .select('full_name, department')
                .eq('user_id', user?.id)
                .single();

            const { data, error: insertError } = await supabase
                .from('classes')
                .insert([{
                    lecturer_id: user?.id,
                    ...classData,
                    lecturer_name: lecturerProfile?.full_name,
                    lecturer_department: lecturerProfile?.department,
                    is_active: true
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            return { success: true, data };
        } catch (err) {
            console.error('Error creating class:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to create class' };
        }
    };

    const updateClass = async (classId: string, updates: Partial<Class>) => {
        try {
            const { error: updateError } = await supabase
                .from('classes')
                .update(updates)
                .eq('id', classId);

            if (updateError) throw updateError;

            return { success: true };
        } catch (err) {
            console.error('Error updating class:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update class' };
        }
    };

    const deleteClass = async (classId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('classes')
                .delete()
                .eq('id', classId);

            if (deleteError) throw deleteError;

            return { success: true };
        } catch (err) {
            console.error('Error deleting class:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to delete class' };
        }
    };

    const getClassById = async (classId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('classes')
                .select('*')
                .eq('id', classId)
                .single();

            if (fetchError) throw fetchError;

            return { success: true, data };
        } catch (err) {
            console.error('Error fetching class:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch class' };
        }
    };

    return {
        classes,
        loading,
        error,
        createClass,
        updateClass,
        deleteClass,
        getClassById,
        refetch: fetchClasses
    };
}
