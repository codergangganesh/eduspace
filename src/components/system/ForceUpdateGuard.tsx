import { APP_VERSION } from "@/lib/appVersion";
import { useEffect, useState } from "react";

const UPDATE_CHECK_INTERVAL_MS = 45_000;
const FORCE_UPDATE_STORAGE_KEY = "force-update-required";
const FORCE_UPDATE_EVENT = "eduspace-force-update-required";

type VersionResponse = {
    version?: string;
};

async function getServerVersion(signal?: AbortSignal) {
    const response = await fetch(`/api/version?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
            "cache-control": "no-cache",
            pragma: "no-cache",
        },
        signal,
    });

    if (!response.ok) {
        throw new Error(`Version check failed with status ${response.status}`);
    }

    return (await response.json()) as VersionResponse;
}

async function forceRefreshApp() {
    if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
    }

    const url = new URL(window.location.href);
    url.searchParams.set("forceUpdate", Date.now().toString());
    window.location.replace(url.toString());
}

function activateForceUpdate() {
    sessionStorage.setItem(FORCE_UPDATE_STORAGE_KEY, "true");
    window.dispatchEvent(new Event(FORCE_UPDATE_EVENT));
}

export function markForceUpdateRequired() {
    activateForceUpdate();
}

export function ForceUpdateGuard() {
    const [updateRequired, setUpdateRequired] = useState(() => sessionStorage.getItem(FORCE_UPDATE_STORAGE_KEY) === "true");
    const [isReloading, setIsReloading] = useState(false);

    useEffect(() => {
        const handleForceUpdateRequired = () => {
            setUpdateRequired(true);
        };

        window.addEventListener(FORCE_UPDATE_EVENT, handleForceUpdateRequired);

        if (import.meta.env.DEV) {
            return () => {
                window.removeEventListener(FORCE_UPDATE_EVENT, handleForceUpdateRequired);
            };
        }

        let isMounted = true;
        let intervalId: number | undefined;

        const checkVersion = async () => {
            const controller = new AbortController();

            try {
                const data = await getServerVersion(controller.signal);
                if (isMounted && data.version && data.version !== APP_VERSION) {
                    activateForceUpdate();
                }
            } catch (error) {
                console.warn("Version check skipped:", error);
            }

            return () => controller.abort();
        };

        void checkVersion();
        intervalId = window.setInterval(() => {
            void checkVersion();
        }, UPDATE_CHECK_INTERVAL_MS);

        return () => {
            isMounted = false;
            if (intervalId) {
                window.clearInterval(intervalId);
            }
            window.removeEventListener(FORCE_UPDATE_EVENT, handleForceUpdateRequired);
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = updateRequired ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [updateRequired]);

    if (!updateRequired) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[200000] flex items-center justify-center bg-slate-950 px-6 text-white">
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/95 p-8 text-center shadow-2xl">
                <h2 className="text-3xl font-black tracking-tight">New update available</h2>
                <p className="mt-3 text-sm text-slate-300">
                    A new version of the app is ready. Please update now to continue.
                </p>
                <button
                    type="button"
                    onClick={async () => {
                        setIsReloading(true);
                        try {
                            await forceRefreshApp();
                        } catch (error) {
                            console.error("Force update failed:", error);
                            window.location.reload();
                        }
                    }}
                    className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-6 text-base font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isReloading}
                >
                    {isReloading ? "Updating..." : "Update Now"}
                </button>
            </div>
        </div>
    );
}
