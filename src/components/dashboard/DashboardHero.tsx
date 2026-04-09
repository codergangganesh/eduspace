import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Calendar, Play } from "lucide-react";

import { TypewriterName } from "../common/TypewriterName";

export function DashboardHero() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const fullName = profile?.full_name || "Student";

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = today.toLocaleDateString('en-US', options);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 p-5 sm:p-8">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-violet-500/5 dark:bg-white/10 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between gap-4">
                <div id="tour-welcome" className="space-y-1 sm:space-y-3">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-indigo-200 opacity-80">
                        <CalendarDays className="size-3 sm:size-4" />
                        <span className="text-[10px] sm:text-sm font-medium uppercase tracking-wider">{dateString}</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                        Welcome, <TypewriterName name={fullName} className="text-indigo-600 dark:text-indigo-400" />!
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <p className="text-slate-500 dark:text-indigo-100/80 font-semibold text-xs sm:text-base max-w-xl">
                            <span className="inline sm:hidden">Academic Overview</span>
                            <span className="hidden sm:inline">You have a few assignments due this week. Stay focused and keep learning!</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent("open-app-guide"))}
                        className="size-9 sm:size-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shadow-sm active:scale-95 group"
                        title="Start Welcome Tour"
                    >
                        <Play className="size-[18px] sm:size-[22px] fill-indigo-600 dark:fill-indigo-400 ml-0.5 group-hover:drop-shadow-[0_0_8px_rgba(79,70,229,0.3)] transition-all" />
                    </button>
                    <button
                        onClick={() => navigate("/schedule")}
                        className="size-9 sm:size-11 rounded-xl bg-violet-50 dark:bg-slate-800 border border-violet-100 dark:border-slate-700 flex items-center justify-center text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 group"
                        title="View Schedule"
                    >
                        <Calendar className="size-[18px] sm:size-[22px] group-hover:drop-shadow-[0_0_8px_rgba(124,58,237,0.3)] transition-all" />
                    </button>
                </div>
            </div>
        </div>
    );
}
