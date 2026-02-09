import { Skeleton } from "@/components/ui/skeleton";

export function NotificationSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-32 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
            </div>

            {/* Invitations Section Skeleton */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="size-5 rounded-full" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-4">
                <div className="flex gap-2 pb-2 border-b border-slate-100 dark:border-white/5 overflow-x-auto">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-9 w-24 rounded-lg shrink-0" />
                    ))}
                </div>

                {/* List Skeleton */}
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex items-start gap-4 p-4 border border-slate-100 dark:border-white/5 rounded-xl bg-surface">
                            <Skeleton className="size-10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-5 w-1/3" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
