import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy,
    Flame,
    Target,
    Calendar as CalendarIcon,
    Award,
    ChevronRight,
    Sparkles,
    ArrowLeft,
    Medal,
    Clock,
    LayoutGrid,
    Shield,
    Sword,
    Gem,
    GraduationCap,
    Zap,
    ChevronDown,
    Infinity as InfinityIcon,
    Diamond
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStreak } from '@/contexts/StreakContext';
import { StreakCalendar } from '@/components/streak/StreakCalendar';
import { StreakBadge } from '@/components/streak/StreakBadge';
import { StreakBadgeDetailModal } from '@/components/streak/StreakBadgeDetailModal';
import { BadgeType, STREAK_LEVELS, BADGE_DETAILS, getStreakHeat } from '@/services/streakService';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

const IconMap: Record<string, React.ElementType> = {
    Trophy,
    Medal,
    Award,
    Zap,
    Sparkles,
    Shield,
    Sword,
    Gem,
    GraduationCap,
    Target,
    Infinity: InfinityIcon
};
export default function StreakPage() {
    const navigate = useNavigate();
    const { streak, badges, loading } = useStreak();
    const isMobile = useIsMobile();
    const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
    const [isBadgesExpanded, setIsBadgesExpanded] = useState(true);
    const [isMilestonesExpanded, setIsMilestonesExpanded] = useState(false);

    if (loading) {
        return (
            <DashboardLayout fullHeight>
                <div className="h-full flex flex-col p-6 space-y-6 max-w-7xl mx-auto overflow-hidden">
                    <Skeleton className="h-40 w-full rounded-[2.5rem]" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                        <Skeleton className="lg:col-span-2 h-full rounded-[2.5rem]" />
                        <Skeleton className="h-full rounded-[2.5rem]" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const currentStreak = streak?.current_streak || 0;
    const longestStreak = streak?.longest_streak || 0;
    const totalDays = streak?.total_days || 0;

    // Motivation logic
    const getMotivationalMessage = () => {
        if (currentStreak === 0) return "Start your academic journey today!";

        const nextLevels = Object.keys(STREAK_LEVELS).map(Number).sort((a, b) => a - b);
        const nextLevel = nextLevels.find(l => l > currentStreak);

        if (nextLevel) {
            const remaining = nextLevel - currentStreak;
            const messages = [
                `You're ${remaining} day${remaining > 1 ? 's' : ''} away from your next badge!`,
                "Don't break your streak! You're doing great.",
                "Keep the fire burning! Consistency is key.",
                `Only ${remaining} more day${remaining > 1 ? 's' : ''} to reach ${STREAK_LEVELS[nextLevel]!.replace('_', ' ')}!`
            ];
            // Deterministic random based on current streak to avoid jumping on every render
            return messages[currentStreak % messages.length];
        }

        return "You've reached the peak! You are an Academic Immortal.";
    };

    const badgeTypes: BadgeType[] = ['novice', 'learner', 'scholar', 'prodigy', 'warrior', 'elite', 'master', 'grandmaster', 'titan', 'immortal'];

    return (
        <DashboardLayout fullHeight>
            <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-950/20 overflow-hidden">
                <ScrollArea className="flex-1">
                    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

                        {/* Header & Stats Strip */}
                        <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                            <div className="flex-1 flex flex-col justify-center space-y-2">
                                <div className="space-y-1">
                                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Streak & <span className="text-primary italic">Achievements</span>
                                    </h1>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-base max-w-xl">
                                        {getMotivationalMessage()}
                                    </p>
                                </div>
                            </div>

                            {/* Main Stats Card - More Compact on Desktop Side */}
                            <Card className="xl:w-[450px] border-none shadow-2xl rounded-[2rem] overflow-hidden group shrink-0 transition-all duration-700"
                                style={{
                                    backgroundColor: getStreakHeat(currentStreak).color,
                                    boxShadow: `0 25px 50px -12px ${getStreakHeat(currentStreak).glow}`
                                }}
                            >
                                <CardContent className="p-6 relative h-full flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
                                        {getStreakHeat(currentStreak).iconType === 'diamond' ? (
                                            <Diamond className="size-24 text-white fill-white" />
                                        ) : (
                                            <Flame className="size-24 text-white fill-white" />
                                        )}
                                    </div>

                                    <div className="relative z-10 grid grid-cols-5 items-center gap-6">
                                        <div className="col-span-3 space-y-1">
                                            <span className="text-white/70 font-black text-[10px] uppercase tracking-[0.2em] block">Current Streak</span>
                                            <div className="flex items-end gap-2 text-6xl font-black text-white leading-none">
                                                {currentStreak}
                                                <span className="text-sm pb-1 text-white/60 uppercase tracking-widest font-black">Days</span>
                                            </div>
                                        </div>

                                        <div className="col-span-2 flex flex-col gap-2">
                                            <div className="px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                                                <span className="text-primary-foreground/60 font-bold text-[9px] uppercase tracking-widest block">RECORD</span>
                                                <div className="text-lg font-black text-white">{longestStreak}</div>
                                            </div>
                                            <div className="px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                                                <span className="text-primary-foreground/60 font-bold text-[9px] uppercase tracking-widest block">TOTAL</span>
                                                <div className="text-lg font-black text-white">{totalDays}</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Calendar - Reduced Padding */}
                            <div className="lg:col-span-2">
                                <StreakCalendar
                                    lastActionDate={streak?.last_action_date || null}
                                    currentStreak={currentStreak}
                                />
                            </div>

                            {/* Right: Next Milestone - More Compact */}
                            <Card className="border-none bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                <Target className="size-5 text-primary" />
                                                Next Milestone
                                            </h2>
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-tight">Your path to glory</p>
                                        </div>

                                        {/* Mobile Toggle for Milestones */}
                                        <div className="sm:hidden">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsMilestonesExpanded(!isMilestonesExpanded)}
                                                className="size-8 p-0 rounded-full"
                                            >
                                                <motion.div
                                                    animate={{ rotate: isMilestonesExpanded ? 180 : 0 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <ChevronDown className="size-4" />
                                                </motion.div>
                                            </Button>
                                        </div>
                                    </div>

                                    <motion.div
                                        initial={false}
                                        animate={{
                                            height: (!isMobile || isMilestonesExpanded) ? "auto" : 0,
                                            opacity: (!isMobile || isMilestonesExpanded) ? 1 : 0
                                        }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className={cn(!isMobile ? "h-auto opacity-100" : "overflow-hidden")}
                                    >
                                        <div className="space-y-4 pt-2">
                                            {badgeTypes.map((type, idx) => {
                                                const details = BADGE_DETAILS[type];
                                                const isUnlocked = badges.some(b => b.badge_type === type);
                                                const nextInLine = !isUnlocked && (idx === 0 || badges.some(b => b.badge_type === badgeTypes[idx - 1]));

                                                if (!isUnlocked && !nextInLine && idx > badges.length) return null;

                                                return (
                                                    <div key={type} className={cn(
                                                        "flex items-center gap-3 p-3 rounded-2xl transition-all border",
                                                        isUnlocked
                                                            ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/10 shadow-sm shadow-emerald-500/5"
                                                            : nextInLine
                                                                ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30 ring-1 ring-primary/10 dark:ring-primary/20 shadow-lg shadow-primary/5 animate-in zoom-in-95"
                                                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-transparent opacity-60"
                                                    )}>
                                                        <div className={cn(
                                                            "size-10 rounded-xl flex items-center justify-center shrink-0 border-2",
                                                            isUnlocked || nextInLine ? "bg-white dark:bg-slate-900 shadow-sm" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                                                        )}
                                                            style={(isUnlocked || nextInLine) ? { borderColor: details.color, color: details.color } : {}}>
                                                            {(() => {
                                                                const IconComponent = IconMap[details.icon] || Trophy;
                                                                return <IconComponent className="size-5" />;
                                                            })()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <p className={cn(
                                                                    "font-black text-xs",
                                                                    isUnlocked
                                                                        ? "text-slate-900 dark:text-emerald-400"
                                                                        : nextInLine
                                                                            ? "text-slate-900 dark:text-white"
                                                                            : "text-slate-500 dark:text-slate-400"
                                                                )} style={(isUnlocked || nextInLine) ? { borderColor: `${details.color}30`, backgroundColor: `${details.color}08` } : {}}>
                                                                    {details.name}
                                                                </p>
                                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{details.level}D</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn("h-full rounded-full transition-all duration-1000", isUnlocked ? "bg-emerald-500 w-full" : "bg-primary")}
                                                                    style={{ width: isUnlocked ? '100%' : `${Math.min((currentStreak / details.level) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </div>
                            </Card>
                        </div>

                        {/* Badges Section */}
                        <div className="space-y-6 pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                        <Award className="size-6 text-primary" />
                                        Achievement Hall
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Visualize your persistence milestones.</p>
                                </div>

                                {/* Mobile Only Toggle - Modern Style */}
                                <div className="sm:hidden">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsBadgesExpanded(!isBadgesExpanded)}
                                        className={cn(
                                            "w-full rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2 transition-all active:scale-95",
                                            isBadgesExpanded ? "bg-primary/5 text-primary border-primary/20" : "bg-white dark:bg-slate-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="size-3.5" />
                                            <span>{isBadgesExpanded ? "Hide Badges" : "View Achievements"}</span>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isBadgesExpanded ? 180 : 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <ChevronDown className="size-4" />
                                        </motion.div>
                                    </Button>
                                </div>
                            </div>

                            <motion.div
                                initial={false}
                                animate={{
                                    height: (!isMobile || isBadgesExpanded) ? "auto" : 0,
                                    opacity: (!isMobile || isBadgesExpanded) ? 1 : 0,
                                    marginBottom: (!isMobile || isBadgesExpanded) ? 0 : -24
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className={cn(!isMobile ? "h-auto opacity-100" : "overflow-hidden")}
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {badgeTypes.map((type) => {
                                        const unlockedBadge = badges.find(b => b.badge_type === type);
                                        return (
                                            <StreakBadge
                                                key={type}
                                                type={type}
                                                isUnlocked={!!unlockedBadge}
                                                unlockedAt={unlockedBadge?.unlocked_at}
                                                streakCount={currentStreak}
                                                onClick={() => setSelectedBadge(type)}
                                            />
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>

                        {/* Bottom Insight Card - Compact & Mobile Friendly */}
                        <Card className="border-none bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 lg:p-10 overflow-hidden relative group border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(var(--primary-rgb)/0.05),transparent_50%)] opacity-100" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-3 max-w-xl text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-black text-[9px] uppercase tracking-[0.2em] border border-primary/20">
                                        Summary
                                    </div>
                                    <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Consistency is <span className="text-primary italic">Mastery.</span>
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm lg:text-base leading-relaxed">
                                        Streak: <span className="text-slate-900 dark:text-white">{currentStreak}</span> days.
                                        <span className="mx-2 text-slate-200 dark:text-slate-700 hidden sm:inline">|</span>
                                        <span className="block sm:inline">Total performance: <span className="text-primary">{totalDays} sessions.</span></span>
                                    </p>
                                </div>

                                <div className="hidden sm:flex shrink-0 items-center justify-center">
                                    <div className="size-24 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex flex-col items-center justify-center group-hover:bg-primary group-hover:rotate-3 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/20">
                                        <span className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-white">{totalDays}</span>
                                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-white/80">Days</span>
                                    </div>
                                </div>
                            </div>
                        </Card>



                    </div>
                </ScrollArea>

                <StreakBadgeDetailModal
                    type={selectedBadge}
                    isOpen={!!selectedBadge}
                    onClose={() => setSelectedBadge(null)}
                />
            </div>
        </DashboardLayout>
    );
}
