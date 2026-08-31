import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HelmetProvider } from 'react-helmet-async';
import { initializeCapacitor } from "./lib/capacitor";
import { preloadImage, readCachedProfileIdentity, warmShellImages } from "./lib/imagePerformance";
import { initSentry } from "./lib/sentry";
import { GlobalErrorBoundary } from "./components/common/GlobalErrorBoundary";

// Initialize Sentry error and performance tracking
initSentry();

const silenceConsoleOutput = () => {
    const noop = () => undefined;
    const methods = ["log", "debug", "info", "warn", "error", "trace"] as const;

    methods.forEach((method) => {
        (console as unknown as Record<string, unknown>)[method] = noop;
    });
};

silenceConsoleOutput();

// Initialize native features
initializeCapacitor();
void warmShellImages();

const cachedIdentity = readCachedProfileIdentity();
if (cachedIdentity?.avatarUrl) {
    void preloadImage(cachedIdentity.avatarUrl, "high");
}

// Prevent Vite dev overlay and blank screens from crashing on background network fetch failures
window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = typeof reason?.message === "string" ? reason.message : "";

    if (
        reason &&
        (reason.name === "AuthRetryableFetchError" ||
            message.includes("Failed to fetch") ||
            message.includes("NetworkError") ||
            message.includes("Load failed") ||
            (reason.constructor && reason.constructor.name === "TypeError" && message.includes("Failed to fetch")))
    ) {
        // 🔐 Silently suppress network errors to prevent freezing the UI.
        // window.confirm() was causing AI streams to hang/refresh.
        event.preventDefault();
        return;
    }
});

// In development, remove stale PWA workers/caches so Vite module URLs don't get cached.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    void (async () => {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            const staleRegistrations = registrations.filter((registration) => {
                const scriptUrl = registration.active?.scriptURL
                    ?? registration.waiting?.scriptURL
                    ?? registration.installing?.scriptURL
                    ?? "";

                return !scriptUrl.includes('firebase-messaging-sw.js');
            });

            await Promise.all(staleRegistrations.map((registration) => registration.unregister()));

            if ('caches' in window) {
                const cacheKeys = await caches.keys();
                const staleCacheKeys = cacheKeys.filter((key) =>
                    key.includes('workbox')
                    || key.includes('vite-plugin-pwa')
                    || key.includes('precache')
                );

                await Promise.all(staleCacheKeys.map((key) => caches.delete(key)));
            }
        } catch (_error) {}
    })();
}

window.addEventListener("error", (_event) => {});

createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
        <GlobalErrorBoundary>
            <App />
        </GlobalErrorBoundary>
    </HelmetProvider>
);
