import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const { user, role } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);

            // Check existing subscription
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.pushManager.getSubscription().then(sub => {
                        setSubscription(sub);
                    });
                });
            }
        }
    }, []);

    const subscribeToPush = async () => {
        if (!user) {
            toast.error("You must be logged in to enable notifications");
            return;
        }
        if (!('serviceWorker' in navigator)) {
            console.error("Service Worker not supported");
            return;
        }
        if (!VAPID_PUBLIC_KEY) {
            console.error("VAPID Public Key not found in environment variables");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            let sub = await registration.pushManager.getSubscription();

            if (!sub) {
                sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            setSubscription(sub);

            // Serialize subscription key
            const subJson = sub.toJSON();

            if (!subJson.keys?.p256dh || !subJson.keys?.auth) {
                throw new Error("Invalid subscription object");
            }

            // Save to Supabase
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    role: role || null,
                    endpoint: sub.endpoint,
                    p256dh: subJson.keys.p256dh,
                    auth: subJson.keys.auth
                }, { onConflict: 'user_id,endpoint' });

            if (error) throw error;

            toast.success("Notifications enabled successfully!");
            setPermission('granted');

        } catch (error: any) {
            console.error('Failed to subscribe to push', error);
            toast.error(`Failed to enable notifications: ${error.message || 'Unknown error'}`);
        }
    };

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            toast.error("Notifications not supported on this device");
            return;
        }

        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm === 'granted') {
            await subscribeToPush();
        } else {
            toast.info("Notification permission denied");
        }
    };

    const unsubscribe = async () => {
        if (!subscription) return;
        try {
            await subscription.unsubscribe();
            setSubscription(null);

            // Remove from DB (optional, but good hygiene)
            // Note: We need the endpoint to delete the specific one
            if (user) {
                await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint).eq('user_id', user.id);
            }

            toast.success("Notifications disabled");
        } catch (err) {
            console.error("Error unsubscribing", err);
        }
    };

    return { permission, requestPermission, unsubscribe, subscription };
}
