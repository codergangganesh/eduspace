import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Instructor {
    id: string;
    full_name: string;
    avatar_url: string | null;
    department?: string;
}

export function useInstructors() {
    const { data: instructors = [], isLoading: loading } = useQuery({
        queryKey: ['instructors'],
        queryFn: async () => {
            // Fetch users with role 'lecturer'
            // First get IDs from user_roles
            const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'lecturer');

            if (roleError) throw roleError;

            if (!roleData || roleData.length === 0) {
                return [];
            }

            const lecturerIds = roleData.map(r => r.user_id);

            // Then get profiles for these IDs
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id:user_id, full_name, avatar_url')
                .in('user_id', lecturerIds);

            if (profileError) throw profileError;

            return profiles?.map(p => ({
                id: p.id,
                full_name: p.full_name || 'Unknown Lecturer',
                avatar_url: p.avatar_url,
                department: 'General' // Placeholder
            })) || [];
        },
        staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    });

    return { instructors, loading };
}
