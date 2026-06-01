import React, { useState } from "react";
import { StreakDuel } from "@/services/streakDuelService";
import { useAuth } from "@/contexts/AuthContext";
import { useStreakDuels } from "@/hooks/useStreakDuels";
import { Swords, Flame, Trophy, Timer, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardDuelCardProps {
  className?: string;
}

export function DashboardDuelCard({ className }: DashboardDuelCardProps) {
  const { user, profile } = useAuth();
  const { activeDuels, isLoading, refresh } = useStreakDuels();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-[2rem] p-6 animate-pulse flex flex-col justify-between h-[200px]",
        "bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/5 backdrop-blur-md",
        className
      )}>
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-white/20 dark:bg-white/5 rounded-full" />
          <div className="h-6 w-24 bg-white/20 dark:bg-white/5 rounded-full" />
        </div>
        <div className="flex gap-4 justify-center items-center">
          <div className="size-12 bg-white/20 dark:bg-white/5 rounded-full" />
          <div className="h-8 w-16 bg-white/20 dark:bg-white/5 rounded-md" />
          <div className="size-12 bg-white/20 dark:bg-white/5 rounded-full" />
        </div>
        <div className="h-3 w-full bg-white/20 dark:bg-white/5 rounded-full" />
      </div>
    );
  }

  // 1. Empty state
  if (activeDuels.length === 0) {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-[2rem] p-6 transition-all duration-300 hover:shadow-[0_12px_24px_rgba(99,102,241,0.15)]",
        "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/20 backdrop-blur-md",
        "flex flex-col items-center justify-center text-center h-[220px]",
        className
      )}>
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 size-24 bg-indigo-500/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -right-12 size-24 bg-pink-500/20 rounded-full blur-2xl" />

        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 mb-3 animate-bounce">
          <Swords className="size-6 text-indigo-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Active Streak Duels
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
          Ready to dominate? Head to the Streaks tab to challenge your classmate!
        </p>
      </div>
    );
  }

  const currentDuel = activeDuels[currentIndex];
  const isChallenger = currentDuel.challenger_id === user?.id;

  // Active user details
  const myScore = isChallenger ? currentDuel.challenger_score : currentDuel.defender_score;
  const oppScore = isChallenger ? currentDuel.defender_score : currentDuel.challenger_score;
  const myStreak = isChallenger ? currentDuel.challenger_current_streak : currentDuel.defender_current_streak;
  const oppStreak = isChallenger ? currentDuel.defender_current_streak : currentDuel.challenger_current_streak;
  const myName = isChallenger ? currentDuel.challenger_name : currentDuel.defender_name;
  const oppName = isChallenger ? currentDuel.defender_name : currentDuel.challenger_name;
  const myAvatar = (isChallenger ? currentDuel.challenger_avatar : currentDuel.defender_avatar) || profile?.avatar_url || undefined;
  const oppAvatar = isChallenger ? currentDuel.defender_avatar : currentDuel.challenger_avatar;

  const getInitials = (name?: string, fallback = "DU") =>
    (name || fallback)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  // Determine standings
  const isWinning = myScore > oppScore;
  const isTied = myScore === oppScore;

  // Time remaining
  const timeLeftStr = currentDuel.expires_at
    ? formatDistanceToNow(new Date(currentDuel.expires_at), { addSuffix: false })
    : "7 days";

  // Cycle handlers
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? activeDuels.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === activeDuels.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-[2rem] p-5 sm:p-6 transition-all duration-300 hover:shadow-[0_16px_32px_rgba(99,102,241,0.2)]",
      "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-white/20 dark:border-white/5 backdrop-blur-md",
      className
    )}>
      {/* Glow Rings */}
      <div className="absolute -top-16 -left-16 size-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 size-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Swords className="size-3.5" /> LIVE STREAK DUEL
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Countdown */}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
            <Timer className="size-3 text-indigo-400" />
            <span>{timeLeftStr} remaining</span>
          </div>
        </div>
      </div>

      {/* Duel Grid */}
      <div className="relative z-10 grid grid-cols-7 items-center justify-center gap-2 my-2">
        {/* Left: You */}
        <div className="col-span-3 flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className={cn(
              "size-16 sm:size-20 border-2 transition-transform duration-300 hover:scale-105",
              isWinning ? "border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" :
                isTied ? "border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]" : "border-rose-400"
            )}>
              <AvatarImage src={myAvatar ?? undefined} alt={myName ?? "My profile"} />
              <AvatarFallback className="bg-indigo-600 text-white font-bold text-sm">
                {getInitials(myName, "ME")}
              </AvatarFallback>
            </Avatar>
            {isWinning && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-yellow-950 p-0.5 rounded-full border border-white">
                <Trophy className="size-3 fill-yellow-950" />
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 mt-2 line-clamp-1">
            You
          </span>
          <div className="flex items-center gap-0.5 mt-0.5 bg-orange-500/10 dark:bg-orange-500/20 px-1.5 py-0.2 rounded-full border border-orange-500/20">
            <Flame className="size-3 text-orange-500 fill-orange-500" />
            <span className="text-[9px] sm:text-[10px] font-extrabold text-orange-600 dark:text-orange-400">{myStreak}</span>
          </div>
        </div>

        {/* Center: VS */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className="size-7 sm:size-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-black shadow-[0_0_8px_rgba(99,102,241,0.2)] animate-pulse">
            VS
          </div>
        </div>

        {/* Right: Opponent */}
        <div className="col-span-3 flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className={cn(
              "size-16 sm:size-20 border-2 transition-transform duration-300 hover:scale-105",
              !isWinning && !isTied ? "border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" :
                isTied ? "border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]" : "border-rose-400"
            )}>
              <AvatarImage src={oppAvatar ?? undefined} alt={oppName ?? "Opponent profile"} />
              <AvatarFallback className="bg-slate-600 text-white font-bold text-sm">
                {getInitials(oppName, "OP")}
              </AvatarFallback>
            </Avatar>
            {!isWinning && !isTied && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-yellow-950 p-0.5 rounded-full border border-white">
                <Trophy className="size-3 fill-yellow-950" />
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 mt-2 line-clamp-1">
            {oppName || "Opponent"}
          </span>
          <div className="flex items-center gap-0.5 mt-0.5 bg-orange-500/10 dark:bg-orange-500/20 px-1.5 py-0.2 rounded-full border border-orange-500/20">
            <Flame className="size-3 text-orange-500 fill-orange-500" />
            <span className="text-[9px] sm:text-[10px] font-extrabold text-orange-600 dark:text-orange-400">{oppStreak}</span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="relative z-10 mt-5">
        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1">
          <span className={cn(isWinning && "text-emerald-500 dark:text-emerald-400")}>
            {myScore} {myScore === 1 ? 'Day Active' : 'Days Active'}
          </span>
          <span className="text-slate-400 dark:text-slate-600">consistency score</span>
          <span className={cn(!isWinning && !isTied && "text-emerald-500 dark:text-emerald-400")}>
            {oppScore} {oppScore === 1 ? 'Day Active' : 'Days Active'}
          </span>
        </div>

        {/* Dynamic Gaming split bar */}
        <div className="h-3.5 w-full rounded-full bg-slate-200/50 dark:bg-slate-800/80 p-0.5 overflow-hidden flex gap-0.5 border border-slate-300/30 dark:border-slate-700/30 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)]">
          {/* Left progress (My bar) */}
          <div
            className={cn(
              "h-full rounded-l-full transition-all duration-500 ease-out",
              isWinning ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                isTied ? "bg-gradient-to-r from-indigo-500 to-indigo-400" : "bg-gradient-to-r from-rose-500 to-rose-400"
            )}
            style={{ width: `${Math.max(10, myScore === 0 && oppScore === 0 ? 50 : (myScore / (myScore + oppScore)) * 100)}%` }}
          />
          {/* Right progress (Opponent bar) */}
          <div
            className={cn(
              "h-full rounded-r-full transition-all duration-500 ease-out",
              !isWinning && !isTied ? "bg-gradient-to-l from-emerald-500 to-teal-400" :
                isTied ? "bg-gradient-to-l from-indigo-500 to-indigo-400" : "bg-gradient-to-l from-rose-500 to-rose-400"
            )}
            style={{ width: `${Math.max(10, myScore === 0 && oppScore === 0 ? 50 : (oppScore / (myScore + oppScore)) * 100)}%` }}
          />
        </div>

        {/* Helper footer */}
        <div className="flex justify-between items-center text-[9px] text-indigo-600/85 dark:text-indigo-400/85 mt-2.5 font-bold">
          <span>Class: {currentDuel.class_name || currentDuel.course_code || "LMS"}</span>
        </div>
      </div>

      {/* Multi-duel selector */}
      {activeDuels.length > 1 && (
        <div className="relative z-10 flex justify-center items-center gap-3 mt-4 border-t border-slate-200/40 dark:border-slate-700/40 pt-3">
          <button
            onClick={handlePrev}
            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <ChevronLeft className="size-3.5 text-slate-600 dark:text-slate-300" />
          </button>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            Duel {currentIndex + 1} of {activeDuels.length}
          </span>
          <button
            onClick={handleNext}
            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <ChevronRight className="size-3.5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      )}

      {/* Mobile Touch Hint inside card (Very small, static, non-glowing caption) */}
      <div className="w-full text-center mt-4 lg:hidden pointer-events-none select-none relative z-10">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
          Tap card to view calendar 🔥
        </span>
      </div>
    </div>
  );
}
