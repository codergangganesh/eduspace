import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Instructor {
    id: string;
    full_name: string;
    avatar_url: string | null;
    department?: string;
}

export function useInstructors() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                // Fetch users with role 'lecturer'
                // First get IDs from user_roles
                const { data: roleData, error: roleError } = await supabase
                    .from('user_roles')
                    .select('user_id')
                    .eq('role', 'lecturer');

                if (roleError) throw roleError;

                if (!roleData || roleData.length === 0) {
                    setInstructors([]);
                    return;
                }

                const lecturerIds = roleData.map(r => r.user_id);

                // Then get profiles for these IDs
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('id:user_id, full_name, avatar_url')
                    .in('user_id', lecturerIds);

                if (profileError) throw profileError;

                setInstructors(profiles?.map(p => ({
                    id: p.id,
                    full_name: p.full_name || 'Unknown Lecturer',
                    avatar_url: p.avatar_url,
                    department: 'General' // Placeholder as we don't have department in profiles yet
                })) || []);

            } catch (err) {
                console.error('Error fetching instructors:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructors();
    }, []);

    return { instructors, loading };
}
