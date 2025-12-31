import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
    import_source: string;
    added_at: string;
    profile_image?: string;
    status?: 'active' | 'probation' | 'inactive';
    progress?: number;
}

export function useClassStudents(classId?: string) {
    const { user } = useAuth();
    const [students, setStudents] = useState<ClassStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                    fetchStudents();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user, classId]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('class_students')
                .select('*')
                .eq('class_id', classId)
                .order('added_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Fetch student profiles for additional data
            if (data && data.length > 0) {
                const studentIds = data.map(s => s.student_id);
                const { data: profiles } = await supabase
                    .from('student_profiles')
                    .select('user_id, profile_image')
                    .in('user_id', studentIds);

                const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

                const enrichedStudents = data.map(student => ({
                    ...student,
                    profile_image: profileMap.get(student.student_id)?.profile_image,
                    status: 'active' as const, // Default status, can be enhanced
                    progress: Math.floor(Math.random() * 40 + 60) // Placeholder, replace with real data
                }));

                setStudents(enrichedStudents);
            } else {
                setStudents([]);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const addStudent = async (studentData: Omit<ClassStudent, 'id' | 'added_at'>) => {
        try {
            const { data, error: insertError } = await supabase
                .from('class_students')
                .insert([studentData])
                .select()
                .single();

            if (insertError) throw insertError;

            return { success: true, data };
        } catch (err) {
            console.error('Error adding student:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to add student' };
        }
    };

    const updateStudent = async (studentId: string, updates: Partial<ClassStudent>) => {
        try {
            const { error: updateError } = await supabase
                .from('class_students')
                .update(updates)
                .eq('id', studentId);

            if (updateError) throw updateError;

            return { success: true };
        } catch (err) {
            console.error('Error updating student:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update student' };
        }
    };

    const deleteStudent = async (studentId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('class_students')
                .delete()
                .eq('id', studentId);

            if (deleteError) throw deleteError;

            return { success: true };
        } catch (err) {
            console.error('Error deleting student:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Failed to delete student' };
        }
    };

    const importStudentsFromExcel = async (studentsData: any[], classId: string) => {
        try {
            // Check if students exist in auth.users by email
            const emails = studentsData.map(s => s.email);
            const { data: existingUsers } = await supabase
                .from('student_profiles')
                .select('user_id, email')
                .in('email', emails);

            const userMap = new Map(existingUsers?.map(u => [u.email, u.user_id]) || []);

            const studentsToInsert = studentsData.map(student => ({
                class_id: classId,
                student_id: userMap.get(student.email) || null,
                register_number: student.registerNumber,
                student_name: student.studentName,
                email: student.email,
                department: student.department,
                course: student.course,
                year: student.year,
                section: student.section,
                phone: student.phone,
                import_source: 'excel'
            })).filter(s => s.student_id); // Only import students who have accounts

            if (studentsToInsert.length === 0) {
                return {
                    success: false,
                    error: 'No students found with registered accounts. Students must have accounts before importing.'
                };
            }

            const { data, error: insertError } = await supabase
                .from('class_students')
                .insert(studentsToInsert)
                .select();

            if (insertError) throw insertError;

            return {
                success: true,
                imported: data?.length || 0,
                skipped: studentsData.length - studentsToInsert.length
            };
        } catch (err) {
            console.error('Error importing students:', err);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Failed to import students'
            };
        }
    };

    return {
        students,
        loading,
        error,
        addStudent,
        updateStudent,
        deleteStudent,
        importStudentsFromExcel,
        refetch: fetchStudents
    };
}
