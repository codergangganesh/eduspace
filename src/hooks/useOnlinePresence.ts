import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useOnlinePresence() {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user) return;

        const channel = supabase.channel('global_presence', {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const userIds = new Set<string>();

                // newState is { [key: string]: any[] }
                Object.keys(newState).forEach(key => {
                    userIds.add(key);
                });

                setOnlineUsers(userIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                        user_id: user.id,
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    return { onlineUsers };
}
