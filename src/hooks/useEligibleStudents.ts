import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EligibleStudent {
    id: string; // This is the user_id (student_id)
    full_name: string;
    email: string;
    avatar_url?: string;
    class_name?: string; // Optional: show which class they are in
}

export interface ClassGroup {
    class_id: string;
    class_name: string;
    students: EligibleStudent[];
}

export function useEligibleStudents() {
    const { user } = useAuth();
    const [students, setStudents] = useState<EligibleStudent[]>([]); // Keep flat list for backward compatibility if needed, or remove if not used elsewhere
    const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchStudents = async () => {
            try {
                // 1. Get classes owned by this lecturer
                const { data: classes, error: classError } = await supabase
                    .from('classes')
                    .select('id, class_name')
                    .eq('lecturer_id', user.id);

                if (classError) throw classError;
                if (!classes || classes.length === 0) {
                    setStudents([]);
                    setClassGroups([]);
                    setLoading(false);
                    return;
                }

                const classIds = classes.map(c => c.id);

                // 2. Get accepted students directly using denormalized columns in class_students
                // Removed the .not('student_id', 'is', null) filter to catch students added via Excel/Manually who haven't been linked yet
                const { data, error } = await supabase
                    .from('class_students')
                    .select(`
                        student_id,
                        class_id,
                        student_name,
                        email
                    `)
                    .in('class_id', classIds);

                if (error) throw error;

                // 3. Collect IDs and Emails for lookup
                const uniqueStudentIds = new Set<string>();
                const emailsToLookup = new Set<string>();

                data?.forEach((item: any) => {
                    if (item.student_id) {
                        uniqueStudentIds.add(item.student_id);
                    } else if (item.email) {
                        emailsToLookup.add(item.email);
                    }
                });

                // 4. Fetch avatars and resolve missing IDs via Email
                const avatarMap = new Map<string, string>();
                const emailToIdMap = new Map<string, string>();

                // Fetch by ID
                if (uniqueStudentIds.size > 0) {
                    try {
                        const { data: profileData } = await supabase
                            .from('profiles')
                            .select('user_id, avatar_url')
                            .in('user_id', Array.from(uniqueStudentIds));

                        if (profileData) {
                            profileData.forEach((p: any) => {
                                avatarMap.set(p.user_id, p.avatar_url);
                            });
                        }
                    } catch (avatarError) {
                        console.warn('Could not fetch avatars:', avatarError);
                    }
                }

                // Fetch by Email (for those missing IDs)
                if (emailsToLookup.size > 0) {
                    try {
                        const { data: emailProfileData } = await supabase
                            .from('profiles')
                            .select('user_id, email, avatar_url')
                            .in('email', Array.from(emailsToLookup));

                        if (emailProfileData) {
                            emailProfileData.forEach((p: any) => {
                                if (p.email) {
                                    emailToIdMap.set(p.email, p.user_id);
                                    if (p.avatar_url) {
                                        avatarMap.set(p.user_id, p.avatar_url);
                                    }
                                }
                            });
                        }
                    } catch (emailError) {
                        console.warn('Could not resolve students by email:', emailError);
                    }
                }

                // 5. Group by Class
                const groups: ClassGroup[] = classes.map(cls => ({
                    class_id: cls.id,
                    class_name: cls.class_name,
                    students: []
                }));

                const flatList: EligibleStudent[] = [];

                data?.forEach((item: any) => {
                    // Try to resolve ID if missing
                    let studentId = item.student_id;
                    if (!studentId && item.email) {
                        studentId = emailToIdMap.get(item.email);
                    }

                    // Only include if we have a valid ID (either originally present or resolved)
                    if (!studentId) return;

                    const clsGroup = groups.find(g => g.class_id === item.class_id);
                    if (clsGroup) {
                        const student: EligibleStudent = {
                            id: studentId,
                            full_name: item.student_name || item.email?.split('@')[0] || 'Unknown Student',
                            email: item.email || '',
                            avatar_url: avatarMap.get(studentId),
                            class_name: clsGroup.class_name
                        };

                        // Avoid duplicates in the same class (e.g. if Excel had dupes)
                        if (!clsGroup.students.some(s => s.id === student.id)) {
                            clsGroup.students.push(student);
                        }

                        if (!flatList.some(s => s.id === student.id)) {
                            flatList.push(student);
                        }
                    }
                });

                // Filter out empty classes so the UI doesn't render blank space or think we have data when we don't
                const nonEmptyGroups = groups.filter(g => g.students.length > 0);
                setClassGroups(nonEmptyGroups);
                setStudents(flatList);

            } catch (err) {
                console.error('Error fetching eligible students:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();

        const subscription = supabase
            .channel('eligible_students_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'class_students'
                },
                () => {
                    fetchStudents();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };

    }, [user]);

    return { students, classGroups, loading };
}
