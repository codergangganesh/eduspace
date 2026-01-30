import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
            {/* Left Sidebar Skeleton */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-800">
                {/* Sidebar Header */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                </div>

                {/* Search Skeleton */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                    <Skeleton className="h-9 w-full rounded-lg" />
                </div>

                {/* Conversation List Skeleton */}
                <div className="flex-1 p-2 space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-2 py-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-10" />
                                </div>
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Chat Area Skeleton */}
            <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900">
                {/* Chat Header Skeleton */}
                <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>

                {/* Messages Skeleton */}
                <div className="flex-1 p-6 space-y-6 overflow-hidden">
                    {/* Incoming */}
                    <div className="flex items-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-10 w-48 rounded-2xl rounded-bl-none" />
                    </div>

                    {/* Outgoing */}
                    <div className="flex items-end gap-2 justify-end">
                        <Skeleton className="h-16 w-64 rounded-2xl rounded-br-none" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>

                    {/* Incoming */}
                    <div className="flex items-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-10 w-32 rounded-2xl rounded-bl-none" />
                    </div>

                    {/* Outgoing */}
                    <div className="flex items-end gap-2 justify-end">
                        <Skeleton className="h-10 w-40 rounded-2xl rounded-br-none" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>

                {/* Input Area Skeleton */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <Skeleton className="h-12 w-full rounded-full" />
                </div>
            </div>
        </div>
    );
}
