import { Skeleton } from "@/components/ui/skeleton";

export function TimeTableSkeleton() {
    return (
        <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between pb-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
            </div>

            {/* Grid Header Skeleton */}
            <div className="border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden bg-surface shadow-sm">
                <div className="grid grid-cols-8 border-b border-slate-100 dark:border-white/5">
                    <div className="p-4 border-r border-slate-100 dark:border-white/5">
                        <Skeleton className="h-4 w-8 mx-auto" />
                    </div>
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="p-4 text-center">
                            <Skeleton className="h-4 w-12 mx-auto mb-2" />
                            <Skeleton className="h-6 w-8 mx-auto rounded-full" />
                        </div>
                    ))}
                </div>

                {/* Grid Body Skeleton */}
                <div className="relative h-[600px] overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-8 h-full">
                        <div className="col-span-1 border-r border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="h-[60px] p-2 text-right">
                                    <Skeleton className="h-3 w-8 ml-auto" />
                                </div>
                            ))}
                        </div>
                        <div className="col-span-7 relative">
                            {/* Fake Events */}
                            <Skeleton className="absolute top-[120px] left-[5%] w-[15%] h-[90px] rounded-lg opacity-40 bg-blue-500/20" />
                            <Skeleton className="absolute top-[240px] left-[20%] w-[12%] h-[60px] rounded-lg opacity-40 bg-emerald-500/20" />
                            <Skeleton className="absolute top-[60px] left-[45%] w-[18%] h-[120px] rounded-lg opacity-40 bg-violet-500/20" />
                            <Skeleton className="absolute top-[300px] left-[75%] w-[20%] h-[90px] rounded-lg opacity-40 bg-amber-500/20" />

                            {/* Horizontal Grid Lines */}
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="absolute w-full h-px bg-slate-100 dark:bg-white/5" style={{ top: `${i * 60}px` }} />
                            ))}

                            {/* Vertical Grid Lines */}
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="absolute h-full w-px bg-slate-100 dark:border-white/5" style={{ left: `${(i + 1) * (100 / 7)}%` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
