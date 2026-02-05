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

export function useEligibleStudents() {
    const { user } = useAuth();
    const [students, setStudents] = useState<EligibleStudent[]>([]);
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
                    setLoading(false);
                    return;
                }

                const classIds = classes.map(c => c.id);

                // 2. Get ALL students in classes, including those who haven't linked accounts yet
                // This ensures imported students appear even before they register
                const { data, error } = await supabase
                    .from('class_students')
                    .select(`
                        id,
                        student_id,
                        class_id,
                        student_name,
                        email,
                        register_number,
                        student_image_url
                    `)
                    .in('class_id', classIds);

                if (error) throw error;

                // 3. Transform and Deduplicate
                // Use student_id if available, otherwise use class_students.id as fallback key
                const studentMap = new Map<string, EligibleStudent>();
                const studentIds: string[] = [];

                data?.forEach((item: any) => {
                    // Use student_id for linked accounts, or class_students.id for imported students
                    const uniqueKey = item.student_id || `unlinked_${item.id}`;
                    const studentId = item.student_id || item.id; // For display purposes

                    if (!studentMap.has(uniqueKey)) {
                        const cls = classes.find(c => c.id === item.class_id);
                        studentMap.set(uniqueKey, {
                            id: studentId,
                            full_name: item.student_name || item.email?.split('@')[0] || 'Unknown Student',
                            email: item.email || '',
                            avatar_url: item.student_image_url || undefined,
                            class_name: cls?.class_name
                        });
                        // Only add to studentIds if they have a linked account (for profile lookup)
                        if (item.student_id) {
                            studentIds.push(item.student_id);
                        }
                    }
                });

                // 4. Try to fetch avatars separately (Best Effort)
                if (studentIds.length > 0) {
                    try {
                        const { data: profileData } = await supabase
                            .from('profiles')
                            .select('user_id, avatar_url')
                            .in('user_id', studentIds);

                        if (profileData) {
                            profileData.forEach((p: any) => {
                                const exist = studentMap.get(p.user_id);
                                if (exist) {
                                    exist.avatar_url = p.avatar_url;
                                    studentMap.set(p.user_id, exist);
                                }
                            });
                        }
                    } catch (avatarError) {
                        console.warn('Could not fetch avatars (likely RLS restricted):', avatarError);
                        // Continue without avatars
                    }
                }

                setStudents(Array.from(studentMap.values()));

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

    return { students, loading };
}
