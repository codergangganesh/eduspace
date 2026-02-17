import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PremiumCardSkeletonProps {
    className?: string;
    viewMode?: 'grid' | 'list';
}

export function PremiumCardSkeleton({ className, viewMode = 'grid' }: PremiumCardSkeletonProps) {
    if (viewMode === 'list') {
        return (
            <Card className={cn(
                "group relative overflow-hidden border shadow-sm w-full rounded-xl bg-white dark:bg-[#3c3744] border-slate-200 dark:border-white/5",
                className
            )}>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-3 md:w-48 shrink-0">
                        <Skeleton className="size-12 rounded-xl" />
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-16 rounded-full" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex items-center gap-4 hidden md:flex shrink-0 pr-4">
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-9 w-full md:w-32 rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "group relative overflow-hidden border-none shadow-lg w-full flex flex-col h-full rounded-[2rem] bg-white dark:bg-[#1a1625]",
            className
        )}>
            {/* Header Section Skeleton */}
            <div className="relative h-28 bg-slate-200 dark:bg-white/5 p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-20 rounded-lg bg-white/20 dark:bg-white/10" />
                    <Skeleton className="h-6 w-16 rounded-lg bg-white/20 dark:bg-white/10" />
                </div>
            </div>

            {/* Content Body */}
            <CardContent className="p-5 flex flex-col h-full gap-5">
                <div className="space-y-3">
                    <Skeleton className="h-7 w-3/4" />
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="size-7 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <div className="flex gap-2.5">
                        <Skeleton className="h-12 flex-1 rounded-2xl" />
                        <Skeleton className="h-12 flex-1 rounded-2xl" />
                    </div>
                </div>

                <div className="mt-auto pt-2">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
            </CardContent>
        </Card>
    );
}
