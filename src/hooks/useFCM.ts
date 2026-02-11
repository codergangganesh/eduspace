import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { messaging, requestForToken } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';

export function useFCM() {
    const [token, setToken] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!messaging) {
            setLoading(false);
            return;
        }

        const setupFCM = async () => {
            try {
                if (Notification.permission === 'granted') {
                    const fcmToken = await requestForToken();
                    if (fcmToken) {
                        setToken(fcmToken);
                        await syncToken(fcmToken);
                    }
                }
            } catch (error) {
                console.error('Error setting up FCM:', error);
            } finally {
                setLoading(false);
            }
        };

        setupFCM();

        // Listen for foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            toast(payload.notification?.title || 'New Notification', {
                description: payload.notification?.body,
            });
        });

        return () => unsubscribe();
    }, []);

    const syncToken = async (fcmToken: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { error } = await supabase
                .from('fcm_tokens')
                .upsert({
                    user_id: session.user.id,
                    token: fcmToken,
                    device_type: navigator.userAgent.includes('Mobile') ? 'mobile' : 'web'
                }, { onConflict: 'user_id, token' });

            if (error) {
                console.error('Failed to sync FCM token with DB:', error);
            }
        } catch (err) {
            console.error('Sync error:', err);
        }
    };

    const subscribe = async () => {
        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult === 'granted') {
                const fcmToken = await requestForToken();
                if (fcmToken) {
                    setToken(fcmToken);
                    await syncToken(fcmToken);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Failed to subscribe to FCM:', error);
            return false;
        }
    };

    return {
        token,
        permission,
        loading,
        subscribe,
        isSupported: !!messaging
    };
}
