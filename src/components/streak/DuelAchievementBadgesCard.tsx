import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Award,
  CheckCircle2,
  Trophy,
  Clock,
  Zap,
  Sparkles,
  Swords,
  TrendingUp,
  Crown,
  Infinity as InfinityIcon,
  Shield,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DuelBadgeType, DUEL_BADGE_DETAILS, DuelBadgeDetail, DuelBadgeDetailModal } from "./DuelBadgeDetailModal";
import { DuelCelebrationModal } from "./DuelCelebrationModal";

const IconMap: Record<string, React.ElementType> = {
  Trophy,
  Medal: Award,
  Award,
  Zap,
  Shield,
  Swords,
  TrendingUp,
  Sparkles,
  Crown,
  Infinity: InfinityIcon
};

export function DuelAchievementBadgesCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBadge, setSelectedBadge] = useState<DuelBadgeType | null>(null);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<DuelBadgeType | null>(null);
  const [hoveredBadgeId, setHoveredBadgeId] = useState<string | null>(null);

  // 1. Fetch user duels to dynamically compute stats
  const { data: userDuels = [], isLoading: isDuelsLoading } = useQuery({
    queryKey: ["achievementDuels", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("streak_duels")
        .select("*")
        .or(`challenger_id.eq.${user.id},defender_id.eq.${user.id}`);

      if (error) {
        console.error("Error fetching achievement duels:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData
  });

  // 2. Fetch all completed duels to calculate Ranks Podium position
  const { data: allCompletedDuels = [] } = useQuery({
    queryKey: ["achievementAllCompletedDuels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("streak_duels")
        .select("winner_id, challenger_id, defender_id")
        .eq("status", "completed");
      if (error) return [];
      return data || [];
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData
  });

  // 3. Fetch unlocked badges from user_duel_badges
  const { data: dbUnlockedBadges = [], isLoading: isBadgesLoading } = useQuery({
    queryKey: ["unlockedDuelBadges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_duel_badges" as any)
        .select("badge_type")
        .eq("user_id", user.id);

      if (error) {
        // Table may not exist yet, fallback to empty array
        console.warn("user_duel_badges table query failed (migration might not be applied). Falling back to client-side detection.", error);
        return [];
      }
      return (data || []).map((row: any) => row.badge_type) as DuelBadgeType[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData
  });

  // 4. Mutation to unlock badge in DB
  const unlockBadgeMutation = useMutation({
    mutationFn: async (badgeType: DuelBadgeType) => {
      if (!user?.id) return;
      // Attempt insert
      const { error } = await supabase
        .from("user_duel_badges" as any)
        .insert({
          user_id: user.id,
          badge_type: badgeType,
          wins_count: winsCount
        });
      if (error && error.code !== "23505") {
        throw error;
      }
      return badgeType;
    },
    onSuccess: (badgeType) => {
      queryClient.invalidateQueries({ queryKey: ["unlockedDuelBadges", user?.id] });
      if (badgeType) {
        setNewlyUnlockedBadge(badgeType);
      }
    }
  });

  // --- Real-time statistics aggregation ---
  const winsCount = userDuels.filter(d => d.status === "completed" && d.winner_id === user?.id).length;
  const challengesCount = userDuels.filter(d => d.challenger_id === user?.id).length;
  const completedDuelsCount = userDuels.filter(d => d.status === "completed").length;
  const challengerWinsCount = userDuels.filter(
    d => d.status === "completed" && d.winner_id === user?.id && d.challenger_id === user?.id
  ).length;

  // Calculate Unbeaten Streak
  const completedDuelsSorted = [...userDuels]
    .filter(d => d.status === "completed")
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

  let currentUnbeaten = 0;
  let longestUnbeatenStreak = 0;
  completedDuelsSorted.forEach(d => {
    if (d.winner_id === user?.id || d.winner_id === null) {
      currentUnbeaten++;
      if (currentUnbeaten > longestUnbeatenStreak) {
        longestUnbeatenStreak = currentUnbeaten;
      }
    } else {
      currentUnbeaten = 0;
    }
  });

  // Calculate Rank Podium Position
  const currentRank = React.useMemo(() => {
    if (!user?.id) return 999;
    // Map of user_id -> wins
    const winsMap = new Map<string, { wins: number; total: number }>();
    allCompletedDuels.forEach((d: any) => {
      if (d.challenger_id) winsMap.set(d.challenger_id, { wins: 0, total: 0 });
      if (d.defender_id) winsMap.set(d.defender_id, { wins: 0, total: 0 });
    });

    allCompletedDuels.forEach((d: any) => {
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

    // Make sure current user is in map
    if (!winsMap.has(user.id)) {
      winsMap.set(user.id, { wins: 0, total: 0 });
    }

    const sortedPlayers = Array.from(winsMap.entries())
      .map(([id, stats]) => ({ id, wins: stats.wins, total: stats.total }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.total !== a.total) return b.total - a.total;
        return a.id.localeCompare(b.id);
      });

    const rankIdx = sortedPlayers.findIndex(p => p.id === user.id);
    return rankIdx !== -1 ? rankIdx + 1 : 999;
  }, [allCompletedDuels, user?.id]);

  // Keep track of badge unlock attempts in the current session to prevent duplicate spammed mutations
  const attemptedUnlocks = React.useRef<Set<string>>(new Set());

  // 5. Trigger DB updates for newly met badge criteria safely in a useEffect (outside the render path)
  React.useEffect(() => {
    if (!user?.id || isDuelsLoading || isBadgesLoading) return;

    const badgesToUnlock: DuelBadgeType[] = [];

    (Object.keys(DUEL_BADGE_DETAILS) as DuelBadgeType[]).forEach((key) => {
      const detail = DUEL_BADGE_DETAILS[key];
      let progress = 0;

      switch (key) {
        case 'first-victory':
          progress = winsCount;
          break;
        case '5-wins':
          progress = winsCount;
          break;
        case '10-wins':
          progress = winsCount;
          break;
        case '25-wins':
          progress = winsCount;
          break;
        case 'duel-champion':
          progress = winsCount;
          break;
        case 'top-challenger':
          progress = challengesCount;
          break;
        case 'rank-climber':
          progress = currentRank <= 3 ? 3 : 0;
          break;
        case 'unbeaten-streak':
          progress = longestUnbeatenStreak;
          break;
        case 'elite-competitor':
          progress = winsCount;
          break;
        case 'duel-veteran':
          progress = completedDuelsCount;
          break;
        case 'fast-challenger':
          progress = challengerWinsCount;
          break;
        case 'grand-master-duelist':
          progress = winsCount;
          break;
      }

      const isCriteriaMet = progress >= detail.target;
      const isUnlockedInDb = dbUnlockedBadges.includes(key);

      if (isCriteriaMet && !isUnlockedInDb && !attemptedUnlocks.current.has(key)) {
        attemptedUnlocks.current.add(key);
        badgesToUnlock.push(key);
      }
    });

    if (badgesToUnlock.length > 0) {
      badgesToUnlock.forEach((badge) => {
        unlockBadgeMutation.mutate(badge);
      });
    }
  }, [
    user?.id,
    isDuelsLoading,
    isBadgesLoading,
    winsCount,
    challengesCount,
    completedDuelsCount,
    challengerWinsCount,
    longestUnbeatenStreak,
    currentRank,
    dbUnlockedBadges
  ]);

  // Dynamic Badge Unlocks Mapping (pure display mapping without setState/mutation side effects)
  const badgesList = (Object.keys(DUEL_BADGE_DETAILS) as DuelBadgeType[]).map((key) => {
    const detail = DUEL_BADGE_DETAILS[key];
    let progress = 0;

    switch (key) {
      case 'first-victory':
        progress = winsCount;
        break;
      case '5-wins':
        progress = winsCount;
        break;
      case '10-wins':
        progress = winsCount;
        break;
      case '25-wins':
        progress = winsCount;
        break;
      case 'duel-champion':
        progress = winsCount;
        break;
      case 'top-challenger':
        progress = challengesCount;
        break;
      case 'rank-climber':
        progress = currentRank <= 3 ? 3 : 0;
        break;
      case 'unbeaten-streak':
        progress = longestUnbeatenStreak;
        break;
      case 'elite-competitor':
        progress = winsCount;
        break;
      case 'duel-veteran':
        progress = completedDuelsCount;
        break;
      case 'fast-challenger':
        progress = challengerWinsCount;
        break;
      case 'grand-master-duelist':
        progress = winsCount;
        break;
    }

    const isUnlocked = progress >= detail.target || dbUnlockedBadges.includes(key);

    return {
      id: key,
      ...detail,
      progress: Math.min(progress, detail.target),
      isUnlocked
    };
  });

  const unlockedCount = badgesList.filter(b => b.isUnlocked).length;

  if (isDuelsLoading || isBadgesLoading) {
    return (
      <div className="space-y-5 p-6 animate-pulse bg-white/70 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-[190px] rounded-2xl bg-slate-200 dark:bg-slate-800/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/40 w-full space-y-5 select-none transition-all duration-300">

      {/* Glow Effects */}
      <div className="absolute -top-24 -right-24 size-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 size-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 relative z-10">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-indigo-500" />
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Streak Duel Achievements</h3>
        </div>
        <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">
          {unlockedCount} / 12 Unlocked
        </span>
      </div>
      {/* Grid of Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 relative z-10">
        {badgesList.map((badge) => {
          const BadgeIcon = IconMap[badge.icon] || Trophy;
          const isUnlocked = badge.isUnlocked;

          // Circular progress ring variables
          const radius = 20;
          const strokeWidth = 2;
          const circumference = 2 * Math.PI * radius;
          const progressPercentage = isUnlocked ? 100 : (badge.progress / badge.target) * 100;
          const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
          const ringColor = isUnlocked ? (badge.imageUrl ? '#FBBF24' : badge.color) : '#6366F1'; // Indigo progress for locked

          return (
            <div
              key={badge.id}
              onClick={() => {
                if (isUnlocked) {
                  setSelectedBadge(badge.id);
                }
              }}
              onMouseEnter={() => !isUnlocked && setHoveredBadgeId(badge.id)}
              onMouseLeave={() => setHoveredBadgeId(null)}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4 flex flex-col justify-between items-center text-center space-y-3 transition-all duration-300 h-[190px] group select-none",
                isUnlocked
                  ? cn(
                      "bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-indigo-500/5 hover:border-indigo-500/30 cursor-pointer animate-shine-glint",
                      badge.imageUrl && "dark:border-amber-500/30 dark:hover:border-amber-500/60 dark:hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                    )
                  : "bg-slate-50/50 dark:bg-slate-950/10 border-slate-100 dark:border-slate-800/40 opacity-70 hover:opacity-85"
              )}
            >
              {/* Badge visual circle with Circular Progress Ring */}
              <div
                className="size-11 rounded-full flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105"
              >
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 size-full -rotate-90">
                  {/* Background Track Circle */}
                  <circle
                    cx="22"
                    cy="22"
                    r={radius}
                    className="stroke-slate-100 dark:stroke-slate-850 fill-none"
                    strokeWidth={strokeWidth}
                  />
                  {/* Animated Active Progress Circle */}
                  <circle
                    cx="22"
                    cy="22"
                    r={radius}
                    className="fill-none transition-all duration-500 ease-out"
                    strokeWidth={strokeWidth}
                    stroke={ringColor}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={isUnlocked ? { filter: `drop-shadow(0 0 2px ${ringColor}60)` } : {}}
                  />
                </svg>

                {/* Inner Icon/Image container */}
                <div className="absolute inset-[3px] rounded-full overflow-hidden flex items-center justify-center bg-white/40 dark:bg-slate-900/40">
                  {badge.imageUrl ? (
                    <img
                      src={badge.imageUrl}
                      alt={badge.name}
                      className={cn(
                        "size-7 shrink-0 object-contain",
                        !isUnlocked && "grayscale opacity-30 brightness-50 contrast-75 blur-[0.2px]"
                      )}
                    />
                  ) : (
                    <BadgeIcon className="size-4 shrink-0 opacity-40" />
                  )}
                  
                  {/* Lock Overlay for Locked Badges */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-slate-900/35 dark:bg-slate-950/70 backdrop-blur-[0.5px] flex items-center justify-center z-10 transition-colors duration-300 group-hover:bg-slate-900/20 dark:group-hover:bg-slate-950/45">
                      <Lock className="size-3 text-slate-300 dark:text-slate-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] animate-pulse" />
                    </div>
                  )}
                </div>

                {isUnlocked && (
                  <div className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 flex items-center justify-center border border-white dark:border-slate-900 text-white shadow-sm z-10">
                    <CheckCircle2 className="size-2.5 fill-emerald-500 text-white" />
                  </div>
                )}
              </div>

              {/* Title & Desc */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight truncate w-full max-w-[120px]">
                  {badge.name}
                </h4>
                <p className="text-[8px] text-slate-400 font-bold leading-normal line-clamp-2 w-full max-w-[110px]">
                  {badge.description.replace(/^[^\s]+\s/, '')}
                </p>
              </div>

              {/* Status footer / Actions */}
              <div className="w-full">
                {!isUnlocked ? (
                  <div className="space-y-1.5 w-full">
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
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

              {/* Locked Hover Hint Tooltip */}
              {hoveredBadgeId === badge.id && (
                <div className="absolute inset-x-3 bottom-14 bg-slate-950/95 border border-slate-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-md z-30 flex flex-col justify-center items-center text-center space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-1">
                    <Lock className="size-3 text-amber-500 fill-amber-500/10 animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">Locked Badge</span>
                  </div>
                  <p className="text-[7.5px] font-bold text-slate-300 leading-relaxed max-w-[130px]">
                    {badge.progress} / {badge.target} {badge.unit} completed. Keep dueling to unlock!
                  </p>
                  <div className="text-[6.5px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    Reward: {badge.reward}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail modal for unlocked badges */}
      <DuelBadgeDetailModal
        type={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />

      {/* Celebration popup for newly unlocked badges */}
      {newlyUnlockedBadge && (
        <DuelCelebrationModal
          badgeType={newlyUnlockedBadge}
          winsCount={winsCount}
          onClose={() => setNewlyUnlockedBadge(null)}
        />
      )}
    </div>
  );
}
