import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createRegisteredMap } from '@/lib/cacheRegistry';

// ── Module-level cache ───────────────────────────────────────────────────────
const studentsCache = createRegisteredMap<string, ClassStudent[]>();

function getClassStudentCacheKey(userId?: string, classId?: string) {
    if (!userId || !classId) return null;
    return `${userId}_${classId}`;
}

export interface ClassStudent {
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
    phone?: string;
    student_image_url?: string | null;
    import_source: string;
    added_at: string;
    profile_image?: string;
    status?: 'active' | 'probation' | 'inactive';
    progress?: number;
}

export function useClassStudents(classId?: string) {
    const { user } = useAuth();
    const cacheKey = getClassStudentCacheKey(user?.id, classId);
    const [students, setStudents] = useState<ClassStudent[]>(() => {
        if (cacheKey && studentsCache.has(cacheKey)) {
            return studentsCache.get(cacheKey) || [];
        }
        return [];
    });
    const [loading, setLoading] = useState(() => {
        return cacheKey ? !studentsCache.has(cacheKey) : false;
    });
    const [error, setError] = useState<string | null>(null);

    // Update state synchronously if classId changes and we have cached data
    useEffect(() => {
        if (!cacheKey) {
            setStudents([]);
            setLoading(false);
        } else if (studentsCache.has(cacheKey)) {
            setStudents(studentsCache.get(cacheKey) || []);
            setLoading(false);
        } else {
            setStudents([]);
            setLoading(true);
        }
    }, [cacheKey]);

    useEffect(() => {
        if (!user || !classId) {
            setLoading(false);
            return;
        }

        fetchStudents();

        // Set up real-time subscription
        const subscription = supabase
            .channel(`class_students_${classId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'class_students',
                    filter: `class_id=eq.${classId}`
                },
                () => {
                    fetchStudents(true);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, classId]);

    const fetchStudents = async (silentRefresh = false) => {
        if (!classId || !cacheKey) return;

        try {
            if (!silentRefresh && !studentsCache.has(cacheKey)) {
                setLoading(true);
            }
            const { data, error: fetchError } = await supabase
                .from('class_students')
                .select('*')
                .eq('class_id', classId)
                .order('added_at', { ascending: false });

            if (fetchError) throw fetchError;

            setStudents(data || []);
            if (data) studentsCache.set(cacheKey, data);
            setError(null);
        } catch (err) {
            console.error('Error fetching students:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const addStudent = async (studentData: Omit<ClassStudent, 'id' | 'added_at'>) => {
        if (!user || !classId) throw new Error('Not authenticated or no class selected');

        try {
            const { data, error: insertError } = await supabase
                .from('class_students')
                .insert({
                    ...studentData,
                    class_id: classId
                })
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchStudents();
            return { success: true, data };
        } catch (err) {
            console.error('Error adding student:', err);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Failed to add student'
            };
        }
    };

    const updateStudent = async (studentId: string, updates: Partial<ClassStudent>) => {
        if (!user || !classId) throw new Error('Not authenticated or no class selected');

        try {
            const { error: updateError } = await supabase
                .from('class_students')
                .update(updates)
                .eq('id', studentId)
                .eq('class_id', classId);

            if (updateError) throw updateError;

            await fetchStudents();
        } catch (err) {
            console.error('Error updating student:', err);
            throw err;
        }
    };

    const deleteStudent = async (studentId: string) => {
        if (!user || !classId) throw new Error('Not authenticated or no class selected');

        try {
            const { error: deleteError } = await supabase
                .from('class_students')
                .delete()
                .eq('id', studentId)
                .eq('class_id', classId);

            if (deleteError) throw deleteError;

            await fetchStudents();
        } catch (err) {
            console.error('Error deleting student:', err);
            throw err;
        }
    };

    const importStudents = async (studentsData: any[]) => {
        if (!user || !classId) throw new Error('Not authenticated or no class selected');

        try {
            // Prepare students for insertion
            const studentsToInsert = studentsData.map(student => ({
                class_id: classId,
                student_id: null, // Will be filled when student accepts
                register_number: student.registerNumber,
                student_name: student.studentName,
                email: student.email,
                department: student.department || null,
                course: student.course || null,
                year: student.year || null,
                section: student.section || null,
                phone: student.phone || null,
                import_source: 'excel'
            }));

            // Insert students
            const { data, error: insertError } = await supabase
                .from('class_students')
                .insert(studentsToInsert)
                .select();

            if (insertError) throw insertError;

            await fetchStudents();

            return {
                success: true,
                imported: data?.length || 0,
                skipped: studentsData.length - studentsToInsert.length,
                failed: 0,
                errors: []
            };
        } catch (err) {
            console.error('Error importing students:', err);
            return {
                success: false,
                imported: 0,
                skipped: 0,
                failed: studentsData.length,
                errors: [err instanceof Error ? err.message : 'Failed to import students']
            };
        }
    };

    const updateStudentImage = async (studentId: string, imageUrl: string | null) => {
        if (!user || !classId) throw new Error('Not authenticated or no class selected');

        try {
            const { error: updateError } = await supabase
                .from('class_students')
                .update({ student_image_url: imageUrl })
                .eq('id', studentId)
                .eq('class_id', classId);

            if (updateError) throw updateError;

            await fetchStudents();
        } catch (err) {
            console.error('Error updating student image:', err);
            throw err;
        }
    };

    return {
        students,
        loading,
        error,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudents,
        updateStudentImage,
        refetch: fetchStudents
    };
}
