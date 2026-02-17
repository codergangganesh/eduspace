import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Diamond } from 'lucide-react';
import { useStreak } from '@/contexts/StreakContext';
import { format, startOfWeek, addDays, isSameDay, differenceInCalendarDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { BadgeType, getStreakHeat } from '@/services/streakService';

export const DashboardStreakWeekly = () => {
    const { streak, badges } = useStreak();

    // Generate current week days
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    const badgeIcons: { type: BadgeType; color: string; label: string }[] = [
        { type: 'novice', color: '#CD7F32', label: 'N' },
        { type: 'learner', color: '#94A3B8', label: 'L' },
        { type: 'scholar', color: '#F59E0B', label: 'S' },
        { type: 'warrior', color: '#06B6D4', label: 'W' },
        { type: 'elite', color: '#8B5CF6', label: 'E' },
        { type: 'master', color: '#EF4444', label: 'M' },
        { type: 'grandmaster', color: '#6366F1', label: 'GM' },
        { type: 'titan', color: '#FBBF24', label: 'T' },
        { type: 'immortal', color: '#10B981', label: 'I' },
    ];

    const currentStreak = streak?.current_streak || 0;
    const lastActionDate = streak?.last_action_date ? parseISO(streak.last_action_date) : null;

    return (
        <div className="bg-white dark:bg-[#1C1F26] rounded-[1.5rem] p-5 shadow-xl dark:shadow-2xl border border-slate-100 dark:border-white/5 w-full relative overflow-hidden group">
            {/* Background Glow */}
            <div
                className="absolute -top-16 -right-16 size-32 blur-[60px] rounded-full pointer-events-none opacity-20"
                style={{ backgroundColor: getStreakHeat(currentStreak).color }}
            />

            <div className="relative z-10">
                {/* Header Info */}
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-0.5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span
                                className="size-1.5 rounded-full animate-pulse"
                                style={{ backgroundColor: getStreakHeat(currentStreak).color }}
                            />
                            Momentum: {getStreakHeat(currentStreak).label}
                        </h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{currentStreak}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Day Streak</span>
                        </div>
                    </div>

                    {/* Badge Mini Gallery */}
                    <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300">
                        {badgeIcons.map((bi) => {
                            const isUnlocked = badges.some(b => b.badge_type === bi.type);
                            return (
                                <div key={bi.type} className={cn(
                                    "size-9 rounded-lg rotate-12 flex items-center justify-center border-2 transition-all duration-500",
                                    isUnlocked
                                        ? "opacity-100 scale-100 z-10 border-white/20 dark:border-white/20 shadow-xl shadow-slate-200 dark:shadow-black/40 rotate-0"
                                        : "opacity-20 scale-90 grayscale border-transparent"
                                )}
                                    style={{
                                        background: `linear-gradient(135deg, ${bi.color} 0%, ${bi.color}CC 100%)`,
                                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                                    }}>
                                    <span className="text-[8px] font-black text-white">{bi.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Centered Flame Visualizer */}
                <div className="flex justify-center mb-6">
                    <div className="relative group/flame">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                y: [0, -5, 0]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="size-20 flex items-center justify-center relative z-20"
                        >
                            {getStreakHeat(currentStreak).iconType === 'diamond' ? (
                                <Diamond
                                    className="size-16 sm:size-16"
                                    style={{ color: getStreakHeat(currentStreak).color, fill: getStreakHeat(currentStreak).fill, filter: `drop-shadow(0 0 20px ${getStreakHeat(currentStreak).glow})` }}
                                />
                            ) : (
                                <Flame
                                    className="size-full"
                                    style={{ color: getStreakHeat(currentStreak).color, fill: getStreakHeat(currentStreak).fill, filter: `drop-shadow(0 0 20px ${getStreakHeat(currentStreak).glow})` }}
                                />
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                                <span className="text-xl font-black text-white leading-none drop-shadow-md">{currentStreak}</span>
                                <span className="text-[7px] font-black text-white/90 uppercase tracking-tighter drop-shadow-sm">STREAK</span>
                            </div>
                        </motion.div>

                        {/* Core Glow */}
                        <div
                            className="absolute inset-0 rounded-full blur-3xl scale-150 animate-pulse z-10 opacity-30"
                            style={{ backgroundColor: getStreakHeat(currentStreak).color }}
                        />

                        {/* Secondary Aura */}
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute inset-0 rounded-full blur-2xl z-0"
                            style={{ backgroundColor: getStreakHeat(currentStreak).color }}
                        />
                    </div>
                </div>

                {/* Weekly Calendar Section */}
                <div className="bg-slate-50 dark:bg-[#242931]/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-white/5">
                    <div className="grid grid-cols-7 gap-1 text-center mb-5">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                            <span key={idx} className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{day}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 items-center justify-items-center">
                        {weekDays.map((day, idx) => {
                            let isActive = false;

                            if (lastActionDate && currentStreak > 0) {
                                // Calculate the difference in calendar days from the last action date
                                const daysFromLastAction = differenceInCalendarDays(lastActionDate, day);

                                // A day is active if:
                                // 1. It is the day of the last action
                                // 2. It is within the streak range leading up to the last action
                                if (daysFromLastAction >= 0 && daysFromLastAction < currentStreak) {
                                    isActive = true;
                                }
                            }

                            const isTodayDate = isSameDay(day, today);

                            return (
                                <div key={idx} className="relative flex flex-col items-center justify-center size-10 group/day">
                                    {isActive ? (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -20 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="absolute inset-0 flex items-center justify-center p-0.5"
                                        >
                                            <div className="relative">
                                                {getStreakHeat(currentStreak).iconType === 'diamond' ? (
                                                    <Diamond
                                                        className="size-6 relative z-10"
                                                        style={{ color: getStreakHeat(currentStreak).color, fill: getStreakHeat(currentStreak).fill }}
                                                    />
                                                ) : (
                                                    <Flame
                                                        className="size-8 relative z-10"
                                                        style={{ color: getStreakHeat(currentStreak).color, fill: getStreakHeat(currentStreak).fill }}
                                                    />
                                                )}
                                                <motion.div
                                                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-0 blur-md rounded-full z-0"
                                                    style={{ backgroundColor: getStreakHeat(currentStreak).color }}
                                                />
                                            </div>
                                        </motion.div>
                                    ) : isTodayDate ? (
                                        <div className="absolute inset-0 border-2 border-orange-500/10 dark:border-orange-500/20 rounded-full scale-110" />
                                    ) : null}

                                    <span className={cn(
                                        "text-xs font-black relative z-10 transition-all duration-300",
                                        isActive ? "text-white scale-110" : isTodayDate ? "text-[#FF9F1C]" : "text-slate-400 dark:text-slate-500 group-hover/day:text-slate-700 dark:group-hover/day:text-slate-300"
                                    )}>
                                        {format(day, 'dd')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
