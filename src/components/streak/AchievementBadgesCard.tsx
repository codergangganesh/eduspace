import React from "react";
import { 
  Award, 
  CheckCircle2, 
  Trophy, 
  Clock, 
  Zap, 
  Sparkles, 
  Swords, 
  TrendingUp, 
  GraduationCap, 
  Flame, 
  RefreshCw, 
  Target, 
  Crown, 
  Calendar, 
  Shield 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgesCardProps {
  currentStreak?: number;
  wonDuelsCount?: number;
  onViewAll?: () => void;
}

export function AchievementBadgesCard({ currentStreak = 0, wonDuelsCount = 0, onViewAll }: AchievementBadgesCardProps) {
  // Define 12 unique and distinct academic & competitive achievements
  const badgeList = [
    {
      id: "streak-master",
      title: "Streak Master",
      desc: "Maintain a 30-day streak",
      icon: Trophy,
      status: currentStreak >= 30 ? "claimed" : "locked",
      progress: currentStreak,
      target: 30,
      reward: "+500 XP",
      unit: "Days",
      colorClass: currentStreak >= 30 
        ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "duel-champion",
      title: "Duel Champion",
      desc: "Win 10 arena duels",
      icon: Swords,
      status: wonDuelsCount >= 10 ? "claimed" : "locked",
      progress: wonDuelsCount,
      target: 10,
      reward: "+400 XP",
      unit: "Wins",
      colorClass: wonDuelsCount >= 10 
        ? "text-indigo-500 bg-indigo-500/10 border-indigo-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "rank-climber",
      title: "Rank Climber",
      desc: "Reach Rank #3 or better",
      icon: TrendingUp,
      // unlocked if streak is >= 15 (simulating rank placement)
      status: currentStreak >= 15 ? "claimed" : "locked",
      progress: currentStreak,
      target: 15,
      reward: "+300 XP",
      unit: "Days",
      colorClass: currentStreak >= 15 
        ? "text-cyan-500 bg-cyan-500/10 border-cyan-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "quiz-warrior",
      title: "Quiz Warrior",
      desc: "Complete 20 quizzes",
      icon: GraduationCap,
      // simulated progress based on streak active days
      status: currentStreak >= 10 ? "claimed" : "locked",
      progress: Math.min(20, currentStreak * 2),
      target: 20,
      reward: "+250 XP",
      unit: "Quizzes",
      colorClass: currentStreak >= 10 
        ? "text-orange-500 bg-orange-500/10 border-orange-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "daily-dominator",
      title: "Daily Dominator",
      desc: "Keep a 7-day streak active",
      icon: Flame,
      status: currentStreak >= 7 ? "claimed" : "locked",
      progress: currentStreak,
      target: 7,
      reward: "+150 XP",
      unit: "Days",
      colorClass: currentStreak >= 7 
        ? "text-red-500 bg-red-500/10 border-red-500/30 animate-pulse" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "comeback-king",
      title: "Comeback King",
      desc: "Win your first learning duel",
      icon: RefreshCw,
      status: wonDuelsCount >= 1 ? "claimed" : "locked",
      progress: wonDuelsCount >= 1 ? 1 : 0,
      target: 1,
      reward: "+100 XP",
      unit: "Wins",
      colorClass: wonDuelsCount >= 1 
        ? "text-purple-500 bg-purple-500/10 border-purple-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "accuracy-expert",
      title: "Accuracy Expert",
      desc: "Get 95%+ score in 5 duels",
      icon: Target,
      status: wonDuelsCount >= 5 ? "claimed" : "locked",
      progress: Math.min(5, wonDuelsCount),
      target: 5,
      reward: "+350 XP",
      unit: "Duels",
      colorClass: wonDuelsCount >= 5 
        ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "top-challenger",
      title: "Top Challenger",
      desc: "Issue 10 duel challenges",
      icon: Zap,
      status: wonDuelsCount >= 6 ? "claimed" : "locked",
      progress: Math.min(10, wonDuelsCount + 2),
      target: 10,
      reward: "+200 XP",
      unit: "Duels",
      colorClass: wonDuelsCount >= 6 
        ? "text-blue-500 bg-blue-500/10 border-blue-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "unstoppable",
      title: "Unstoppable Learner",
      desc: "Reach a 20-day streak",
      icon: Crown,
      status: currentStreak >= 20 ? "claimed" : "locked",
      progress: currentStreak,
      target: 20,
      reward: "+450 XP",
      unit: "Days",
      colorClass: currentStreak >= 20 
        ? "text-pink-500 bg-pink-500/10 border-pink-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "fast-finisher",
      title: "Fast Finisher",
      desc: "Win duel under 3 mins",
      icon: Clock,
      status: wonDuelsCount >= 3 ? "claimed" : "locked",
      progress: Math.min(3, wonDuelsCount),
      target: 3,
      reward: "+150 XP",
      unit: "Wins",
      colorClass: wonDuelsCount >= 3 
        ? "text-violet-500 bg-violet-500/10 border-violet-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "consistency",
      title: "Consistency Legend",
      desc: "Reach a 15-day streak",
      icon: Calendar,
      status: currentStreak >= 15 ? "claimed" : "locked",
      progress: currentStreak,
      target: 15,
      reward: "+300 XP",
      unit: "Days",
      colorClass: currentStreak >= 15 
        ? "text-teal-500 bg-teal-500/10 border-teal-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    },
    {
      id: "elite-competitor",
      title: "Elite Competitor",
      desc: "Enter the Grandmaster League",
      icon: Shield,
      status: currentStreak >= 25 ? "claimed" : "locked",
      progress: currentStreak,
      target: 25,
      reward: "+600 XP",
      unit: "Days",
      colorClass: currentStreak >= 25 
        ? "text-amber-500 bg-amber-500/10 border-amber-500/30" 
        : "text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200/20"
    }
  ];

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/40 w-full space-y-5 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-indigo-500" />
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Achievement Badges</h3>
        </div>
        <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">12 Unlocks Available</span>
      </div>

      {/* Grid of Badges - 12 badges responsive layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {badgeList.map((badge) => {
          const BadgeIcon = badge.icon;
          const isUnlocked = badge.status === "claimed";
          
          return (
            <div
              key={badge.id}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4 flex flex-col justify-between items-center text-center space-y-3 transition-all duration-300 h-[190px] group",
                isUnlocked
                  ? "bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-indigo-500/5 hover:border-indigo-500/30"
                  : "bg-slate-50/50 dark:bg-slate-950/10 border-slate-100 dark:border-slate-800/40 opacity-70 hover:opacity-85"
              )}
            >
              {/* Badge visual circle */}
              <div
                className={cn(
                  "size-11 rounded-full border-2 flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105",
                  badge.colorClass
                )}
              >
                <BadgeIcon className="size-4.5 shrink-0" />
                {isUnlocked && (
                  <div className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 flex items-center justify-center border border-white dark:border-slate-900 text-white shadow-sm">
                    <CheckCircle2 className="size-2.5 fill-emerald-500 text-white" />
                  </div>
                )}
              </div>

              {/* Title & Desc */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight truncate w-full max-w-[120px]">{badge.title}</h4>
                <p className="text-[8px] text-slate-400 font-bold leading-normal truncate w-full max-w-[110px]">{badge.desc}</p>
              </div>

              {/* Status footer / Actions */}
              <div className="w-full">
                {!isUnlocked ? (
                  <div className="space-y-1.5 w-full">
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min((badge.progress / badge.target) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block">
                      {badge.progress} / {badge.target} {badge.unit}
                    </span>
                  </div>
                ) : (
                  <span className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block py-0.5 bg-emerald-500/5 rounded-full border border-emerald-500/10">
                    Unlocked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
