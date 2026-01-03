import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClassStudent {
    id: string;
    class_id: string;
    student_id: string | null;
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
    enrollment_status: 'pending' | 'enrolled' | 'rejected';
    added_at: string;
    enrolled_at?: string | null;
}

export function useClassStudents(classId?: string) {
    const { user } = useAuth();
    const [students, setStudents] = useState<ClassStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = useCallback(async () => {
        if (!user || !classId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('class_students')
                .select('*')
                .eq('class_id', classId)
                .order('added_at', { ascending: false });

            if (fetchError) throw fetchError;

            setStudents(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching students:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch students');
        } finally {
            setLoading(false);
        }
    }, [user, classId]);

    useEffect(() => {
        fetchStudents();

        if (!classId) return;

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
                    fetchStudents();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [classId, fetchStudents]);

    const addStudent = async (studentData: Omit<ClassStudent, 'id' | 'added_at' | 'enrollment_status'>) => {
        if (!user || !classId) throw new Error('Not authenticated or no class selected');

        try {
            const { data, error: insertError } = await supabase
                .from('class_students')
                .insert({
                    ...studentData,
                    class_id: classId,
                    enrollment_status: 'pending'
                })
                .select()
                .single();

            if (insertError) throw insertError;

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
        } catch (err) {
            console.error('Error deleting student:', err);
            throw err;
        }
    };

    const importStudents = async (studentsData: any[]) => {
        if (!user || !classId) throw new Error('Not authenticated or no class selected');

        try {
            const studentsToInsert = studentsData.map(student => ({
                class_id: classId,
                student_id: null,
                register_number: student.registerNumber,
                student_name: student.studentName,
                email: student.email,
                department: student.department || null,
                course: student.course || null,
                year: student.year || null,
                section: student.section || null,
                phone: student.phone || null,
                import_source: 'excel',
                enrollment_status: 'pending'
            }));

            const { data, error: insertError } = await supabase
                .from('class_students')
                .insert(studentsToInsert)
                .select();

            if (insertError) throw insertError;

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

    const importStudentsFromExcel = async (studentsData: any[], targetClassId: string) => {
        return importStudents(studentsData);
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
        importStudentsFromExcel,
        updateStudentImage,
        refetch: fetchStudents
    };
}
