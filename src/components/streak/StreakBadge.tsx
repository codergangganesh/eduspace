import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, CheckCircle2, Sparkles, Medal, Award, Zap, Shield, Sword, Gem, GraduationCap, Target, Infinity as InfinityIcon } from 'lucide-react';
import { BadgeType, BADGE_DETAILS } from '@/services/streakService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

interface StreakBadgeProps {
    type: BadgeType;
    unlockedAt?: string;
    isUnlocked: boolean;
    streakCount: number;
    onClick?: () => void;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
    type,
    unlockedAt,
    isUnlocked,
    streakCount,
    onClick
}) => {
    const details = BADGE_DETAILS[type];

    return (
        <motion.div
            whileHover={{ y: -5 }}
            onClick={isUnlocked ? onClick : undefined}
            className={cn(
                "relative group p-3 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] transition-all duration-300 border-2",
                isUnlocked
                    ? "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-none cursor-pointer"
                    : "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 grayscale-[0.5]"
            )}
        >
            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                {/* Badge Icon Container */}
                <div className="relative">
                    <div
                        className={cn(
                            "size-16 sm:size-20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500",
                            isUnlocked ? "rotate-0 scale-100" : "rotate-12 scale-90"
                        )}
                        style={{
                            backgroundColor: isUnlocked ? `${details.color}15` : '#f1f5f9',
                            border: `2px solid ${isUnlocked ? details.color : '#e2e8f0'}`,
                            boxShadow: isUnlocked ? `0 8px 20px -5px ${details.color}20` : 'none'
                        }}
                    >
                        {isUnlocked ? (() => {
                            const IconComponent = IconMap[details.icon] || Trophy;
                            return <IconComponent className="size-8 sm:size-10" style={{ color: details.color }} />;
                        })() : (
                            <Lock className="size-6 sm:size-8 text-slate-400" />
                        )}

                    </div>

                    {isUnlocked && (
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -bottom-2 -left-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg"
                        >
                            <CheckCircle2 className="size-4" />
                        </motion.div>
                    )}
                </div>

                <div className="space-y-0.5 sm:space-y-1">
                    <h3 className={cn(
                        "text-sm sm:text-lg font-black tracking-tight",
                        isUnlocked ? "text-slate-900 dark:text-white" : "text-slate-400"
                    )}>
                        {details.name}
                    </h3>
                    <p className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest sm:tracking-wider">
                        {details.level}D STREAK
                    </p>
                </div>

                {isUnlocked ? (
                    <div className="pt-1 sm:pt-2">
                        <div className="px-2 sm:px-4 py-1 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[8px] sm:text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                            {unlockedAt ? format(new Date(unlockedAt), 'MMM dd') : 'Recent'}
                        </div>
                    </div>
                ) : (
                    <div className="pt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Level Locked
                    </div>
                )}
            </div>

            {isUnlocked && (
                <div className="absolute inset-0 rounded-[2rem] pointer-events-none overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform" />
                </div>
            )}
        </motion.div>
    );
};
