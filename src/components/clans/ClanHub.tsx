import React, { useState } from "react";
import { Clan, ClanMember, BannerStyle } from "@/types/clans";
import { ClanBanner } from "./ClanBanner";
import { ClanBattleArena } from "./ClanBattleArena";
import { BannerBuilderModal } from "./BannerBuilderModal";
import { Users, Award, Trophy, ShieldAlert, LogOut, Settings, Plus, Sparkles, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useClans } from "@/hooks/useClans";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface ClanHubProps {
  clan: Clan;
  membership: ClanMember;
  members: ClanMember[];
  classId: string;
  onLeaveClan: () => void;
  onUpdateBanner: (banner: BannerStyle) => void;
}

export function ClanHub({ clan, membership, members, classId, onLeaveClan, onUpdateBanner }: ClanHubProps) {
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const isLeader = membership.role === "leader";

  // Level Progression Math
  const nextLevel = clan.level + 1;
  const currentLevelCxpThreshold = Math.round(1000 * Math.pow(clan.level, 1.5));
  const nextLevelCxpThreshold = Math.round(1000 * Math.pow(nextLevel, 1.5));
  const cxpNeededForNextLevel = nextLevelCxpThreshold - currentLevelCxpThreshold;
  const relativeCxpEarned = Math.max(0, clan.total_cxp - currentLevelCxpThreshold);
  
  const progressionPercent = Math.min(
    100,
    Math.round((relativeCxpEarned / cxpNeededForNextLevel) * 100)
  );

  // Retrieve active battle
  const { activeBattle, isLoading: isBattleLoading } = useClans(classId);

  const getInitials = (name?: string, fallback = "ST") =>
    (name || fallback)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full animate-in fade-in duration-500">
      
      {/* Left: Clan Status & Banner (1 Column) */}
      <div className="lg:col-span-1 flex flex-col justify-between p-6 bg-white dark:bg-[#1C1F26] rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.04),transparent_60%)]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 pt-4">
          <ClanBanner banner={clan.banner_style} size="xl" className="shadow-2xl animate-bounce duration-1000" />
          
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-2">
              {clan.name}
              <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                {clan.tag}
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Clan Profile & Crest</p>
          </div>

          {/* Level Progress */}
          <div className="w-full space-y-1.5 px-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Lvl {clan.level}</span>
              <span>{progressionPercent}% progress to Lvl {nextLevel}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden border border-slate-200/20 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-primary rounded-full transition-all duration-1000"
                style={{ width: `${progressionPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 text-right">
              <span className="hidden sm:inline">Total earned: {clan.total_cxp} CXP</span>
              <span>Need {cxpNeededForNextLevel - relativeCxpEarned} more CXP to Level Up</span>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100/50 dark:border-slate-800/30">
              <Trophy className="size-4 text-yellow-500 fill-yellow-500/20 mb-1" />
              <span className="text-lg font-black text-slate-800 dark:text-white">{clan.trophies_count}</span>
              <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Trophies</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100/50 dark:border-slate-800/30">
              <Users className="size-4 text-indigo-500 mb-1" />
              <span className="text-lg font-black text-slate-800 dark:text-white">{members.length} / 8</span>
              <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Classmates</span>
            </div>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="relative z-10 flex flex-col gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          {isLeader && (
            <button
              onClick={() => setIsBannerModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100/70 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200/20 text-slate-700 dark:text-slate-200 py-2.5 text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
            >
              <Settings className="size-4 text-slate-500" />
              <span>Modify Banner</span>
            </button>
          )}

          <button
            onClick={onLeaveClan}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 py-2.5 text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          >
            <LogOut className="size-4" />
            <span>{isLeader ? "Disband Guild" : "Quit Clan"}</span>
          </button>
        </div>

        {/* Banner Builder Popup */}
        <BannerBuilderModal
          isOpen={isBannerModalOpen}
          onClose={() => setIsBannerModalOpen(false)}
          onSave={onUpdateBanner}
          initialBanner={clan.banner_style}
        />
      </div>

      {/* Right: Roster & Battles Arena (2 Columns) */}
      <div className="lg:col-span-2 flex flex-col gap-6 items-stretch">
        
        {/* Weekly PvP Arena */}
        <ClanBattleArena battle={activeBattle} myClanId={clan.id} />

        {/* Members Roster Matrix */}
        <Card className="rounded-[2.5rem] p-6 border-none shadow-xl bg-white dark:bg-[#1C1F26] flex-1 flex flex-col justify-between">
          <CardContent className="p-0 flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Active Roster</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active classmates in your house</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[10px] font-black text-slate-500 dark:text-slate-400">
                  {members.length} Members
                </span>
              </div>

              {/* Roster matrix grid */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[250px] overflow-y-auto pr-1">
                {members.map((mem) => {
                  const initials = getInitials(mem.student_name);
                  const isLeaderItem = mem.role === "leader";

                  return (
                    <div key={mem.id} className="flex items-center justify-between py-3 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/10 px-2 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-slate-200/50 dark:border-slate-800/80 shadow-sm shrink-0">
                          <AvatarImage src={mem.profile_image ?? undefined} alt={mem.student_name} />
                          <AvatarFallback className="bg-indigo-600 font-black text-white text-[10px]">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {mem.student_name}
                            {isLeaderItem && (
                              <span className="text-[8px] font-black text-yellow-600 bg-yellow-500/10 dark:text-yellow-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Leader
                              </span>
                            )}
                          </h4>
                          <p className="text-[9px] font-bold text-slate-400">
                            Reg No: {mem.register_number}
                          </p>
                        </div>
                      </div>

                      <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100/50 dark:bg-slate-950/20 py-1 px-2.5 rounded-full border border-slate-200/20">
                        Joined {format(parseISO(mem.joined_at), "MMM d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
