import React from "react";
import { Clan } from "@/types/clans";
import { ClanBanner } from "./ClanBanner";
import { Trophy, Shield, Swords, Star, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ClanLeaderboardProps {
  clans: Clan[];
  myClanId?: string;
  onJoinClan?: (clanId: string) => void;
  isJoined?: boolean;
}

export function ClanLeaderboard({ clans, myClanId, onJoinClan, isJoined }: ClanLeaderboardProps) {
  // Sort clans by CXP descending
  const sortedClans = [...clans].sort((a, b) => b.total_cxp - a.total_cxp);

  const topThree = sortedClans.slice(0, 3);
  const remaining = sortedClans.slice(3);

  // Reorder for podium visual: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], rank: 2 });
  if (topThree[0]) podiumOrder.push({ ...topThree[0], rank: 1 });
  if (topThree[2]) podiumOrder.push({ ...topThree[2], rank: 3 });

  return (
    <div className="space-y-8 w-full">
      {sortedClans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#1C1F26] rounded-[2rem] border border-slate-100 dark:border-white/5">
          <Trophy className="size-12 text-slate-300 dark:text-slate-700 animate-pulse mb-3" />
          <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">No Competitors</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            No academic clans have been registered in this course yet. Be the first to establish a house!
          </p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {topThree.length > 0 && (
            <div className="flex flex-col items-center justify-center pt-8">
              <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end w-full max-w-xl px-2">
                {podiumOrder.map((clan) => {
                  const isMyClan = clan.id === myClanId;
                  const medalColors: Record<number, string> = {
                    1: "bg-yellow-400 text-yellow-950 shadow-yellow-500/20",
                    2: "bg-slate-300 text-slate-900 shadow-slate-400/20",
                    3: "bg-amber-600 text-amber-50 shadow-amber-700/20"
                  };

                  const pedestalHeights: Record<number, string> = {
                    1: "h-[160px] bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
                    2: "h-[120px] bg-gradient-to-t from-slate-400/20 to-slate-400/5 border-slate-400/30",
                    3: "h-[90px] bg-gradient-to-t from-amber-600/20 to-amber-600/5 border-amber-600/30"
                  };

                  return (
                    <div key={clan.id} className="flex flex-col items-center select-none group">
                      {/* Banner & Label */}
                      <div className="flex flex-col items-center space-y-1.5 mb-2 relative">
                        <ClanBanner banner={clan.banner_style} size={clan.rank === 1 ? "lg" : "md"} />
                        
                        {/* Medal bubble */}
                        <div
                          className={cn(
                            "absolute -top-3 -right-3 size-6 sm:size-7 rounded-full flex items-center justify-center font-black text-xs shadow-lg z-10",
                            medalColors[clan.rank]
                          )}
                        >
                          {clan.rank}
                        </div>

                        <div className="text-center min-w-0 px-1 pt-1.5">
                          <h4 className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[90px] sm:max-w-[130px]">
                            {clan.name}
                          </h4>
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                            [{clan.tag}] • Lvl {clan.level}
                          </span>
                        </div>
                      </div>

                      {/* Pedestal block */}
                      <div
                        className={cn(
                          "w-full rounded-t-3xl border-t border-x flex flex-col items-center justify-center p-3 relative transition-all duration-500 group-hover:scale-105",
                          pedestalHeights[clan.rank],
                          isMyClan ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent shadow-lg" : ""
                        )}
                      >
                        <div className="text-center space-y-0.5">
                          <span className="text-[14px] font-black text-slate-700 dark:text-slate-200 block">
                            {clan.total_cxp}
                          </span>
                          <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                            CXP
                          </span>
                        </div>

                        {clan.trophies_count > 0 && (
                          <div className="absolute bottom-2 flex items-center gap-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 py-0.5 px-2 rounded-full text-[8px] font-black uppercase tracking-wider">
                            <Trophy className="size-2.5 fill-yellow-500" /> {clan.trophies_count}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leaderboard list for others */}
          {remaining.length > 0 && (
            <div className="space-y-2 relative max-w-2xl mx-auto w-full">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-3">
                Classroom Challengers
              </label>

              {remaining.map((clan, index) => {
                const rank = index + 4;
                const isMyClan = clan.id === myClanId;

                return (
                  <motion.div
                    key={clan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm",
                      isMyClan
                        ? "border-indigo-500/30 bg-indigo-500/5 ring-1 ring-indigo-500/10 shadow-md"
                        : "border-slate-100 dark:border-slate-800 hover:bg-slate-50/50"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Rank Index */}
                      <span className="text-sm font-black text-slate-400 w-5 shrink-0 text-center">
                        {rank}
                      </span>

                      {/* Banner Icon */}
                      <ClanBanner banner={clan.banner_style} size="sm" className="hover:rotate-0" />

                      <div className="min-w-0">
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                          {clan.name}
                          <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">
                            [{clan.tag}]
                          </span>
                        </h5>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                          Level {clan.level} • {clan.trophies_count} Trophies
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                          {clan.total_cxp}
                        </span>
                        <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                          CXP
                        </span>
                      </div>

                      {/* Join Action if not already joined */}
                      {!isJoined && onJoinClan && (
                        <button
                          onClick={() => onJoinClan(clan.id)}
                          className="size-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/10 transition-all active:scale-95"
                          title="Join Clan"
                        >
                          <UserPlus className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
