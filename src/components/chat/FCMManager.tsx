import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { requestFirebaseToken, onForegroundMessage } from '@/lib/firebase';

export function FCMManager() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        // Handle Web/PWA Platform
        if (!Capacitor.isNativePlatform()) {
            console.log("Initializing Web FCM...");
            requestFirebaseToken(user.id);

            // Listen for foreground messages
            const unsubscribe = onForegroundMessage((payload: any) => {
                console.log('Foreground message received:', payload);
                if (payload.data?.type === 'incoming_call') {
                    toast.info(`Incoming Call`, {
                        description: `${payload.data.callerName || 'Someone'} is calling you...`,
                        action: {
                            label: 'Accept',
                            onClick: () => {
                                navigate(`/messages?session=${payload.data.sessionId}&action=accept`);
                            }
                        },
                        duration: 10000
                    });
                } else if (payload.notification) {
                    toast.info(payload.notification.title || 'New Message', {
                        description: payload.notification.body
                    });
                }
            });

            return () => unsubscribe();
        }

        // Handle Native Platform (Capacitor)
        if (Capacitor.getPlatform() === 'android') {
            PushNotifications.createChannel({
                id: 'calls',
                name: 'Incoming Calls',
                description: 'Notifications for incoming video and audio calls',
                importance: 5, // HIGH
                visibility: 1, // PUBLIC
                sound: 'notification_ringtone',
                vibration: true,
            }).catch(e => console.error('Error creating channel:', e));
        }

        const registerPush = async () => {
            try {
                const result = await PushNotifications.requestPermissions();
                if (result.receive === 'granted') {
                    await PushNotifications.register();
                }
            } catch (e) {
                console.warn("FCM registration failed:", e);
            }
        };

        PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
            if (user) {
                await supabase
                    .from('profiles')
                    .update({ fcm_token: token.value })
                    .eq('user_id', user.id);
            }
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ', notification);
            if (notification.data?.type === 'incoming_call') {
                toast.info(`Incoming Call`, {
                    description: `${notification.data.callerName || 'Someone'} is calling you...`,
                    action: {
                        label: 'Accept',
                        onClick: () => {
                            navigate(`/messages?session=${notification.data.sessionId}&action=accept`);
                        }
                    },
                    duration: 10000
                });
            } else {
                toast.info(notification.title || 'New Notification', {
                    description: notification.body
                });
            }
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            const data = notification.notification.data;
            if (data?.url) {
                navigate(data.url);
            } else if (data?.sessionId) {
                navigate(`/messages?session=${data.sessionId}${data.type === 'incoming_call' ? '&action=accept' : ''}`);
            }
        });

        registerPush();

        return () => {
            PushNotifications.removeAllListeners();
        };

    }, [user]);

    return null;
}
