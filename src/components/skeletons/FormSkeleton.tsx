import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function FormSkeleton() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Main Form Section */}
                    <Card className="rounded-2xl border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-6">
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-32 w-full rounded-xl" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-11 w-full rounded-xl" />
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-11 w-full rounded-xl" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Secondary Section */}
                    <Card className="rounded-2xl border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-6 flex flex-row items-center justify-between">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-9 w-24 rounded-lg" />
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-24 w-full rounded-xl" />
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar info */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-slate-900 text-white p-8 space-y-6">
                        <Skeleton className="h-6 w-32 bg-white/10" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-20 bg-white/10" />
                                    <Skeleton className="h-4 w-12 bg-white/10" />
                                </div>
                            ))}
                        </div>
                        <Skeleton className="h-10 w-full rounded-xl bg-white/10 pt-4" />
                    </Card>
                </div>
            </div>
        </div>
    );
}
