import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Award, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

interface RanksPodiumProps {
  classmates: any[];
  userStreak?: number;
  onViewLeaderboard?: () => void;
}

export function RanksPodium({ classmates = [], userStreak = 0, onViewLeaderboard }: RanksPodiumProps) {
  const { user, profile } = useAuth();
  
  const myName = profile?.full_name || "You";
  const myAvatar = profile?.avatar_url || "";
  
  const getInitials = (name?: string) =>
    (name || "ST")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const myInitials = getInitials(myName);

  // 1. Fetch real-time active platform-wide rankings from user_streaks
  const { data: displayRanks = [], isLoading } = useQuery({
    queryKey: ["ranksPodiumPlayers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Fetch top streaks
      const { data: streaks, error: streaksError } = await db
        .from("user_streaks")
        .select("user_id, current_streak")
        .order("current_streak", { ascending: false })
        .limit(5);

      if (streaksError || !streaks || streaks.length === 0) {
        return [];
      }

      // Fetch profiles for these top players
      const uids = streaks.map((s: any) => s.user_id);
      const { data: profiles, error: profilesError } = await db
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", uids);

      const profileMap = new Map<string, { full_name: string; avatar_url: string }>();
      profiles?.forEach((p: any) => {
        profileMap.set(p.user_id, p);
      });

      return streaks.map((s: any, idx: number) => ({
        rank: idx + 1,
        name: profileMap.get(s.user_id)?.full_name || "Platform Challenger",
        streak: s.current_streak || 0,
        avatar: profileMap.get(s.user_id)?.avatar_url || undefined,
        isUser: s.user_id === user.id
      }));
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2 // 2 minutes cache
  });

  // Calculate current user's dynamic rank among all platform players
  const myRank = displayRanks.find(r => r.isUser)?.rank || "-";

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/40 w-full space-y-5 select-none transition-all duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-yellow-500 fill-yellow-500/20" />
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Climb the Ranks</h3>
        </div>
        <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">Live Arena</span>
      </div>

      {/* Podium Ranks list */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="space-y-3 py-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : displayRanks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 font-bold text-xs bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl p-4 border border-dashed border-slate-200 dark:border-slate-800">
            No active players in the arena yet.
          </div>
        ) : (
          displayRanks.map((ranker) => (
            <div 
              key={ranker.rank} 
              className={cn(
                "flex items-center justify-between py-1 px-1 transition-colors rounded-xl",
                ranker.isUser && "bg-indigo-500/5 border border-indigo-500/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="size-10 border border-slate-200/50 dark:border-slate-800/80 shadow-sm shrink-0">
                    <AvatarImage src={ranker.avatar} alt={ranker.name} />
                    <AvatarFallback className="bg-indigo-600 text-white font-black text-[10px]">
                      {getInitials(ranker.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 size-4 rounded-full border border-white dark:border-slate-900 flex items-center justify-center font-black text-[8px] text-white",
                    ranker.rank === 1 ? "bg-yellow-500" : ranker.rank === 2 ? "bg-slate-400" : ranker.rank === 3 ? "bg-amber-600" : "bg-indigo-600"
                  )}>
                    {ranker.rank}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    {ranker.name}
                    {ranker.isUser && (
                      <span className="text-[7px] font-black bg-indigo-600 text-white px-1 rounded uppercase tracking-wider">YOU</span>
                    )}
                  </h4>
                  <p className="text-[9px] font-bold text-orange-500 uppercase tracking-tight flex items-center gap-1 mt-0.5">
                    <Flame className="size-3 fill-orange-500 text-orange-500" />
                    <span>{ranker.streak} day streak</span>
                  </p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Highlighted Current User Row */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 flex items-center justify-between gap-3 shadow-md shadow-emerald-500/5">
          <div className="absolute -top-10 -right-10 size-20 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="size-10 border-2 border-emerald-400 shadow-sm">
                <AvatarImage src={myAvatar || undefined} />
                <AvatarFallback className="bg-emerald-600 font-black text-white text-[10px]">
                  {myInitials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 border border-white dark:border-slate-900 flex items-center justify-center font-black text-[8px] text-white">
                {myRank}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate max-w-[90px]">{myName}</h4>
                <span className="text-[8px] font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">YOU</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Active contender</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-1 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider">
              {userStreak} Day Streak
            </span>
          </div>
        </div>
      </div>

      <button 
        onClick={onViewLeaderboard}
        className="w-full flex items-center justify-center rounded-xl border border-slate-200/60 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm"
      >
        View Global Leaderboard
      </button>
    </div>
  );
}
