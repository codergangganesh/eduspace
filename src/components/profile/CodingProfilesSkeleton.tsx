import { Skeleton } from "@/components/ui/skeleton";

export function CodingProfilesSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-pulse">
      {/* Header Bar Skeleton */}
      <div className="p-3.5 sm:p-5 rounded-2xl border border-border/70 bg-card/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <Skeleton className="h-7 w-40 rounded-xl shrink-0" />
            <div className="flex items-center gap-1.5 sm:hidden">
              <Skeleton className="h-8 w-24 rounded-xl" />
              <Skeleton className="size-8 rounded-xl" />
              <Skeleton className="size-8 rounded-xl" />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="size-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        </div>

        {/* Mobile Total Solved Banner Skeleton */}
        <div className="sm:hidden mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-6 w-12 rounded-lg" />
        </div>
      </div>

      {/* 2-Column Bento Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="p-7 sm:p-8 rounded-3xl border border-border/70 bg-card/60 space-y-6 min-h-[380px]">
            <div className="flex items-center justify-between border-b border-border/40 pb-5">
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 rounded-2xl" />
                <div>
                  <Skeleton className="h-6 w-32 mb-1.5 rounded-xl" />
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>

            <div className="space-y-4 pt-2">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
