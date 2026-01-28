import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Clock,
    MapPin,
    Calendar as CalendarIcon,
    Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSchedule } from "@/hooks/useSchedule";

export default function LecturerTimeTable() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute for the red line
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch ALL schedules (passing undefined as classId)
    const { schedules, loading } = useSchedule(undefined);

    const displayWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const timeSlots = [
        "08:00", "09:00", "10:00", "11:00", "12:00",
        "13:00", "14:00", "15:00", "16:00", "17:00",
    ];

    const goToPreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
    const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const goToToday = () => setCurrentDate(new Date());

    // Current time line calculation
    const getCurrentTimePosition = () => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        // Grid starts at 08:00
        if (hours < 8 || hours > 17) return null;
        return ((hours - 8) * 60 + minutes) / 60 * 80;
    };

    const timePosition = getCurrentTimePosition();

    // Helper to determine event position and height
    const getEventStyle = (startTime: string, endTime: string) => {
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);

        // Grid starts at 08:00. Height unit is 80px per hour.
        const startOffset = ((startH - 8) * 60 + startM);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

        // Add 1px buffer for borders
        const top = Math.max(0, (startOffset / 60) * 80);
        const height = Math.max(40, (durationMinutes / 60) * 80);

        return { top: `${top}px`, height: `${height}px` };
    };

    // Professional color palette - Soft accents with strong borders
    const getClassColor = (classId: string | null, courseCode: string = '') => {
        if (!classId) return "bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300";

        const colors = [
            "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-400 dark:text-indigo-300",
            "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-400 dark:text-emerald-300",
            "bg-sky-50 border-sky-500 text-sky-700 dark:bg-sky-950/30 dark:border-sky-400 dark:text-sky-300",
            "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/30 dark:border-rose-400 dark:text-rose-300",
            "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/30 dark:border-amber-400 dark:text-amber-300",
            "bg-violet-50 border-violet-500 text-violet-700 dark:bg-violet-950/30 dark:border-violet-400 dark:text-violet-300",
            "bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/30 dark:border-teal-400 dark:text-teal-300",
            "bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-950/30 dark:border-orange-400 dark:text-orange-300",
        ];

        let hash = 0;
        const str = classId + courseCode;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout fullHeight>
            <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur z-20">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <CalendarIcon className="size-5" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight">Master Time Table</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-secondary/50 rounded-lg border border-border p-0.5">
                            <Button variant="ghost" size="icon" onClick={goToPreviousWeek} className="h-8 w-8 hover:bg-background shadow-none">
                                <ChevronLeft className="size-4" />
                            </Button>
                            <div className="px-4 text-sm font-medium min-w-[140px] text-center border-x border-border/50 h-5 flex items-center justify-center">
                                {format(displayWeekStart, "MMM d")} - {format(addDays(displayWeekStart, 6), "MMM d, yyyy")}
                            </div>
                            <Button variant="ghost" size="icon" onClick={goToNextWeek} className="h-8 w-8 hover:bg-background shadow-none">
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={goToToday} className="h-9">
                            Today
                        </Button>
                    </div>
                </div>

                {/* Calendar Grid Container */}
                <div className="flex-1 overflow-auto custom-scrollbar p-6">
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden min-w-[1000px] flex flex-col">

                        {/* Days Header */}
                        <div className="grid grid-cols-8 divide-x divide-border border-b border-border bg-muted/20">
                            <div className="w-20 shrink-0 p-4 border-r border-border bg-background/50 backdrop-blur sticky left-0 z-30">
                                {/* Apps corner */}
                            </div>
                            {days.map((day, index) => {
                                const date = addDays(displayWeekStart, index);
                                const isToday = isSameDay(date, new Date());
                                return (
                                    <div key={day} className={cn("py-3 px-2 text-center group", isToday && "bg-primary/5")}>
                                        <p className={cn("text-[11px] font-semibold uppercase tracking-widest mb-1", isToday ? "text-primary" : "text-muted-foreground")}>
                                            {day.slice(0, 3)}
                                        </p>
                                        <div className={cn("size-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold transition-all",
                                            isToday ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground")}>
                                            {format(date, "d")}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Scrollable Time Grid */}
                        <div className="flex-1 overflow-visible relative"> {/* Changed to overflow-visible for sticky time col */}
                            <div className="grid grid-cols-8 divide-x divide-border h-full relative">

                                {/* Time Column (Sticky) */}
                                <div className="w-20 shrink-0 bg-background z-20 sticky left-0 border-r border-border h-full">
                                    {timeSlots.map((time) => (
                                        <div key={time} className="h-20 border-b border-border border-dashed text-xs font-medium text-muted-foreground/70 p-2 text-right relative group">
                                            <span className="-mt-2.5 block">{time}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Days Columns */}
                                {days.map((day, dayIndex) => {
                                    const columnDate = addDays(displayWeekStart, dayIndex);
                                    const isToday = isSameDay(columnDate, new Date());
                                    const columnDateStr = format(columnDate, "yyyy-MM-dd");

                                    // Filter events for this day
                                    const dayEvents = schedules.filter(s => {
                                        if (s.specific_date) return s.specific_date === columnDateStr;
                                        return s.day_of_week === dayIndex;
                                    });

                                    return (
                                        <div key={day} className={cn("relative min-h-[800px]", isToday ? "bg-primary/[0.01]" : "bg-background")}>

                                            {/* Grid Lines */}
                                            {timeSlots.map((time) => (
                                                <div key={time} className="h-20 border-b border-border border-dashed" />
                                            ))}

                                            {/* Current Time Line */}
                                            {isToday && timePosition !== null && (
                                                <div
                                                    className="absolute w-full border-t-2 border-red-500 z-10 pointer-events-none flex items-center"
                                                    style={{ top: `${timePosition}px` }}
                                                >
                                                    <div className="size-2 rounded-full bg-red-500 -ml-1" />
                                                </div>
                                            )}

                                            {/* Events */}
                                            {dayEvents.map((event) => {
                                                const style = getEventStyle(event.start_time, event.end_time);
                                                const colorClass = getClassColor(event.class_id, event.course_code);

                                                return (
                                                    <TooltipProvider key={event.id}>
                                                        <Tooltip delayDuration={200}>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={cn(
                                                                        "absolute left-1 right-1 rounded-md p-2 text-xs border-l-[3px] shadow-sm hover:shadow-md transition-all cursor-default group overflow-hidden bg-opacity-90 hover:bg-opacity-100 ring-1 ring-inset ring-black/5 dark:ring-white/5",
                                                                        colorClass
                                                                    )}
                                                                    style={style}
                                                                >
                                                                    <div className="flex flex-col h-full justify-between gap-0.5">
                                                                        <div>
                                                                            <div className="font-bold truncate text-[11px] uppercase tracking-wide opacity-80 mb-0.5">
                                                                                {event.course_code}
                                                                            </div>
                                                                            <div className="font-semibold truncate leading-tight text-foreground/90">
                                                                                {event.title}
                                                                            </div>
                                                                        </div>
                                                                        {/* Only show location if height permits */}
                                                                        <div className="flex items-center gap-1 opacity-70 text-[10px] mt-auto">
                                                                            <MapPin className="size-3 shrink-0" />
                                                                            <span className="truncate">{event.location || "Online"}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="right" className="p-0 overflow-hidden border-border bg-popover/95 backdrop-blur shadow-xl max-w-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                                                                <div className={cn("h-1.5 w-full", colorClass.split(" ")[0])} />
                                                                <div className="p-4 space-y-3">
                                                                    <div>
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <h4 className="font-bold text-sm leading-tight">{event.title}</h4>
                                                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal capitalize shrink-0">
                                                                                {event.type}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground font-medium mt-1">{event.course_code} • {event.class_name}</p>
                                                                    </div>

                                                                    <div className="space-y-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                                                                        <div className="flex items-center gap-2">
                                                                            <Clock className="size-3.5 text-primary shrink-0" />
                                                                            <span className="font-medium text-foreground">{event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <MapPin className="size-3.5 text-primary shrink-0" />
                                                                            <span className="font-medium text-foreground">{event.location || "Online"}</span>
                                                                        </div>
                                                                    </div>

                                                                    {event.notes && (
                                                                        <div className="pt-2 text-xs italic text-muted-foreground border-t border-border/50">
                                                                            <span className="font-semibold not-italic text-foreground/80 block mb-1">Notes:</span>
                                                                            "{event.notes}"
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
