import React from "react";
import { Flame, Sparkles, Trophy, ShieldCheck, Diamond } from "lucide-react";
import { motion } from "framer-motion";

interface DuelistProgressCardProps {
  streakCount: number;
  totalDays: number;
}

export function DuelistProgressCard({ streakCount = 0, totalDays = 0 }: DuelistProgressCardProps) {
  // Derive level from streak or give standard level mapping
  const levelVal = Math.max(1, Math.floor(streakCount * 1.5) + 3);

  // XP progression derived dynamically from totalDays and streakCount
  const currentXp = (streakCount * 100) + (totalDays * 50);
  const targetXp = Math.ceil((currentXp + 1) / 1000) * 1000 || 1000;
  const neededXp = Math.max(0, targetXp - currentXp);
  const progressPercent = Math.min((currentXp / targetXp) * 100, 100);

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 group">

      {/* Background Neon Aura */}
      <div className="absolute -top-24 -right-24 size-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 size-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Left: Progress info */}
      <div className="flex-1 space-y-4 w-full relative z-10">

        {/* Capsules */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[9px] font-black uppercase tracking-wider">
            <Flame className="size-3 fill-rose-500/30 animate-pulse" />
            <span>{streakCount} Day Streak</span>
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[9px] font-black uppercase tracking-wider">
            <Sparkles className="size-3 text-indigo-400 animate-spin duration-3000" />
            <span>Level {levelVal}</span>
          </div>
        </div>

        {/* Header Text */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Your Duelist Progress</h2>
          <p className="text-xs text-indigo-200/80 font-bold tracking-tight">
            You're on fire! Collect <span className="text-indigo-400 font-extrabold">{neededXp}</span> more XP to unlock the next level and rank up in the arena!
          </p>
        </div>

        {/* Progress Slider */}
        <div className="space-y-1.5 pt-2">
          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-400 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-black text-indigo-200/60 uppercase tracking-widest">
            <span>{currentXp.toLocaleString()} XP</span>
            <span>{targetXp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      {/* Right: Premium 3D Stacked Cards Deck */}
      <div className="shrink-0 flex items-center justify-center relative w-48 h-32 md:h-auto select-none">

        {/* Layer 1: Left Card */}
        <motion.div
          animate={{ rotate: [-8, -6, -8], x: [-10, -5, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute size-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md rotate-[-8deg] -translate-x-12 flex items-center justify-center text-indigo-400 shadow-xl"
        >
          <Diamond className="size-8 text-blue-400 fill-blue-400/10" />
        </motion.div>

        {/* Layer 3: Right Card */}
        <motion.div
          animate={{ rotate: [8, 6, 8], x: [10, 5, 10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute size-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md rotate-[8deg] translate-x-12 flex items-center justify-center text-emerald-400 shadow-xl"
        >
          <ShieldCheck className="size-8 text-emerald-400 fill-emerald-400/10" />
        </motion.div>

        {/* Layer 2: Center/Top Active Card */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 0 }}
          className="relative size-24 rounded-2xl bg-indigo-600 border border-indigo-400 flex flex-col items-center justify-center text-white shadow-2xl z-10 transition-transform duration-300"
        >
          <Trophy className="size-10 fill-white/10 animate-bounce" />
        </motion.div>
      </div>

    </div>
  );
}
