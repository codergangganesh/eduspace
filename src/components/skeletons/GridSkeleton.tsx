import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface GridSkeletonProps {
    count?: number;
}

export function GridSkeleton({ count = 6 }: GridSkeletonProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="border-none shadow-md overflow-hidden rounded-2xl">
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
