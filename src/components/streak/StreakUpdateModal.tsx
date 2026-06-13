import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Flame, ShieldCheck, X } from 'lucide-react';
import { addDays, differenceInCalendarDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';

interface StreakUpdateModalProps {
    streakCount: number;
    guardsUsed?: number;
    guardsRemaining?: number;
    lastActionDate?: string;
    onClose: () => void;
}

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BAR_HEIGHTS = [42, 50, 58, 54, 66, 76, 92];

export const StreakUpdateModal: React.FC<StreakUpdateModalProps> = ({
    streakCount,
    guardsUsed = 0,
    guardsRemaining = 3,
    lastActionDate,
    onClose
}) => {
    const isProtected = guardsUsed > 0;
    const actionDate = lastActionDate ? parseISO(lastActionDate) : new Date();
    const weekStart = startOfWeek(actionDate, { weekStartsOn: 1 });
    const weekDays = WEEK_DAYS.map((label, index) => {
        const date = addDays(weekStart, index);
        const daysBeforeAction = differenceInCalendarDays(actionDate, date);
        const isActive = streakCount > 0 && daysBeforeAction >= 0 && daysBeforeAction < streakCount;

        return {
            label,
            date,
            isActive,
            isCurrent: isSameDay(date, actionDate),
            isFuture: daysBeforeAction < 0,
        };
    });
    const activeDaysThisWeek = weekDays.filter((day) => day.isActive).length;

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
                <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
                />

                <motion.section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="streak-update-title"
                    aria-describedby="streak-update-description"
                    initial={{ scale: 0.96, opacity: 0, y: 22 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 22 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative max-h-[92vh] w-full max-w-[350px] overflow-y-auto rounded-[24px] border border-white/15 bg-[linear-gradient(160deg,#111c3d_0%,#172554_48%,#312e81_100%)] text-white shadow-[0_36px_100px_rgba(15,23,42,0.5)] sm:max-h-[96vh] sm:max-w-[450px] sm:rounded-[30px]"
                >
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px] sm:rounded-[30px]">
                        <div className="absolute -right-24 -top-20 size-64 rounded-full bg-blue-400/15 blur-3xl" />
                        <div className="absolute -bottom-28 -left-20 size-72 rounded-full bg-indigo-400/20 blur-3xl" />
                        <div className="absolute left-1/2 top-44 h-[420px] w-20 -translate-x-1/2 rotate-[28deg] bg-white/[0.025]" />
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close streak update"
                        className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70 sm:right-5 sm:top-5 sm:size-9"
                    >
                        <X className="size-4" />
                    </button>

                    <div className="relative px-4 pb-4 pt-7 sm:px-7 sm:pb-7 sm:pt-10">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-3 flex h-28 w-40 items-center justify-center sm:mb-5 sm:h-44 sm:w-56">
                                <motion.div
                                    initial={{ scale: 0.72, rotate: -8, rotateY: 0 }}
                                    animate={{ 
                                        scale: 1, 
                                        rotate: 0,
                                        rotateY: [0, 360]
                                    }}
                                    transition={{ 
                                        scale: { type: 'spring', stiffness: 230, damping: 17 },
                                        rotate: { type: 'spring', stiffness: 230, damping: 17 },
                                        rotateY: { repeat: Infinity, duration: 8, ease: "linear" }
                                    }}
                                    className="relative flex size-24 items-center justify-center rounded-full border-4 border-amber-200 bg-[linear-gradient(145deg,#fff3b0_0%,#fbbf24_58%,#d97706_100%)] shadow-[0_18px_50px_rgba(245,158,11,0.35),inset_0_2px_0_rgba(255,255,255,0.75)] sm:size-40 sm:border-[6px]"
                                    style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                                >
                                    <div className="absolute inset-2 rounded-full border border-amber-700/20" />
                                    <div className="relative size-16 sm:size-[112px] flex items-center justify-center rounded-full overflow-hidden">
                                        <img 
                                            src="/favicon.png" 
                                            alt="Eduspace Logo" 
                                            className="size-full object-cover rounded-full filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]" 
                                        />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0, y: 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 18 }}
                                    className="absolute left-1/2 top-0 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-[#182554] bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/25 sm:size-14 sm:border-4"
                                >
                                    <Flame className="size-5 fill-current sm:size-8" />
                                </motion.div>
                            </div>

                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
                                Daily goal complete
                            </p>
                            <h2
                                id="streak-update-title"
                                className="mt-1.5 text-3xl font-black tracking-[-0.045em] text-white sm:mt-2 sm:text-5xl"
                            >
                                {streakCount}-Day Streak
                            </h2>
                            <p
                                id="streak-update-description"
                                className="mt-2 max-w-[290px] text-xs font-medium leading-relaxed text-blue-100/70 sm:mt-3 sm:max-w-[330px] sm:text-[15px]"
                            >
                                {isProtected
                                    ? 'Your momentum is intact. A streak guard kept your learning journey on track.'
                                    : 'Strong work. Keep your momentum going and make every learning day count.'}
                            </p>
                        </div>

                        {isProtected && (
                            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-blue-300/20 bg-blue-300/10 p-3 text-left backdrop-blur-sm sm:mt-6 sm:gap-3 sm:rounded-2xl sm:p-3.5">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/15 text-blue-200 sm:size-10 sm:rounded-xl">
                                    <ShieldCheck className="size-4 sm:size-5" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-white">Streak protected</p>
                                    <p className="mt-0.5 text-xs font-medium leading-relaxed text-blue-100/65">
                                        {guardsUsed} guard{guardsUsed === 1 ? '' : 's'} used. {guardsRemaining} remaining this month.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.075] px-3 pb-3 pt-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm sm:mt-7 sm:rounded-[24px] sm:px-5 sm:pb-4 sm:pt-5">
                            <div className="mb-3 flex items-center justify-between sm:mb-5">
                                <div className="text-left">
                                    <p className="text-xs font-bold text-white">This week</p>
                                    <p className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100/45 sm:block">
                                        Learning consistency
                                    </p>
                                </div>
                                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">
                                    {activeDaysThisWeek}/7 active
                                </span>
                            </div>

                            <div className="flex h-20 items-end gap-1.5 sm:h-28 sm:gap-2">
                                {weekDays.map((day, index) => {
                                    return (
                                        <div
                                            key={day.date.toISOString()}
                                            aria-label={`${format(day.date, 'EEEE')}: ${
                                                day.isCurrent
                                                    ? 'current streak day'
                                                    : day.isActive
                                                        ? 'active streak day'
                                                        : day.isFuture
                                                            ? 'upcoming'
                                                            : 'inactive'
                                            }`}
                                            className="flex min-w-0 flex-1 flex-col items-center justify-end"
                                        >
                                            <div className="relative flex h-16 w-full items-end justify-center sm:h-24">
                                                {(day.isActive || day.isCurrent) && (
                                                    <span
                                                        className={`absolute z-10 flex size-4 items-center justify-center rounded-full border-2 sm:size-5 ${
                                                            day.isCurrent
                                                                ? 'border-amber-200 bg-amber-400 text-slate-950'
                                                                : 'border-amber-300/60 bg-amber-500/40 text-amber-100'
                                                        }`}
                                                        style={{ bottom: `${BAR_HEIGHTS[index] - 8}%` }}
                                                    >
                                                        <Check className="size-2.5 stroke-[3] sm:size-3" />
                                                    </span>
                                                )}
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${BAR_HEIGHTS[index]}%` }}
                                                    transition={{ delay: 0.18 + index * 0.05, duration: 0.45, ease: 'easeOut' }}
                                                    className={`w-full rounded-t-lg border-x border-t ${
                                                        day.isCurrent
                                                            ? 'border-amber-200 bg-[linear-gradient(to_top,#f59e0b,#fde68a)] shadow-[0_0_22px_rgba(251,191,36,0.22)]'
                                                            : day.isActive
                                                                ? 'border-amber-400/30 bg-amber-400/25 shadow-[0_0_12px_rgba(251,191,36,0.1)]'
                                                                : day.isFuture
                                                                    ? 'border-white/5 bg-white/[0.06]'
                                                                    : 'border-white/5 bg-white/10'
                                                    }`}
                                                />
                                            </div>
                                            <span className={`mt-1.5 text-[10px] font-bold sm:mt-2 sm:text-[11px] ${day.isCurrent ? 'text-amber-300' : day.isActive ? 'text-amber-400/70' : 'text-blue-100/45'}`}>
                                                {day.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-indigo-950 shadow-[0_12px_30px_rgba(15,23,42,0.22)] transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-indigo-950 active:scale-[0.99] sm:mt-6 sm:rounded-2xl sm:py-4 sm:text-sm"
                        >
                            Keep going
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                    </div>
                </motion.section>
            </div>
        </AnimatePresence>
    );
};
