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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-lg">
            {/* Abstract Shapes/Background Pattern */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-100">
                        <CalendarDays className="size-4" />
                        <span className="text-sm font-medium">{dateString}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Welcome back, {fullName}!
                    </h1>
                    <p className="max-w-xl text-indigo-100">
                        You have a few assignments due this week. Stay focused and keep learning!
                    </p>
                </div>


            </div>
        </div>
    );
}
