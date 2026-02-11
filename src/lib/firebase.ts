import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Note: These values should ideally come from environment variables
const firebaseConfig = {
    apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
    authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestForToken = async () => {
    if (!messaging) return null;

    try {
        const currentToken = await getToken(messaging, {
            vapidKey: (import.meta as any).env.VITE_FIREBASE_VAPID_KEY,
        });
        if (currentToken) {
            console.log('Current FCM token:', currentToken);
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return;
        onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            resolve(payload);
        });
    });
