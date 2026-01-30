import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
    return (
        <div className="flex flex-col space-y-4 p-4 h-full justify-end">
            {/* Incoming Message Skeleton */}
            <div className="flex items-end gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48 rounded-2xl rounded-bl-none" />
                </div>
            </div>

            {/* Outgoing Message Skeleton */}
            <div className="flex items-end gap-2 justify-end">
                <div className="space-y-2">
                    <Skeleton className="h-16 w-64 rounded-2xl rounded-br-none" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            {/* Incoming Message Skeleton */}
            <div className="flex items-end gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-32 rounded-2xl rounded-bl-none" />
                </div>
            </div>

            {/* Outgoing Message Skeleton */}
            <div className="flex items-end gap-2 justify-end">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-40 rounded-2xl rounded-br-none" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        </div>
    );
}
