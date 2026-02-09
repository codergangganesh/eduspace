import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="bg-surface border border-slate-200 dark:border-white/5 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8 shadow-sm">
                <Skeleton className="size-32 rounded-full" />
                <div className="flex-1 space-y-4 text-center sm:text-left">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 mx-auto sm:mx-0" />
                        <Skeleton className="h-4 w-48 mx-auto sm:mx-0" />
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-2">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-32 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Skeleton */}
                <div className="lg:col-span-1">
                    <div className="bg-surface border border-slate-200 dark:border-white/5 rounded-xl p-2 space-y-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-11 w-full rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Form Skeleton */}
                <div className="lg:col-span-3">
                    <div className="bg-surface border border-slate-200 dark:border-white/5 rounded-xl p-6 sm:p-8 space-y-8 shadow-sm">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-9 w-24" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 pt-4">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                            <Skeleton className="h-10 w-24 rounded-lg" />
                            <Skeleton className="h-10 w-32 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
