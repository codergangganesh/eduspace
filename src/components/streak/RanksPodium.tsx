import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Flame, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // 1. Fetch real-time active platform-wide rankings based on Streak Duel completed victories
  const { data: rankingsData, isLoading } = useQuery({
    queryKey: ["ranksPodiumDuelPlayers", user?.id],
    queryFn: async () => {
      if (!user?.id) return { top3: [], myRank: 0, myWins: 0 };
      
      // Fetch all completed duels
      const { data: completedDuels, error: duelsError } = await supabase
        .from("streak_duels")
        .select("winner_id, challenger_id, defender_id")
        .eq("status", "completed");

      if (duelsError) {
        console.error("Error fetching completed duels for podium:", duelsError);
        return { top3: [], myRank: 0, myWins: 0 };
      }

      // Aggregate wins per user
      const winsMap = new Map<string, { wins: number; total: number }>();
      
      completedDuels?.forEach((d: any) => {
        if (d.challenger_id) winsMap.set(d.challenger_id, { wins: 0, total: 0 });
        if (d.defender_id) winsMap.set(d.defender_id, { wins: 0, total: 0 });
      });

      completedDuels?.forEach((d: any) => {
        if (d.winner_id) {
          const stats = winsMap.get(d.winner_id) || { wins: 0, total: 0 };
          winsMap.set(d.winner_id, { ...stats, wins: stats.wins + 1 });
        }
        if (d.challenger_id) {
          const stats = winsMap.get(d.challenger_id) || { wins: 0, total: 0 };
          winsMap.set(d.challenger_id, { ...stats, total: stats.total + 1 });
        }
        if (d.defender_id) {
          const stats = winsMap.get(d.defender_id) || { wins: 0, total: 0 };
          winsMap.set(d.defender_id, { ...stats, total: stats.total + 1 });
        }
      });

      // Ensure the logged-in user is present in the map
      if (!winsMap.has(user.id)) {
        winsMap.set(user.id, { wins: 0, total: 0 });
      }

      // Sort players: wins DESC, then total completed battles DESC, then alphabetically by ID
      const sortedPlayers = Array.from(winsMap.entries())
        .map(([id, stats]) => ({
          id,
          wins: stats.wins,
          total: stats.total
        }))
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.total !== a.total) return b.total - a.total;
          return a.id.localeCompare(b.id);
        });

      // Find user rank and wins
      const myIndex = sortedPlayers.findIndex(p => p.id === user.id);
      const myRank = myIndex !== -1 ? myIndex + 1 : sortedPlayers.length + 1;
      const myWins = myIndex !== -1 ? sortedPlayers[myIndex].wins : 0;

      // Extract top 3 unique users
      const top3Raw = sortedPlayers.slice(0, 3);
      const top3Ids = top3Raw.map(p => p.id);
      const allUids = Array.from(new Set([...top3Ids, user.id])).filter((id): id is string => typeof id === 'string' && id.length > 0);

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url")
        .in("user_id", allUids);

      if (profilesError) {
        console.error("Error fetching profiles for podium:", profilesError);
      }

      const profileMap = new Map<string, any>();
      profiles?.forEach((p: any) => {
        if (p.user_id) profileMap.set(p.user_id, p);
        if (p.id) profileMap.set(p.id, p);
      });

      const top3 = top3Raw.map((p, idx) => {
        const prof = profileMap.get(p.id);
        return {
          rank: idx + 1,
          id: p.id,
          name: prof?.full_name || "Platform Challenger",
          wins: p.wins,
          avatar: prof?.avatar_url || undefined,
          isUser: p.id === user.id
        };
      });

      return {
        top3,
        myRank,
        myWins
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 seconds cache
    gcTime: 1000 * 60 * 5, // 5 min cache persistence
    placeholderData: keepPreviousData
  });

  const top3Rankers = rankingsData?.top3 || [];
  const myRank = rankingsData?.myRank || "-";
  const myWins = rankingsData?.myWins || 0;

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/40 w-full space-y-5 select-none transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-yellow-500 fill-yellow-500/20" />
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Climb the Ranks</h3>
        </div>
        <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">Duel Arena</span>
      </div>

      {/* Podium Ranks list (Top 3 Only) */}
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
        ) : top3Rankers.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 font-bold text-xs bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl p-4 border border-dashed border-slate-200 dark:border-slate-800">
            No completed duels yet. Start dueling!
          </div>
        ) : (
          top3Rankers.map((ranker) => (
            <div 
              key={ranker.id} 
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
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tight flex items-center gap-1 mt-0.5">
                    <Swords className="size-3 text-indigo-500" />
                    <span>{ranker.wins} {ranker.wins === 1 ? 'duel win' : 'duel wins'}</span>
                  </p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Highlighted Current User Row (Visible only if user is NOT in the Top 3 list) */}
        {!isLoading && !top3Rankers.some((ranker) => ranker.isUser) && (
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
                <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-505 border border-white dark:border-slate-900 flex items-center justify-center font-black text-[8px] text-white bg-emerald-500">
                  #{myRank}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate max-w-[90px]">{myName}</h4>
                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">YOU</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Your Rank: #{myRank}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-1 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider">
                <Swords className="size-3" /> {myWins} {myWins === 1 ? 'Win' : 'Wins'}
              </span>
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={onViewLeaderboard}
        className="w-full flex items-center justify-center rounded-xl border border-slate-200/60 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm"
      >
        View Arena Leaderboard
      </button>
    </div>
  );
}
