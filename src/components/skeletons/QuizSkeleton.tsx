import { Skeleton } from "@/components/ui/skeleton";

export function QuizSkeleton() {
    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0A0C14] transition-colors duration-300 animate-in fade-in duration-500">
            {/* Quiz Header Skeleton */}
            <div className="h-20 bg-white dark:bg-[#0A0C14] border-b border-slate-200 dark:border-white/5 px-6 sm:px-12 flex items-center justify-between shadow-sm relative z-10 transition-colors">
                <div className="flex items-center gap-4">
                    <Skeleton className="size-10 rounded-full bg-slate-100 dark:bg-white/5" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48 bg-slate-100 dark:bg-white/5" />
                        <Skeleton className="h-3 w-32 bg-slate-100 dark:bg-white/5" />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-center">
                        <Skeleton className="h-3 w-16 mb-2 bg-slate-100 dark:bg-white/5" />
                        <Skeleton className="h-5 w-24 bg-slate-100 dark:bg-white/5" />
                    </div>
                    <Skeleton className="h-10 w-28 rounded-full bg-slate-100 dark:bg-white/5" />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Skeleton (Question Map) */}
                <div className="hidden lg:flex w-80 bg-white dark:bg-[#0A0C14] border-r border-slate-200 dark:border-white/5 flex-col transition-colors">
                    <div className="p-8 space-y-6">
                        <Skeleton className="h-6 w-32 bg-slate-100 dark:bg-white/5" />
                        <div className="grid grid-cols-4 gap-3">
                            {[...Array(12)].map((_, i) => (
                                <Skeleton key={i} className="aspect-square w-full rounded-xl bg-slate-100 dark:bg-white/5" />
                            ))}
                        </div>
                    </div>
                    <div className="mt-auto p-8 border-t border-slate-100 dark:border-white/5 space-y-4">
                        <Skeleton className="h-10 w-full rounded-xl bg-slate-100 dark:bg-white/5" />
                        <Skeleton className="h-10 w-full rounded-xl bg-slate-100 dark:bg-white/5" />
                    </div>
                </div>

                {/* Question Area Skeleton */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#0A0C14]/50 p-6 sm:p-12">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="bg-white dark:bg-[#11131F] rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/50 dark:border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-6 w-24 bg-slate-100 dark:bg-white/5" />
                                <Skeleton className="h-6 w-16 bg-slate-100 dark:bg-white/5" />
                            </div>
                            <Skeleton className="h-10 w-full bg-slate-100 dark:bg-white/5" />
                            <Skeleton className="h-6 w-3/4 bg-slate-100 dark:bg-white/5" />

                            <div className="space-y-4 pt-6">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-white/5" />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <Skeleton className="h-12 w-32 rounded-xl bg-slate-100 dark:bg-white/5" />
                            <Skeleton className="h-12 w-32 rounded-xl bg-slate-100 dark:bg-white/5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
