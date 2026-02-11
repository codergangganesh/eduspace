import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export function usePushSubscription() {
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setLoading(false);
            return;
        }

        const checkSubscription = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;
                const sub = await registration.pushManager.getSubscription();
                setSubscription(sub);
                setPermission(Notification.permission);

                // If we have a subscription, ensure it's synced with DB
                if (sub && Notification.permission === 'granted') {
                    await syncSubscription(sub);
                }
            } catch (error) {
                console.error('Error checking subscription:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSubscription();
    }, []);

    const syncSubscription = async (sub: PushSubscription) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const subJson = sub.toJSON();
            const p256dhKey = subJson.keys?.p256dh;
            const authKey = subJson.keys?.auth;

            if (!p256dhKey || !authKey) {
                // Fallback to getKey for binary extraction
                const p256dhBuf = sub.getKey('p256dh');
                const authBuf = sub.getKey('auth');
                if (!p256dhBuf || !authBuf) return;

                const subscriptionData = {
                    user_id: session.user.id,
                    endpoint: sub.endpoint,
                    p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhBuf)))),
                    auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authBuf)))),
                };

                const { error } = await supabase
                    .from('push_subscriptions')
                    .upsert(subscriptionData, { onConflict: 'user_id, endpoint' });

                if (error) console.error('Failed to sync subscription with DB:', error);
                return;
            }

            const subscriptionData = {
                user_id: session.user.id,
                endpoint: sub.endpoint,
                p256dh: p256dhKey,
                auth: authKey,
            };

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert(subscriptionData, { onConflict: 'user_id, endpoint' });

            if (error) {
                console.error('Failed to sync subscription with DB:', error);
            }
        } catch (err) {
            console.error('Sync error:', err);
        }
    };

    const subscribe = async () => {
        if (!('serviceWorker' in navigator)) return false;

        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                throw new Error('Permission not granted');
            }

            const registration = await navigator.serviceWorker.ready;

            // Check for existing subscription first
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) {
                setSubscription(existingSub);
                await syncSubscription(existingSub);
                return true;
            }

            if (!VAPID_PUBLIC_KEY) {
                console.error('VAPID public key not found');
                return false;
            }

            const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            const newSub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            setSubscription(newSub);
            await syncSubscription(newSub);
            return true;
        } catch (error) {
            console.error('Failed to subscribe:', error);
            return false;
        }
    };

    const unsubscribe = async () => {
        if (!subscription) return;
        try {
            await subscription.unsubscribe();
            setSubscription(null);

            // Remove from DB
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { error } = await supabase
                    .from('push_subscriptions')
                    .delete()
                    .match({ endpoint: subscription.endpoint, user_id: session.user.id });

                if (error) console.error('Error removing from DB:', error);
            }
        } catch (err) {
            console.error('Error unsubscribing:', err);
        }
    };

    return {
        subscription,
        permission,
        loading,
        subscribe,
        unsubscribe,
        isSupported: 'serviceWorker' in navigator && 'PushManager' in window
    };
}
