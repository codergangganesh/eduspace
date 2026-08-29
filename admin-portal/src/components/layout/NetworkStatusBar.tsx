import React, { useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const NetworkStatusBar: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  // If online and was not recently offline, don't show floating pill
  if (isOnline && !wasOffline) return null;

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      window.location.reload();
    }, 600);
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0 z-[99999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-300">
      {!isOnline ? (
        <div
          className={cn(
            "flex items-center gap-2.5 px-3.5 py-2 rounded-full shadow-2xl border backdrop-blur-xl pointer-events-auto",
            "bg-zinc-950/90 dark:bg-zinc-900/95 border-zinc-700/80 text-zinc-100 shadow-black/40"
          )}
        >
          {/* Pulsing Amber Status Dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>

          <span className="text-xs font-medium text-zinc-200">
            Offline · Reconnecting...
          </span>

          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 ml-1 px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Retry network connection"
          >
            <RefreshCw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-full shadow-2xl border backdrop-blur-xl pointer-events-auto",
            "bg-zinc-950/90 dark:bg-zinc-900/95 border-emerald-500/40 text-zinc-100 shadow-black/40 animate-in fade-in"
          )}
        >
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-xs font-medium text-zinc-200">
            Connection restored
          </span>
        </div>
      )}
    </div>
  );
};

