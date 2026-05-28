import React from "react";
import { ClanBattle } from "@/types/clans";
import { ClanBanner } from "./ClanBanner";
import { Swords, Clock, Trophy, ShieldAlert, Award } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ClanBattleArenaProps {
  battle: ClanBattle | null;
  myClanId: string;
}

export function ClanBattleArena({ battle, myClanId }: ClanBattleArenaProps) {
  if (!battle) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#1C1F26] rounded-[2rem] border border-slate-100 dark:border-white/5 text-center min-h-[220px] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.02),transparent_70%)]" />
        <Swords className="size-12 text-slate-300 dark:text-slate-700 animate-pulse mb-3 z-10" />
        <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 z-10 uppercase tracking-widest">Peace Time</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1 z-10">
          No weekly PvP guild wars are currently active in this classroom. Prepare your daily streaks for Monday's pairing!
        </p>
      </div>
    );
  }

  const isClanA = battle.clan_a_id === myClanId;

  const myName = isClanA ? battle.clan_a_name : battle.clan_b_name;
  const myBanner = isClanA ? battle.clan_a_banner : battle.clan_b_banner;
  const myScore = Number(isClanA ? battle.clan_a_score : battle.clan_b_score);

  const oppName = isClanA ? battle.clan_b_name : battle.clan_a_name;
  const oppBanner = isClanA ? battle.clan_b_banner : battle.clan_a_banner;
  const oppScore = Number(isClanA ? battle.clan_b_score : battle.clan_a_score);

  const isWinning = myScore > oppScore;
  const isTied = myScore === oppScore;

  const totalScore = myScore + oppScore;
  const myPercent = totalScore === 0 ? 50 : Math.round((myScore / totalScore) * 100);
  const oppPercent = totalScore === 0 ? 50 : Math.round((oppScore / totalScore) * 100);

  const timeLeft = formatDistanceToNow(parseISO(battle.expires_at), { addSuffix: false });

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/40 w-full group">
      <div className="absolute -top-24 -left-24 size-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 size-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 p-2 rounded-xl">
            <Swords className="size-4 animate-spin duration-3000" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              Live Battle Arena
              {isWinning && (
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active classroom PvP Guild War</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-950/20 py-1.5 px-3 rounded-full border border-slate-200/20">
          <Clock className="size-3 text-indigo-500" />
          <span>{timeLeft} left</span>
        </div>
      </div>

      {/* Competitors Layout */}
      <div className="relative z-10 grid grid-cols-7 gap-4 items-center justify-items-center mb-6">
        {/* Your Clan */}
        <div className="col-span-3 flex flex-col items-center text-center space-y-2">
          <ClanBanner banner={myBanner} size="lg" className="hover:rotate-0 transition-transform duration-500" />
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Your Clan</span>
            <h4 className="text-sm font-black text-slate-800 dark:text-white max-w-[130px] truncate">{myName}</h4>
          </div>
        </div>

        {/* VS Indicator */}
        <div className="col-span-1 flex items-center justify-center relative">
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 0.95, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="size-10 rounded-full border-2 border-indigo-500/20 bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center relative z-10"
          >
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">VS</span>
          </motion.div>
          <div className="absolute w-[150%] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent z-0" />
        </div>

        {/* Opponent Clan */}
        <div className="col-span-3 flex flex-col items-center text-center space-y-2">
          <ClanBanner banner={oppBanner} size="lg" className="hover:rotate-0 transition-transform duration-500" />
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Opponent</span>
            <h4 className="text-sm font-black text-slate-800 dark:text-white max-w-[130px] truncate">{oppName}</h4>
          </div>
        </div>
      </div>

      {/* Progress & Scores Indicator */}
      <div className="relative z-10 space-y-3">
        {/* Engagement stats */}
        <div className="flex items-center justify-between text-xs font-black">
          <div className="text-slate-700 dark:text-slate-300 flex items-baseline gap-1">
            <span className="text-2xl font-black">{myScore.toFixed(0)}</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">CXP</span>
          </div>

          <span
            className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md",
              isWinning
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : isTied
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}
          >
            {isWinning ? "🏆 Winning" : isTied ? "⚖️ Tied" : "🛡️ Defending"}
          </span>

          <div className="text-slate-700 dark:text-slate-300 flex items-baseline gap-1 text-right">
            <span className="text-2xl font-black">{oppScore.toFixed(0)}</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">CXP</span>
          </div>
        </div>

        {/* Dynamic Split Progress Bar */}
        <div className="h-4 w-full rounded-full bg-slate-200/50 dark:bg-slate-800/80 p-0.5 overflow-hidden flex gap-0.5 border border-slate-300/30 dark:border-slate-700/30 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]">
          {/* Left progress (Your Clan) */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${myPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "h-full rounded-l-full transition-all duration-500 ease-out flex items-center justify-end pr-2",
              isWinning ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
              isTied ? "bg-gradient-to-r from-indigo-500 to-indigo-400" : "bg-gradient-to-r from-rose-500 to-rose-400"
            )}
          >
            {myPercent > 20 && (
              <span className="text-[8px] font-black text-white">{myPercent}%</span>
            )}
          </motion.div>

          {/* Right progress (Opponent) */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${oppPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "h-full rounded-r-full transition-all duration-500 ease-out flex items-center pl-2",
              !isWinning && !isTied ? "bg-gradient-to-l from-emerald-500 to-teal-400 animate-pulse" :
              isTied ? "bg-gradient-to-l from-indigo-500 to-indigo-400" : "bg-gradient-to-l from-rose-500 to-rose-400"
            )}
          >
            {oppPercent > 20 && (
              <span className="text-[8px] font-black text-white">{oppPercent}%</span>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
