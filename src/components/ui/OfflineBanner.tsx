import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className={cn(
            "bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300 sticky top-0 z-[100] shadow-md"
        )}>
            <WifiOff className="size-4" />
            <span className="text-sm font-medium">
                You’re offline. Changes will sync when back online.
            </span>
            <button
                onClick={() => window.location.reload()}
                className="ml-2 hover:bg-white/20 p-1 rounded-full transition-colors"
                title="Refresh page"
            >
                <RefreshCw className="size-3" />
            </button>
        </div>
    );
}
