
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
        event.preventDefault();
        return;
    }

    // Log unexpected errors for mobile debugging if possible
    console.error("Unhandled Rejection:", reason);
});

window.addEventListener("error", (event) => {
    console.error("Global Error:", event.error);
});

createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
        <App />
    </HelmetProvider>
);
