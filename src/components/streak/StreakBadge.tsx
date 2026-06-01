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
    const [isHovered, setIsHovered] = React.useState(false);
    const BadgeIcon = IconMap[details.icon] || Trophy;

    // Circular progress variables
    const radius = 35;
    const strokeWidth = 3;
    const circumference = 2 * Math.PI * radius;
    const progressPercentage = isUnlocked ? 100 : (streakCount / details.level) * 100;
    const strokeDashoffset = circumference - (Math.min(progressPercentage, 100) / 100) * circumference;
    const ringColor = isUnlocked ? (details.imageUrl ? '#FBBF24' : details.color) : '#6366F1';

    return (
        <motion.div
            whileHover={isUnlocked ? { 
                y: -6,
                boxShadow: `0 15px 35px -10px ${details.color}40`,
                borderColor: details.color
            } : { y: -2 }}
            onClick={isUnlocked ? onClick : undefined}
            onMouseEnter={() => !isUnlocked && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "relative group p-3 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] transition-all duration-300 border-2 select-none",
                isUnlocked
                    ? "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] dark:shadow-none cursor-pointer"
                    : "bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/80 opacity-70"
            )}
        >
            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                {/* Badge Circle with SVG Progress Ring */}
                <div className="size-20 rounded-full flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105">
                    {/* SVG Progress Ring */}
                    <svg className="absolute inset-0 size-full -rotate-90">
                        {/* Background Track Circle */}
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className="stroke-slate-100 dark:stroke-slate-800/80 fill-none"
                            strokeWidth={strokeWidth}
                        />
                        {/* Animated Active Progress Circle */}
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className="fill-none transition-all duration-500 ease-out"
                            strokeWidth={strokeWidth}
                            stroke={ringColor}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={isUnlocked ? { filter: `drop-shadow(0 0 4px ${ringColor}50)` } : {}}
                        />
                    </svg>

                    {/* Inner Icon/Image container */}
                    <div className="absolute inset-[4px] rounded-full overflow-hidden flex items-center justify-center bg-white/40 dark:bg-slate-900/40 border border-slate-200/10">
                        {details.imageUrl ? (
                            <img
                                src={details.imageUrl}
                                alt={details.name}
                                className={cn(
                                    "size-14 shrink-0 object-cover rounded-full transition-all duration-300",
                                    !isUnlocked && "grayscale opacity-30 brightness-50 contrast-75 blur-[0.2px]"
                                )}
                            />
                        ) : (
                            <BadgeIcon className="size-7 shrink-0 opacity-40" />
                        )}
                        
                        {/* Lock Overlay for Locked Badges */}
                        {!isUnlocked && (
                            <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-[0.5px] flex items-center justify-center z-10 transition-colors duration-300 group-hover:bg-slate-950/40">
                                <Lock className="size-5 text-slate-300 dark:text-slate-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] animate-pulse" />
                            </div>
                        )}
                    </div>

                    {isUnlocked && (
                        <div className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white dark:border-slate-900 text-white shadow-sm z-10">
                            <CheckCircle2 className="size-3.5 fill-emerald-500 text-white" />
                        </div>
                    )}
                </div>

                <div className="space-y-0.5 sm:space-y-1">
                    <h3 className={cn(
                        "text-sm sm:text-base font-black tracking-tight leading-tight",
                        isUnlocked ? "text-slate-900 dark:text-white" : "text-slate-400"
                    )}>
                        {details.name}
                    </h3>
                    <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
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
                    <div className="pt-1 sm:pt-2 w-full">
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden mb-1">
                            <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${Math.min((streakCount / details.level) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                            {streakCount} / {details.level} Days
                        </span>
                    </div>
                )}
            </div>

            {/* Locked Hover Hint Tooltip */}
            {isHovered && (
                <div className="absolute inset-x-3 bottom-20 bg-slate-950/95 border border-slate-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-md z-30 flex flex-col justify-center items-center text-center space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-1">
                        <Lock className="size-3 text-amber-500 fill-amber-500/10 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">Locked Badge</span>
                    </div>
                    <p className="text-[7.5px] font-bold text-slate-300 leading-relaxed max-w-[130px]">
                        Maintain a {details.level}-day learning streak to unlock this emblem.
                    </p>
                    <div className="text-[6.5px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        Target: {details.level} Days
                    </div>
                </div>
            )}
        </motion.div>
    );
};
