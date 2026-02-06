import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEnrolledClassIds } from '@/lib/studentUtils';

export interface Class {
    id: string;
    lecturer_id: string;
    lecturer_name: string | null;
    lecturer_department: string | null;
    lecturer_profile_image: string | null;
    class_image_url: string | null;
    course_code: string;
    class_name: string | null;
    semester: string | null;
    academic_year: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    student_count?: number;
    subjects?: string[]; // Added for student view
}

export interface CreateClassData {
    lecturer_name: string;
    lecturer_department: string;
    course_code: string;
    class_name?: string;
    semester?: string;
    academic_year?: string;
}

export function useClasses() {
    const { user, role } = useAuth();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchClasses = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            if (role === 'student') {
                // STUDENT: Fetch enrolled classes
                const enrolledIds = await getEnrolledClassIds(user.id);

                if (enrolledIds.length === 0) {
                    setClasses([]);
                    setLoading(false);
                    return;
                }

                const { data: classesData, error: classesError } = await supabase
                    .from('classes')
                    .select('*')
                    .in('id', enrolledIds)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (classesError) throw classesError;

                // Enrich with subjects and latest lecturer profile info
                const classIds = classesData?.map(c => c.id) || [];
                const lecturerIds = Array.from(new Set(classesData?.map(c => c.lecturer_id) || []));

                // fetch subjects in bulk
                const { data: allSubjects } = await supabase
                    .from('subjects')
                    .select('name, class_id')
                    .in('class_id', classIds);

                // fetch lecturer profiles in bulk
                const { data: allProfiles } = await supabase
                    .from('profiles')
                    .select('user_id, full_name, avatar_url')
                    .in('user_id', lecturerIds);

                // Create maps for easy lookup
                const subjectsMap = new Map<string, string[]>();
                allSubjects?.forEach((s: any) => {
                    const current = subjectsMap.get(s.class_id) || [];
                    current.push(s.name);
                    subjectsMap.set(s.class_id, current);
                });

                const profilesMap = new Map<string, { full_name: string, avatar_url: string }>();
                allProfiles?.forEach((p: any) => {
                    profilesMap.set(p.user_id, {
                        full_name: p.full_name,
                        avatar_url: p.avatar_url
                    });
                });

                const enrichedClasses = (classesData || []).map((classItem) => {
                    const lecturer = profilesMap.get(classItem.lecturer_id);
                    return {
                        ...classItem,
                        lecturer_profile_image: lecturer?.avatar_url || classItem.lecturer_profile_image,
                        lecturer_name: lecturer?.full_name || classItem.lecturer_name || 'Unknown Lecturer',
                        subjects: subjectsMap.get(classItem.id) || []
                    };
                });

                setClasses(enrichedClasses);

            } else {
                // LECTURER: Fetch own classes
                const { data: classesData, error: classesError } = await supabase
                    .from('classes')
                    .select('*')
                    .eq('lecturer_id', user.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (classesError) throw classesError;

                // Fetch student count for each class
                const classesWithCount = await Promise.all(
                    (classesData || []).map(async (classItem) => {
                        const { count } = await supabase
                            .from('class_students')
                            .select('*', { count: 'exact', head: true })
                            .eq('class_id', classItem.id);

                        return {
                            ...classItem,
                            student_count: count || 0,
                        };
                    })
                );

                setClasses(classesWithCount);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError(err as Error);
            setClasses([]);
        } finally {
            setLoading(false);
        }
    }, [user, role]);

    useEffect(() => {
        fetchClasses();

        // Real-time subscription for classes
        // Note: For students, we might want to listen to access_requests too, but general class updates are fine for now.
        // Or if the lecturer calls updates.
        const filter = role === 'lecturer' ? `lecturer_id=eq.${user?.id}` : undefined; // Students listen to broad updates or specific? 
        // Broad updates might be too much. Let's stick to basic reload on mount/focus for now or simple subscription.
        // Re-using existing subscription logic but refining filter

        let subscription: any;

        if (role === 'lecturer') {
            subscription = supabase
                .channel('classes_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'classes',
                        filter: `lecturer_id=eq.${user?.id}`,
                    },
                    () => fetchClasses()
                )
                .subscribe();
        }

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [user, role, fetchClasses]);

    const createClass = async (data: CreateClassData) => {
        if (!user) throw new Error('User not authenticated');

        try {
            // Create class with manually entered lecturer details
            const { data: newClass, error: createError } = await supabase
                .from('classes')
                .insert({
                    lecturer_id: user.id,
                    lecturer_name: data.lecturer_name,
                    lecturer_department: data.lecturer_department,
                    lecturer_profile_image: null,
                    course_code: data.course_code,
                    class_name: data.class_name || null,
                    semester: data.semester || null,
                    academic_year: data.academic_year || null,
                    is_active: true,
                })
                .select()
                .single();

            if (createError) throw createError;

            await fetchClasses();
            return newClass;
        } catch (err) {
            console.error('Error creating class:', err);
            throw err;
        }
    };

    const updateClass = async (classId: string, data: Partial<CreateClassData>) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { error: updateError } = await supabase
                .from('classes')
                .update({
                    course_code: data.course_code,
                    class_name: data.class_name,
                    semester: data.semester,
                    academic_year: data.academic_year,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', classId)
                .eq('lecturer_id', user.id);

            if (updateError) throw updateError;

            await fetchClasses();
        } catch (err) {
            console.error('Error updating class:', err);
            throw err;
        }
    };

    const deleteClass = async (classId: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            // Soft delete by setting is_active to false
            const { error: deleteError } = await supabase
                .from('classes')
                .update({ is_active: false })
                .eq('id', classId)
                .eq('lecturer_id', user.id);

            if (deleteError) throw deleteError;

            await fetchClasses();
        } catch (err) {
            console.error('Error deleting class:', err);
            throw err;
        }
    };

    const updateClassImage = async (classId: string, imageUrl: string | null) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { error: updateError } = await supabase
                .from('classes')
                .update({
                    class_image_url: imageUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', classId)
                .eq('lecturer_id', user.id);

            if (updateError) throw updateError;

            await fetchClasses();
        } catch (err) {
            console.error('Error updating class image:', err);
            throw err;
        }
    };

    return {
        classes,
        loading,
        error,
        createClass,
        updateClass,
        deleteClass,
        updateClassImage,
        refreshClasses: fetchClasses,
    };
}
