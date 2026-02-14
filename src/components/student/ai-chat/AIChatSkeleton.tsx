import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SidebarSkeleton() {
    return (
        <div className="space-y-4 py-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center px-4 py-3 gap-3">
                    <Skeleton className="h-4 w-4 rounded-md shrink-0" />
                    <Skeleton className={cn(
                        "h-4 rounded-md",
                        i % 2 === 0 ? "w-32" : "w-24"
                    )} />
                </div>
            ))}
        </div>
    );
}

export function MessagesSkeleton() {
    return (
        <div className="space-y-8 py-8 px-4 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                    {/* User Message Skeleton */}
                    <div className="flex justify-end">
                        <div className="flex flex-col items-end gap-2 max-w-[80%]">
                            <Skeleton className="h-10 w-48 rounded-2xl rounded-tr-sm" />
                        </div>
                    </div>
                    {/* Assistant Message Skeleton */}
                    <div className="flex justify-start">
                        <div className="flex gap-4 max-w-[85%]">
                            <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                            <div className="space-y-2 flex-1 pt-1">
                                <Skeleton className="h-4 w-full rounded-md" />
                                <Skeleton className="h-4 w-[90%] rounded-md" />
                                <Skeleton className="h-4 w-[40%] rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function AIChatSkeleton() {
    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Sidebar Skeleton - Desktop */}
            <div className="hidden md:block w-72 shrink-0 h-full border-r border-border/40 bg-card/10">
                <div className="p-4 md:p-6 flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                </div>
                <div className="px-6 pb-2 mt-4 space-y-2">
                    <Skeleton className="h-3 w-20 rounded-md opacity-50" />
                </div>
                <div className="px-3">
                    <SidebarSkeleton />
                </div>
            </div>

            {/* Main Area Skeleton */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                <div className="h-16 shrink-0 border-b border-border/40 bg-background/50 flex items-center px-4 md:px-6 gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl md:hidden" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <MessagesSkeleton />
                </div>
                <div className="p-4 md:p-6 border-t border-border/40">
                    <div className="max-w-4xl mx-auto">
                        <Skeleton className="h-12 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
