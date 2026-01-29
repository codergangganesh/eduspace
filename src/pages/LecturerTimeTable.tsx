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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSchedule } from "@/hooks/useSchedule";

const TIME_COLUMN_WIDTH = 56;

export default function LecturerTimeTable() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const { schedules, loading } = useSchedule(undefined);

    const displayWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

    const goToPreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
    const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const goToToday = () => setCurrentDate(new Date());

    // Calculate dynamic hour height (10 slots should fill available space)
    const HOUR_HEIGHT_PERCENT = 100 / timeSlots.length;

    const getCurrentTimePosition = () => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        if (hours < 8 || hours > 17) return null;
        return ((hours - 8) * 60 + minutes) / 60 * HOUR_HEIGHT_PERCENT;
    };

    const timePosition = getCurrentTimePosition();

    const getEventStyle = (startTime: string, endTime: string) => {
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);

        const startOffset = ((startH - 8) * 60 + startM);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

        const top = (startOffset / 60) * HOUR_HEIGHT_PERCENT;
        const height = Math.max(2, (durationMinutes / 60) * HOUR_HEIGHT_PERCENT - 0.5);

        return { top: `${top}%`, height: `${height}%` };
    };

    const getClassColor = (classId: string | null, courseCode: string = '') => {
        if (!classId) return "bg-slate-100 border-l-slate-400 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

        const colors = [
            "bg-blue-100 border-l-blue-500 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
            "bg-emerald-100 border-l-emerald-500 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
            "bg-violet-100 border-l-violet-500 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
            "bg-amber-100 border-l-amber-500 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
            "bg-rose-100 border-l-rose-500 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
            "bg-cyan-100 border-l-cyan-500 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200",
            "bg-orange-100 border-l-orange-500 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
            "bg-teal-100 border-l-teal-500 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200",
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
            <DashboardLayout fullHeight>
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout fullHeight>
            <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <CalendarIcon className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Master Time Table</h1>
                            <p className="text-xs text-muted-foreground">All your classes at a glance</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-muted/50 rounded-lg border border-border">
                            <Button variant="ghost" size="icon" onClick={goToPreviousWeek} className="h-8 w-8 rounded-r-none">
                                <ChevronLeft className="size-4" />
                            </Button>
                            <div className="px-3 text-xs font-medium min-w-[150px] text-center border-x border-border">
                                {format(displayWeekStart, "MMM d")} - {format(addDays(displayWeekStart, 6), "MMM d, yyyy")}
                            </div>
                            <Button variant="ghost" size="icon" onClick={goToNextWeek} className="h-8 w-8 rounded-l-none">
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs">
                            Today
                        </Button>
                    </div>
                </div>

                {/* Calendar Container - fills remaining space */}
                <div className="flex-1 flex flex-col min-h-0 p-4">
                    <div className="flex-1 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        {/* Days Header Row */}
                        <div className="flex border-b border-border bg-muted/30 shrink-0">
                            <div className="shrink-0 border-r border-border bg-muted/50 flex items-center justify-center" style={{ width: TIME_COLUMN_WIDTH }} />
                            {days.map((day, index) => {
                                const date = addDays(displayWeekStart, index);
                                const isToday = isSameDay(date, new Date());
                                return (
                                    <div
                                        key={day}
                                        className={cn(
                                            "flex-1 py-2 text-center border-r border-border last:border-r-0",
                                            isToday && "bg-primary/5"
                                        )}
                                    >
                                        <p className={cn("text-[10px] font-semibold uppercase tracking-wider", isToday ? "text-primary" : "text-muted-foreground")}>
                                            {day}
                                        </p>
                                        <div className={cn("mt-0.5 size-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold",
                                            isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                                        )}>
                                            {format(date, "d")}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Time Grid Body - fills remaining space */}
                        <div className="flex-1 flex relative min-h-0">
                            {/* Time Labels Column */}
                            <div className="shrink-0 bg-muted/10 border-r border-border flex flex-col" style={{ width: TIME_COLUMN_WIDTH }}>
                                {timeSlots.map((time, idx) => (
                                    <div
                                        key={time}
                                        className="flex-1 border-b border-border/50 last:border-b-0 text-[10px] font-medium text-muted-foreground pr-2 pt-0.5 text-right"
                                    >
                                        {time}
                                    </div>
                                ))}
                            </div>

                            {/* Days Columns */}
                            {days.map((day, dayIndex) => {
                                const columnDate = addDays(displayWeekStart, dayIndex);
                                const isToday = isSameDay(columnDate, new Date());
                                const columnDateStr = format(columnDate, "yyyy-MM-dd");

                                const dayEvents = schedules.filter(s => {
                                    if (s.specific_date) return s.specific_date === columnDateStr;
                                    return s.day_of_week === dayIndex;
                                });

                                return (
                                    <div
                                        key={day}
                                        className={cn(
                                            "flex-1 relative border-r border-border last:border-r-0 flex flex-col",
                                            isToday ? "bg-primary/[0.02]" : "bg-background"
                                        )}
                                    >
                                        {/* Hour Grid Lines */}
                                        {timeSlots.map((time) => (
                                            <div key={time} className="flex-1 border-b border-dashed border-border/40 last:border-b-0" />
                                        ))}

                                        {/* Current Time Line */}
                                        {isToday && timePosition !== null && (
                                            <div
                                                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                                                style={{ top: `${timePosition}%` }}
                                            >
                                                <div className="size-2 rounded-full bg-red-500 -ml-1 shadow-sm" />
                                                <div className="flex-1 h-0.5 bg-red-500" />
                                            </div>
                                        )}

                                        {/* Events */}
                                        {dayEvents.map((event) => {
                                            const style = getEventStyle(event.start_time, event.end_time);
                                            const colorClass = getClassColor(event.class_id, event.course_code);

                                            return (
                                                <TooltipProvider key={event.id}>
                                                    <Tooltip delayDuration={100}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={cn(
                                                                    "absolute left-0.5 right-0.5 rounded px-1.5 py-1 text-[10px] border-l-[3px] shadow-sm hover:shadow-md transition-shadow cursor-default overflow-hidden",
                                                                    colorClass
                                                                )}
                                                                style={style}
                                                            >
                                                                <div className="font-bold truncate uppercase tracking-wide opacity-70 text-[9px]">
                                                                    {event.course_code}
                                                                </div>
                                                                <div className="font-semibold truncate leading-tight">
                                                                    {event.title}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="p-0 overflow-hidden max-w-xs shadow-lg border-border">
                                                            <div className={cn("h-1 w-full", colorClass.split(" ")[0])} />
                                                            <div className="p-2.5 space-y-1.5">
                                                                <div>
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h4 className="font-bold text-xs">{event.title}</h4>
                                                                        <Badge variant="outline" className="text-[9px] h-4 px-1 capitalize shrink-0">
                                                                            {event.type}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        {event.course_code} • {event.class_name}
                                                                    </p>
                                                                </div>
                                                                <div className="space-y-1 text-[10px] bg-muted/50 p-1.5 rounded">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock className="size-3 text-primary" />
                                                                        <span className="font-medium">{event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <MapPin className="size-3 text-primary" />
                                                                        <span className="font-medium">{event.location || "Online"}</span>
                                                                    </div>
                                                                </div>
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
        </DashboardLayout>
    );
}
