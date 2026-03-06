
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HelmetProvider } from 'react-helmet-async';
import { initializeCapacitor } from "./lib/capacitor";

// Initialize native features
initializeCapacitor();

// Prevent Vite dev overlay and blank screens from crashing on background network fetch failures
window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (
        reason &&
        (reason.name === "AuthRetryableFetchError" ||
            reason.message?.includes("Failed to fetch") ||
            reason.message?.includes("NetworkError") ||
            reason.message?.includes("Load failed") ||
            (reason.constructor && reason.constructor.name === "TypeError" && reason.message?.includes("Failed to fetch")))
    ) {
        console.warn("Caught suppressed network error (likely background refresh or DNS issue):", reason);

        // Show a non-intrusive log but prevent the crash overlay in development
        if (window.confirm && reason.message?.includes("Failed to fetch") && !localStorage.getItem('net_error_shown')) {
            console.log("Network request failed. This is often due to unstable mobile DNS or Supabase being unreachable.");
            localStorage.setItem('net_error_shown', 'true');
            setTimeout(() => localStorage.removeItem('net_error_shown'), 60000);
        }

        event.preventDefault();
        return;
    }

    // Log unexpected errors for mobile debugging
    console.error("Unhandled Rejection:", reason);
});

// Clear old service workers if the hostname has changed or if they are stuck
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
            // Keep the Firebase SW to avoid registration loops
            if (registration.active?.scriptURL.includes('firebase-messaging-sw.js')) {
                continue;
            }
            registration.unregister();
        }
    });
}

window.addEventListener("error", (event) => {
    console.error("Global Error:", event.error);
});

createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
        <App />
    </HelmetProvider>
);
