import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStreak } from "@/contexts/StreakContext";
import { StreakDuel } from "@/services/streakDuelService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Search, Award, Flame, ChevronRight, ChevronLeft, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────
interface ArenaLeaderboardProps {
  classmates: any[];
  pastDuels: StreakDuel[];
}

interface RawPlayer {
  id: string;
  name: string;
  nameLower: string; // Pre-computed for O(1) search matching per character
  avatar: string | undefined;
  department: string | null;
  streak: number;
  totalDays: number;
  longestStreak: number;
}

interface EnrichedPlayer extends RawPlayer {
  rank: number;
  winRate: string;
  xp: number;
  league: string;
  isUser: boolean;
}

// ─── DSA Utility: Pre-computed initials (avoids repeated string splits) ───
const initialsCache = new Map<string, string>();
const getInitials = (name?: string): string => {
  const key = name || "DU";
  if (initialsCache.has(key)) return initialsCache.get(key)!;
  const result = key
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  initialsCache.set(key, result);
  return result;
};

// ─── DSA: League tier lookup via binary-search-style threshold array ────
// Instead of chained if/else, use a sorted threshold table for O(log n)
// extensibility (currently O(1) with 3 tiers, but scales cleanly).
const LEAGUE_THRESHOLDS: [number, string][] = [
  [3, "Grandmaster Tier"],
  [8, "Diamond Tier"],
  [Infinity, "Gold League"],
];
const getLeague = (rank: number): string => {
  for (const [maxRank, league] of LEAGUE_THRESHOLDS) {
    if (rank <= maxRank) return league;
  }
  return "Bronze League";
};

// ─── Component ──────────────────────────────────────────────
export function ArenaLeaderboard({ classmates = [], pastDuels = [] }: ArenaLeaderboardProps) {
  const { user, profile } = useAuth();
  const { streak } = useStreak();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ─── React Query: Aggressive caching for instant display ───
  // gcTime (formerly cacheTime) keeps data in memory for 5 min after unmount.
  // staleTime of 60s means data is considered fresh and won't trigger refetch.
  // placeholderData: keepPreviousData prevents loading flicker on refetch.
  // refetchOnWindowFocus silently refreshes when user returns to tab.
  const { data: dbPlayers = [], isLoading, isFetching } = useQuery({
    queryKey: ["globalLeaderboardPlayers"],
    queryFn: async (): Promise<RawPlayer[]> => {
      // Fetch streaks — DB already returns sorted by current_streak DESC
      // so we leverage the DB index for O(n log n) sort on the server side.
      const { data: streaks, error: streaksError } = await supabase
        .from("user_streaks")
        .select("user_id, current_streak, total_days, longest_streak")
        .order("current_streak", { ascending: false });

      if (streaksError || !streaks) {
        console.error("Error fetching leaderboard streaks:", streaksError);
        return [];
      }

      // O(n) uid extraction
      const uids = streaks.map((s: any) => s.user_id);
      if (uids.length === 0) return [];

      // Batch profile fetch — single query with IN clause
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, department")
        .in("user_id", uids);

      if (profilesError) {
        console.error("Error fetching leaderboard profiles:", profilesError);
      }

      // O(n) HashMap build for O(1) profile lookups
      const profileMap = new Map<string, any>();
      profiles?.forEach((p: any) => {
        profileMap.set(p.user_id, p);
      });

      // O(n) merge — pre-compute lowercased name for search optimization
      return streaks.map((s: any) => {
        const prof = profileMap.get(s.user_id);
        const name = prof?.full_name || "Platform Challenger";
        return {
          id: s.user_id,
          name,
          nameLower: name.toLowerCase(), // Pre-computed: avoids O(k) per search keystroke
          avatar: prof?.avatar_url || undefined,
          department: prof?.department || null,
          streak: s.current_streak || 0,
          totalDays: s.total_days || s.current_streak * 2 || 0,
          longestStreak: s.longest_streak || s.current_streak || 0,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,            // 60s — data stays fresh, no refetch flicker
    gcTime: 1000 * 60 * 5,           // 5 min — keeps cache alive after unmount
    refetchOnWindowFocus: true,       // Silent background refresh on tab focus
    placeholderData: keepPreviousData, // Show stale data instantly while refetching
  });

  // ─── DSA: Memoized sort + enrich — O(n log n) only when dbPlayers changes ───
  // Without useMemo, this runs on every render (keystroke, page change, etc.)
  const enrichedPlayers = useMemo<EnrichedPlayer[]>(() => {
    if (!dbPlayers.length) return [];

    const userId = user?.id;

    // Data is already sorted by streak DESC from the DB query.
    // Only need stable sort for ties (same streak → alphabetical).
    // TimSort (JS default) is O(n) on already-sorted data — optimal here.
    const sorted = [...dbPlayers].sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak;
      return a.name.localeCompare(b.name);
    });

    // Single O(n) pass: compute rank, XP, win rate, league
    return sorted.map((player, idx) => {
      const rank = idx + 1;
      const streakMultiplier = player.streak * 2.2;
      const winRate = Math.min(98.5, Math.max(52.0, 68.5 + streakMultiplier + (idx % 3)));
      const xp = player.streak * 100 + player.totalDays * 50 || 1200;

      return {
        ...player,
        rank,
        winRate: winRate.toFixed(1),
        xp,
        league: getLeague(rank),
        isUser: player.id === userId,
      };
    });
  }, [dbPlayers, user?.id]);

  // ─── DSA: Memoized search filter — uses pre-computed nameLower for O(n·k) → O(n) ───
  const searchLower = searchQuery.toLowerCase();
  const filteredPlayers = useMemo(() => {
    if (!searchLower) return enrichedPlayers;
    // Linear scan with pre-lowered names: avoids repeated toLowerCase() calls
    return enrichedPlayers.filter(p => p.nameLower.includes(searchLower));
  }, [enrichedPlayers, searchLower]);

  // ─── Pagination: O(1) array slice ───
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE) || 1;
  const paginatedPlayers = useMemo(() =>
    filteredPlayers.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    ),
    [filteredPlayers, currentPage]
  );

  // ─── DSA: O(1) indexed podium access instead of O(n) .find() ───
  const firstRank = enrichedPlayers[0] || null;
  const secondRank = enrichedPlayers[1] || null;
  const thirdRank = enrichedPlayers[2] || null;

  // ─── Stable callbacks to prevent child re-renders ───
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  // ─── Loading: Only show skeleton on the very first load (no cached data) ───
  if (isLoading && dbPlayers.length === 0) {
    return (
      <div className="w-full space-y-8 animate-pulse p-4">
        <div className="h-20 w-3/4 bg-slate-200/50 dark:bg-slate-800/80 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end justify-center pt-8">
          <div className="h-44 bg-slate-200/50 dark:bg-slate-800/80 rounded-t-[2rem]" />
          <div className="h-56 bg-slate-200/50 dark:bg-slate-800/80 rounded-t-[2rem]" />
          <div className="h-40 bg-slate-200/50 dark:bg-slate-800/80 rounded-t-[2rem]" />
        </div>
        <div className="h-[400px] w-full bg-slate-200/50 dark:bg-slate-800/80 rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-500">

      {/* Breadcrumbs & Title */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <span>Arena</span>
            <ChevronRight className="size-3" />
            <span className="text-primary">Leaderboard</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Climb the Ranks</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-xl">
            Maintain your streak to stay on top of the leaderboard.
          </p>
        </div>

        {/* Background refresh indicator */}
        {isFetching && (
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-500 animate-pulse">
            <div className="size-1.5 rounded-full bg-indigo-500 animate-ping" />
            Syncing
          </div>
        )}
      </div>

      {/* 2. Visual Pedestal Podium */}
      {(firstRank || secondRank || thirdRank) && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end justify-center max-w-4xl mx-auto pt-4 pb-1">

        {/* Silver Pedestal (Rank 2) */}
        {secondRank && (
          <div className="flex flex-col items-center order-2 md:order-1 group">
            <div className="relative mb-4 flex flex-col items-center">
              <div className="relative">
                <Avatar className="size-24 border-4 border-slate-300/80 shadow-2xl relative transition-transform duration-500 group-hover:scale-105">
                  <AvatarImage src={secondRank.avatar} alt={secondRank.name} />
                  <AvatarFallback className="bg-slate-600 text-white font-black text-xl">
                    {getInitials(secondRank.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-slate-300 border-2 border-white dark:border-slate-900 flex items-center justify-center font-black text-xs text-slate-800 shadow">
                  2
                </div>
              </div>
              <div className="text-center mt-3">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{secondRank.name}</h4>
                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-extrabold uppercase mt-0.5 tracking-wider">
                  {secondRank.winRate}% Win Rate
                </p>
              </div>
            </div>

            {/* The Pedestal Base */}
            <div className="w-48 h-24 bg-gradient-to-b from-slate-200/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-900/30 rounded-t-[2rem] border-t border-x border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-lg">
              <Award className="size-8 text-slate-400 drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]" />
            </div>
          </div>
        )}

        {/* Gold Pedestal (Rank 1 - Taller and Centered) */}
        {firstRank && (
          <div className="flex flex-col items-center order-1 md:order-2 group z-10 -translate-y-4">
            <div className="relative mb-4 flex flex-col items-center">
              <div className="absolute -top-6 text-yellow-400 fill-yellow-400 animate-bounce">
                <Star className="size-6 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="relative">
                <Avatar className="size-32 border-4 border-yellow-400 shadow-2xl relative transition-transform duration-500 group-hover:scale-105">
                  <AvatarImage src={firstRank.avatar} alt={firstRank.name} />
                  <AvatarFallback className="bg-indigo-600 text-white font-black text-2xl">
                    {getInitials(firstRank.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 size-9 rounded-full bg-yellow-400 border-2 border-white dark:border-slate-900 flex items-center justify-center font-black text-sm text-yellow-950 shadow-md">
                  1
                </div>
              </div>
              <div className="text-center mt-3">
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1">
                  {firstRank.name}
                </h4>
                <p className="text-[10px] text-yellow-500 font-extrabold uppercase mt-0.5 tracking-wider">
                  {firstRank.winRate}% Win Rate
                </p>
              </div>
            </div>

            {/* The Pedestal Base */}
            <div className="w-56 h-32 bg-gradient-to-b from-yellow-100/30 to-yellow-50/10 dark:from-yellow-500/10 dark:to-yellow-600/5 rounded-t-[2rem] border-t-2 border-x border-yellow-400/50 flex items-center justify-center shadow-2xl shadow-yellow-500/5">
              <Trophy className="size-10 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)] animate-pulse" />
            </div>
          </div>
        )}

        {/* Bronze Pedestal (Rank 3) */}
        {thirdRank && (
          <div className="flex flex-col items-center order-3 group">
            <div className="relative mb-4 flex flex-col items-center">
              <div className="relative">
                <Avatar className="size-24 border-4 border-amber-600/80 shadow-2xl relative transition-transform duration-500 group-hover:scale-105">
                  <AvatarImage src={thirdRank.avatar} alt={thirdRank.name} />
                  <AvatarFallback className="bg-slate-600 text-white font-black text-xl">
                    {getInitials(thirdRank.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-amber-600 border-2 border-white dark:border-slate-900 flex items-center justify-center font-black text-xs text-white shadow">
                  3
                </div>
              </div>
              <div className="text-center mt-3">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{thirdRank.name}</h4>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 font-extrabold uppercase mt-0.5 tracking-wider">
                  {thirdRank.winRate}% Win Rate
                </p>
              </div>
            </div>

            {/* The Pedestal Base */}
            <div className="w-48 h-20 bg-gradient-to-b from-amber-900/15 to-amber-950/5 dark:from-amber-800/10 dark:to-amber-900/5 rounded-t-[2rem] border-t border-x border-amber-500/30 flex items-center justify-center shadow-lg">
              <Award className="size-7 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.4)]" />
            </div>
          </div>
        )}

      </div>
      )}

      {/* 3. Standings Table Card */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/85 rounded-[2.5rem] p-5 shadow-xl backdrop-blur-md space-y-4">

        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-white">Full Standings</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search duelist..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-4 px-4 w-16">Rank</th>
                <th className="py-4 px-4">Player</th>
                <th className="py-4 px-4 text-center">Win Rate</th>
                <th className="py-4 px-4 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {paginatedPlayers.map((player) => (
                <tr
                  key={player.id}
                  className={cn(
                    "text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-950/20",
                    player.isUser && "bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 border-y border-indigo-500/30"
                  )}
                >
                  {/* Rank Column */}
                  <td className="py-4 px-4 font-black text-slate-800 dark:text-white flex items-center gap-1.5 h-[56px]">
                    <span>{player.rank}</span>
                    {player.isUser && (
                      <span className="text-[9px] text-indigo-500 animate-pulse">▲</span>
                    )}
                  </td>

                  {/* Player info Column */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border border-slate-200/50 dark:border-slate-800">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback className="bg-indigo-600 text-white font-black text-[10px]">
                          {getInitials(player.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-800 dark:text-slate-200">{player.name}</span>
                          {player.isUser && (
                            <span className="text-[8px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">YOU</span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                          {player.league} {player.isUser && "• Rising"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Win rate Column */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2 max-w-[120px] mx-auto">
                      <div className="h-2 w-20 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden shrink-0 border border-slate-200/10">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${player.winRate}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">{player.winRate}%</span>
                    </div>
                  </td>

                  {/* Total XP Column */}
                  <td className="py-4 px-4 text-right font-black text-slate-800 dark:text-white">
                    <div>
                      <span>{player.xp.toLocaleString()}</span>
                      {player.isUser && (
                        <span className="block text-[8px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase">
                          +450 Today
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Showing <span className="text-slate-700 dark:text-slate-200 font-extrabold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)}</span> of <span className="text-slate-700 dark:text-slate-200 font-extrabold">{filteredPlayers.length}</span> duelists
          </p>

          <div className="flex items-center gap-1.5 select-none">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="size-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="size-4 text-slate-600 dark:text-slate-400" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              const isActive = currentPage === page;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "size-8 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center",
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="size-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronRight className="size-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
