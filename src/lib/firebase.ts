import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "@/integrations/supabase/client";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId;

// Initialize Firebase only if config is valid
let app = null;
let messaging = null;

if (isConfigValid) {
    try {
        app = initializeApp(firebaseConfig);
        messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
    }
} else {
    console.warn("Firebase configuration is missing or incomplete. Some features like push notifications might not work.");
}

export const requestFirebaseToken = async (userId: string) => {
    if (!messaging) return null;

    try {
        // Safety check for mobile browsers or non-secure contexts
        if (typeof window === 'undefined' || !('Notification' in window)) {
            console.warn("Notifications are not supported in this browser environment.");
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn("Notification permission NOT granted");
            return null;
        }

        // Register the service worker explicitly for Firebase if not already registered
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            const hasSW = registrations.some(r => r.active?.scriptURL.includes('firebase-messaging-sw.js'));

            if (!hasSW) {
                console.log("Registering Firebase Service Worker...");
                await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/firebase-cloud-messaging-push-scope',
                });
            }
        }

        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (token) {
            // Update profile with FCM token
            const { error } = await supabase
                .from('profiles')
                .update({ fcm_token: token })
                .eq('user_id', userId);

            if (error) {
                console.error("Error updating profile with FCM token:", error);
            }

            return token;
        } else {
            console.warn("No registration token available. Request permission to generate one.");
            return null;
        }
    } catch (err) {
        console.error("An error occurred while retrieving token:", err);
        return null;
    }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
    if (!messaging) return () => { };
    return onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        callback(payload);
    });
};

export { messaging };
