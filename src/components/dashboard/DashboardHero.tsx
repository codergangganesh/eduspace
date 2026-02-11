import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHero() {
    const { profile } = useAuth();
    const fullName = profile?.full_name || "Student";

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = today.toLocaleDateString('en-US', options);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg border border-slate-100 dark:border-slate-800 p-8">
            {/* Abstract Shapes/Background Pattern */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-violet-500/5 dark:bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-indigo-500/5 dark:bg-white/10 blur-2xl" />

            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-indigo-200">
                        <CalendarDays className="size-4" />
                        <span className="text-sm font-medium">{dateString}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
                        Welcome back, <span className="text-violet-600 dark:text-violet-400">{fullName}!</span>
                    </h1>
                    <p className="max-w-xl text-slate-500 dark:text-indigo-100/80 font-medium">
                        You have a few assignments due this week. Stay focused and keep learning!
                    </p>
                </div>
            </div>
        </div>
    );
}
