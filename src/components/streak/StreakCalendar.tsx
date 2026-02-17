import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    getDay,
    isToday,
    parseISO,
    startOfWeek,
    endOfWeek
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Flame, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Diamond } from 'lucide-react';
import { useStreak } from '@/contexts/StreakContext';
import { Button } from '@/components/ui/button';
import { getStreakHeat } from '@/services/streakService';

interface StreakCalendarProps {
    lastActionDate: string | null;
    currentStreak: number;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
    lastActionDate,
    currentStreak
}) => {
    const { activityLog, fetchActivityRange } = useStreak();
    const [viewDate, setViewDate] = useState(new Date());

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);

    // Get the start of the first week and end of the last week to fill the grid
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = useMemo(() => {
        return eachDayOfInterval({
            start: calendarStart,
            end: calendarEnd,
        });
    }, [calendarStart, calendarEnd]);

    // Fetch activity for this month whenever viewDate or streak changes
    useEffect(() => {
        const startStr = format(calendarStart, 'yyyy-MM-dd');
        const endStr = format(calendarEnd, 'yyyy-MM-dd');
        fetchActivityRange(startStr, endStr);
    }, [viewDate, fetchActivityRange, calendarStart, calendarEnd, lastActionDate, currentStreak]);

    const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
    const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));
    const handleToday = () => setViewDate(new Date());

    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-200/60 dark:border-slate-800 h-full flex flex-col">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <CalendarIcon className="size-6 text-primary" />
                        Activity History
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Track your consistency journey</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrevMonth}
                            className="size-8 rounded-lg hover:bg-white dark:hover:bg-slate-700"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <div className="px-4 min-w-[140px] text-center">
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                {format(viewDate, 'MMMM yyyy')}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNextMonth}
                            className="size-8 rounded-lg hover:bg-white dark:hover:bg-slate-700"
                            disabled={isSameDay(monthStart, startOfMonth(new Date()))}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToday}
                        className="rounded-xl border-slate-200 dark:border-slate-700 font-bold text-xs"
                    >
                        Today
                    </Button>
                </div>
            </div>

            {/* Grid Legend */}
            <div className="flex flex-wrap gap-4 mb-6 px-1">
                <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">(1-6)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">(7-29)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">(30-100)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">(&gt;100)</span>
                </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((day, idx) => (
                    <div key={idx} className="text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 flex-1">
                <AnimatePresence mode="wait">
                    {calendarDays.map((day, idx) => {
                        const isCurrentMonth = format(day, 'MM') === format(viewDate, 'MM');
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const isActive = activityLog.includes(dayStr);
                        const isTodayDate = isToday(day);

                        const heat = getStreakHeat(currentStreak);

                        return (
                            <motion.div
                                key={day.toISOString()}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.005 }}
                                className={cn(
                                    "relative aspect-square rounded-full flex flex-col items-center justify-center transition-all group border",
                                    !isCurrentMonth && "invisible",
                                    isActive
                                        ? "bg-slate-50 dark:bg-white/5 border-transparent shadow-sm"
                                        : "bg-slate-50/50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="relative">
                                            {heat.iconType === 'diamond' ? (
                                                <Diamond
                                                    className="size-5 sm:size-7"
                                                    style={{ color: heat.color, fill: heat.fill, filter: `drop-shadow(0 0 10px ${heat.glow})` }}
                                                />
                                            ) : (
                                                <Flame
                                                    className="size-6 sm:size-8"
                                                    style={{ color: heat.color, fill: heat.fill, filter: `drop-shadow(0 0 10px ${heat.glow})` }}
                                                />
                                            )}
                                            <motion.div
                                                animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.02 }}
                                                className="absolute inset-0 blur-lg rounded-full"
                                                style={{ backgroundColor: heat.color }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <span className={cn(
                                    "text-xs sm:text-sm font-black relative z-10 transition-colors",
                                    isActive ? "text-orange-600 dark:text-orange-400" : "text-slate-400 dark:text-slate-600",
                                    isTodayDate && !isActive && "text-primary ring-2 ring-primary/20 bg-primary/5 rounded-lg px-2"
                                )}>
                                    {format(day, 'd')}
                                </span>

                                {/* Tooltip */}
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap z-30 pointer-events-none shadow-xl">
                                    {format(day, 'MMMM do')}
                                    {isActive && <div style={{ color: heat.color }} className="font-bold mt-0.5">{heat.label}</div>}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Footer Summary */}
            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className="size-10 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${getStreakHeat(currentStreak).color}15` }}
                    >
                        {getStreakHeat(currentStreak).iconType === 'diamond' ? (
                            <Diamond className="size-5" style={{ color: getStreakHeat(currentStreak).color }} />
                        ) : (
                            <Flame className="size-5" style={{ color: getStreakHeat(currentStreak).color }} />
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Current Momentum</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white mt-1" style={{ color: getStreakHeat(currentStreak).color }}>
                            {getStreakHeat(currentStreak).label}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};
