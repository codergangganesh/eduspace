import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceDot,
} from "recharts";
import {
  fetchCodeforcesRatingHistory,
  fetchLeetCodeRatingHistory,
  fetchCodeChefRatingHistory,
  fetchAtCoderRatingHistory,
  mergeRatingHistories,
  MergedRatingPoint,
  RatingPoint,
} from "@/services/ratingHistoryService";
import {
  AtCoderContestHistory,
  AtCoderStats,
  CodeChefContestHistory,
  CodeChefStats,
  LeetCodeStats,
} from "@/types/codingProfile";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  Check,
  Code2,
  Trophy,
  Sparkles,
  List,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingTrajectoryGraphProps {
  cfHandle?: string;
  lcUsername?: string;
  ccUsername?: string;
  atcoderUsername?: string;
  lcStats?: LeetCodeStats | null;
  ccStats?: CodeChefStats | null;
  ccContests?: CodeChefContestHistory[];
  atcoderStats?: AtCoderStats | null;
  atcoderContests?: AtCoderContestHistory[];
  selectedPlatformFilter?: "all" | "competitive" | "opensource" | "codewars" | "hackerrank" | string;
  className?: string;
}

type Timeframe = "3M" | "6M" | "1Y" | "ALL";
type GraphViewMode = "all" | "atcoder" | "codeforces" | "leetcode" | "codechef";

// Official AtCoder Tier Definitions & Colors
const ATCODER_TIERS = [
  { min: 2800, max: 5000, name: "Red / King", color: "#EF4444", text: "text-red-500", border: "border-red-500" },
  { min: 2400, max: 2800, name: "Orange", color: "#F97316", text: "text-orange-500", border: "border-orange-500" },
  { min: 2000, max: 2400, name: "Yellow", color: "#EAB308", text: "text-yellow-500", border: "border-yellow-500" },
  { min: 1600, max: 2000, name: "Blue", color: "#3B82F6", text: "text-blue-500", border: "border-blue-500" },
  { min: 1200, max: 1600, name: "Cyan", color: "#06B6D4", text: "text-cyan-500", border: "border-cyan-500" },
  { min: 800, max: 1200, name: "Green", color: "#10B981", text: "text-emerald-500", border: "border-emerald-500" },
  { min: 400, max: 800, name: "Brown", color: "#A8715A", text: "text-stone-500", border: "border-stone-500" },
  { min: 0, max: 400, name: "Gray", color: "#94A3B8", text: "text-slate-400", border: "border-slate-500" },
];

function getAtCoderTierInfo(rating: number) {
  for (const tier of ATCODER_TIERS) {
    if (rating >= tier.min) return tier;
  }
  return { min: 0, max: 400, name: "Unrated", color: "#64748B", text: "text-muted-foreground", border: "border-border" };
}

export function RatingTrajectoryGraph({
  cfHandle,
  lcUsername,
  ccUsername,
  atcoderUsername,
  lcStats,
  ccStats,
  ccContests,
  atcoderStats,
  atcoderContests,
  selectedPlatformFilter = "all",
  className,
}: RatingTrajectoryGraphProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [mergedData, setMergedData] = useState<MergedRatingPoint[]>([]);
  const [rawCF, setRawCF] = useState<RatingPoint[]>([]);
  const [rawLC, setRawLC] = useState<RatingPoint[]>([]);
  const [rawCC, setRawCC] = useState<RatingPoint[]>([]);
  const [rawAtCoder, setRawAtCoder] = useState<RatingPoint[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("ALL");
  const [viewMode, setViewMode] = useState<GraphViewMode>("all");

  // AtCoder specific view state
  const [atcoderContestType, setAtcoderContestType] = useState<"algorithm" | "heuristic">("algorithm");
  const [atcoderSubView, setAtcoderSubView] = useState<"rating" | "rank" | "list">("rating");
  const [hoveredAtCoderPoint, setHoveredAtCoderPoint] = useState<RatingPoint | null>(null);

  const [activePlatforms, setActivePlatforms] = useState({
    codeforces: true,
    leetcode: true,
    codechef: true,
    atcoder: true,
  });

  // Sync active platform filter
  useEffect(() => {
    setActivePlatforms({
      codeforces: true,
      leetcode: true,
      codechef: true,
      atcoder: true,
    });
  }, [selectedPlatformFilter]);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [cfPoints, lcPoints, ccPoints, atcoderPoints] = await Promise.all([
        cfHandle ? fetchCodeforcesRatingHistory(cfHandle) : Promise.resolve([]),
        (lcUsername || lcStats) ? fetchLeetCodeRatingHistory(lcUsername || "", lcStats) : Promise.resolve([]),
        (ccUsername || ccContests || ccStats) ? fetchCodeChefRatingHistory(ccUsername || "", ccContests, ccStats) : Promise.resolve([]),
        (atcoderUsername || atcoderContests || atcoderStats) ? fetchAtCoderRatingHistory(atcoderUsername || "", atcoderContests, atcoderStats) : Promise.resolve([]),
      ]);

      setRawCF(cfPoints);
      setRawLC(lcPoints);
      setRawCC(ccPoints);
      setRawAtCoder(atcoderPoints);

      const merged = mergeRatingHistories(
        cfPoints,
        lcPoints,
        ccPoints,
        atcoderPoints
      );
      setMergedData(merged);
    } catch (err) {
      console.error("Error loading rating history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    cfHandle,
    lcUsername,
    ccUsername,
    atcoderUsername,
    lcStats,
    ccStats?.rating,
    ccContests?.length,
    atcoderStats?.rating,
    atcoderContests?.length,
  ]);

  // Compute Peak Ratings and Activity Counts across platforms
  const stats = useMemo(() => {
    const cfMax = rawCF.length ? Math.max(...rawCF.map((p) => p.rating)) : null;
    const cfCurrent = rawCF.length ? rawCF[rawCF.length - 1].rating : null;

    const lcMax = rawLC.length ? Math.max(...rawLC.map((p) => p.rating)) : null;
    const lcCurrent = rawLC.length ? rawLC[rawLC.length - 1].rating : null;

    const ccMax = rawCC.length ? Math.max(...rawCC.map((p) => p.rating)) : null;
    const ccCurrent = rawCC.length ? rawCC[rawCC.length - 1].rating : null;

    const atcoderMax = rawAtCoder.length ? Math.max(...rawAtCoder.map((p) => p.rating)) : (atcoderStats?.maxRating || null);
    const atcoderCurrent = rawAtCoder.length ? rawAtCoder[rawAtCoder.length - 1].rating : (atcoderStats?.rating || null);

    const totalCount =
      rawCF.length +
      rawLC.length +
      rawCC.length +
      rawAtCoder.length;

    return {
      codeforces: { max: cfMax, current: cfCurrent, count: rawCF.length },
      leetcode: { max: lcMax, current: lcCurrent, count: rawLC.length },
      codechef: { max: ccMax, current: ccCurrent, count: rawCC.length },
      atcoder: { max: atcoderMax, current: atcoderCurrent, count: rawAtCoder.length },
      totalCount,
    };
  }, [rawCF, rawLC, rawCC, rawAtCoder, atcoderStats]);

  // Filter merged data by timeframe
  const filteredData = useMemo(() => {
    if (!mergedData.length) return [];
    if (timeframe === "ALL") return mergedData;

    const now = Math.floor(Date.now() / 1000);
    let secondsBack = 365 * 86400;
    if (timeframe === "3M") secondsBack = 90 * 86400;
    if (timeframe === "6M") secondsBack = 180 * 86400;

    const cutoff = now - secondsBack;
    return mergedData.filter((item) => item.timestamp >= cutoff);
  }, [mergedData, timeframe]);

  // Filter AtCoder points for dedicated view
  const filteredAtCoderPoints = useMemo(() => {
    if (atcoderContestType === "heuristic") {
      const hContests = atcoderStats?.heuristicRecentContests || [];
      const sorted = [...hContests].sort((a, b) => {
        const tA = a.date ? new Date(a.date).getTime() : 0;
        const tB = b.date ? new Date(b.date).getTime() : 0;
        return tA - tB;
      });
      let prev = sorted[0]?.rating || 800;
      return sorted.map((item) => {
        const delta = item.rating - prev;
        prev = item.rating;
        return {
          platform: "atcoder" as const,
          contestName: item.name || "AtCoder Heuristic Contest",
          rating: item.rating,
          date: item.date || new Date().toISOString().split("T")[0],
          timestamp: item.date ? Math.floor(new Date(item.date).getTime() / 1000) : Math.floor(Date.now() / 1000),
          delta,
          rank: item.rank,
          performance: item.performance,
        };
      });
    }

    if (timeframe === "ALL") return rawAtCoder;
    const now = Math.floor(Date.now() / 1000);
    let secondsBack = 365 * 86400;
    if (timeframe === "3M") secondsBack = 90 * 86400;
    if (timeframe === "6M") secondsBack = 180 * 86400;
    const cutoff = now - secondsBack;
    return rawAtCoder.filter((item) => item.timestamp >= cutoff);
  }, [rawAtCoder, atcoderContestType, atcoderStats, timeframe]);

  // Peak AtCoder Point
  const peakAtCoderPoint = useMemo(() => {
    if (!filteredAtCoderPoints.length) return null;
    let maxPt = filteredAtCoderPoints[0];
    for (const pt of filteredAtCoderPoints) {
      if (pt.rating > maxPt.rating) maxPt = pt;
    }
    return maxPt;
  }, [filteredAtCoderPoints]);

  // Latest AtCoder Point
  const latestAtCoderPoint = useMemo(() => {
    if (filteredAtCoderPoints.length > 0) {
      return filteredAtCoderPoints[filteredAtCoderPoints.length - 1];
    }
    if (atcoderStats?.recentContests && atcoderStats.recentContests.length > 0) {
      const last = atcoderStats.recentContests[0];
      return {
        platform: "atcoder" as const,
        contestName: last.name || "AtCoder Contest",
        rating: last.rating,
        date: last.date || new Date().toISOString().split("T")[0],
        timestamp: Math.floor(Date.now() / 1000),
        delta: 0,
        rank: last.rank,
        performance: last.performance,
      };
    }
    return null;
  }, [filteredAtCoderPoints, atcoderStats]);

  const activeAtCoderContest = hoveredAtCoderPoint || latestAtCoderPoint;
  const atcoderCurrentRating = stats.atcoder.current || atcoderStats?.rating || 0;
  const atcoderTierInfo = getAtCoderTierInfo(atcoderCurrentRating);

  // Formatted AtCoder Chart Data
  const atcoderChartData = useMemo(() => {
    return filteredAtCoderPoints.map((pt) => {
      const dateObj = new Date(pt.timestamp * 1000);
      const displayDate = dateObj.toLocaleDateString("en-US", {
        month: "short",
        year: filteredAtCoderPoints.length > 25 ? "2-digit" : "numeric",
      });
      return {
        ...pt,
        displayDate,
        isPeak: peakAtCoderPoint && pt.timestamp === peakAtCoderPoint.timestamp,
      };
    });
  }, [filteredAtCoderPoints, peakAtCoderPoint]);

  // Min and Max Y-axis bounds for smooth visualization
  const yDomain = useMemo(() => {
    if (viewMode === "atcoder") {
      if (!filteredAtCoderPoints.length) return [0, 4400];
      const ratings = filteredAtCoderPoints.map((p) => p.rating);
      const minR = Math.max(0, Math.min(...ratings) - 200);
      const maxR = Math.max(...ratings) + 300;
      const roundedMin = Math.floor(minR / 400) * 400;
      const roundedMax = Math.ceil(maxR / 400) * 400;
      return [Math.max(0, roundedMin), Math.max(2800, roundedMax)];
    }

    const visibleRatings: number[] = [];
    filteredData.forEach((item) => {
      if (activePlatforms.codeforces && typeof item.codeforces === "number") visibleRatings.push(item.codeforces);
      if (activePlatforms.leetcode && typeof item.leetcode === "number") visibleRatings.push(item.leetcode);
      if (activePlatforms.codechef && typeof item.codechef === "number") visibleRatings.push(item.codechef);
      if (activePlatforms.atcoder && typeof item.atcoder === "number") visibleRatings.push(item.atcoder);
    });

    if (visibleRatings.length === 0) return [200, 2000];
    const min = Math.max(0, Math.min(...visibleRatings) - 80);
    const max = Math.max(...visibleRatings) + 80;
    return [Math.floor(min / 50) * 50, Math.ceil(max / 50) * 50];
  }, [filteredData, activePlatforms, viewMode, filteredAtCoderPoints]);

  const togglePlatform = (key: keyof typeof activePlatforms) => {
    setActivePlatforms((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      const hasAnyActive = Object.values(updated).some(Boolean);
      if (!hasAnyActive) return prev;
      return updated;
    });
  };

  const renderDeltaBadge = (delta?: number | null) => {
    if (delta === undefined || delta === null || delta === 0) return null;
    const isUp = delta > 0;
    return (
      <span
        className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ml-1.5",
          isUp ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
        )}
      >
        {isUp ? `+${delta} ▲` : `${delta} ▼`}
      </span>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const dataItem = payload[0]?.payload as MergedRatingPoint;

    return (
      <div className="bg-card text-card-foreground border border-border/80 p-3.5 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-2 max-w-xs z-50">
        <div className="flex items-center justify-between border-b border-border/50 pb-1.5 font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" />
            {dataItem?.displayDate || label}
          </span>
        </div>

        <div className="space-y-2">
          {activePlatforms.codeforces && typeof dataItem?.codeforces === "number" && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-3 text-blue-600 dark:text-blue-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                  Codeforces
                </span>
                <div className="flex items-center">
                  <span className="font-extrabold text-foreground">{dataItem.codeforces}</span>
                  {renderDeltaBadge(dataItem.codeforcesDelta)}
                </div>
              </div>
              {dataItem.codeforcesContest && (
                <p className="text-[10px] text-muted-foreground truncate pl-3.5">
                  {dataItem.codeforcesContest}
                </p>
              )}
            </div>
          )}

          {activePlatforms.leetcode && typeof dataItem?.leetcode === "number" && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-3 text-amber-600 dark:text-amber-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                  LeetCode
                </span>
                <div className="flex items-center">
                  <span className="font-extrabold text-foreground">{dataItem.leetcode}</span>
                  {renderDeltaBadge(dataItem.leetcodeDelta)}
                </div>
              </div>
              {dataItem.leetcodeContest && (
                <p className="text-[10px] text-muted-foreground truncate pl-3.5">
                  {dataItem.leetcodeContest}
                </p>
              )}
            </div>
          )}

          {activePlatforms.codechef && typeof dataItem?.codechef === "number" && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-3 text-purple-600 dark:text-purple-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-purple-500 shrink-0" />
                  CodeChef
                </span>
                <div className="flex items-center">
                  <span className="font-extrabold text-foreground">{dataItem.codechef}</span>
                  {renderDeltaBadge(dataItem.codechefDelta)}
                </div>
              </div>
              {dataItem.codechefContest && (
                <p className="text-[10px] text-muted-foreground truncate pl-3.5">
                  {dataItem.codechefContest}
                </p>
              )}
            </div>
          )}

          {activePlatforms.atcoder && typeof dataItem?.atcoder === "number" && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-3 text-cyan-600 dark:text-cyan-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-cyan-500 shrink-0" />
                  AtCoder
                </span>
                <div className="flex items-center">
                  <span className="font-extrabold text-foreground">{dataItem.atcoder}</span>
                  {renderDeltaBadge(dataItem.atcoderDelta)}
                </div>
              </div>
              {dataItem.atcoderContest && (
                <p className="text-[10px] text-muted-foreground truncate pl-3.5">
                  {dataItem.atcoderContest}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-border/70 p-5 bg-card/90 space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    );
  }

  const hasData = filteredData.length > 0 || rawAtCoder.length > 0;

  // Platform Cards for UI
  const platformCards = [
    {
      key: "codeforces" as const,
      label: "Codeforces",
      colorClass: "text-blue-600 dark:text-blue-400",
      activeBg: "bg-blue-500/10 border-blue-500/40",
      dotBg: "bg-blue-500",
      checkColor: "text-blue-500",
      stroke: "#3B82F6",
      stat: stats.codeforces,
      isConfigured: Boolean(cfHandle || rawCF.length > 0),
    },
    {
      key: "leetcode" as const,
      label: "LeetCode",
      colorClass: "text-amber-600 dark:text-amber-400",
      activeBg: "bg-amber-500/10 border-amber-500/40",
      dotBg: "bg-amber-500",
      checkColor: "text-amber-500",
      stroke: "#F59E0B",
      stat: stats.leetcode,
      isConfigured: Boolean(lcUsername || lcStats || rawLC.length > 0),
    },
    {
      key: "codechef" as const,
      label: "CodeChef",
      colorClass: "text-purple-600 dark:text-purple-400",
      activeBg: "bg-purple-500/10 border-purple-500/40",
      dotBg: "bg-purple-500",
      checkColor: "text-purple-500",
      stroke: "#A855F7",
      stat: stats.codechef,
      isConfigured: Boolean(ccUsername || ccStats || rawCC.length > 0),
    },
    {
      key: "atcoder" as const,
      label: "AtCoder",
      colorClass: "text-cyan-600 dark:text-cyan-400",
      activeBg: "bg-cyan-500/10 border-cyan-500/40",
      dotBg: "bg-cyan-500",
      checkColor: "text-cyan-500",
      stroke: "#06B6D4",
      stat: stats.atcoder,
      isConfigured: Boolean(atcoderUsername || atcoderStats || rawAtCoder.length > 0),
    },
  ];

  const displayedCards = platformCards.filter((card) => card.isConfigured || ["codeforces", "leetcode", "codechef", "atcoder"].includes(card.key));

  return (
    <div className={cn("rounded-2xl border border-border/70 p-4 sm:p-5 bg-card/90 shadow-sm backdrop-blur-xl space-y-5", className)}>
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <TrendingUp className="size-3.5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
              Rating & Performance Graph
            </h3>
            {/* Total Activities Tag */}
            <Badge variant="outline" className="text-[10px] sm:text-xs font-bold gap-1 px-2 py-0.5 bg-primary/10 text-primary border-primary/20 rounded-lg shrink-0">
              <Trophy className="size-2.5 sm:size-3 text-primary" />
              {stats.totalCount} Total Activities
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {viewMode === "atcoder"
              ? "Official AtCoder Contest Status with real-time algorithm rating trajectory and color tiers."
              : selectedPlatformFilter === "all"
                ? "Real-time contest rating & performance overlay across official competitive coding platforms."
                : `Viewing ${selectedPlatformFilter} performance trajectory overlay.`}
          </p>
        </div>

        {/* Unified Single-Line Controls Toolbar (Fits on Screen with Zero Scroll) */}
        <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 sm:p-1 rounded-xl border border-border/40 text-xs self-start md:self-auto shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setViewMode("all")}
            className={cn(
              "px-2 sm:px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] sm:text-xs flex items-center gap-1",
              viewMode === "all"
                ? "bg-card text-foreground shadow-sm border border-border/60 font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="size-3" />
            <span>All</span>
          </button>
          <button
            onClick={() => setViewMode("atcoder")}
            className={cn(
              "px-2 sm:px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] sm:text-xs flex items-center gap-1",
              viewMode === "atcoder"
                ? "bg-cyan-500 text-slate-950 shadow-sm font-black"
                : "text-cyan-500 hover:text-cyan-400"
            )}
          >

            <span>AtCoder</span>
          </button>

          <div className="w-px h-3.5 bg-border/60 mx-0.5 sm:mx-1" />

          {(["3M", "6M", "1Y", "ALL"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-semibold transition-all text-[10px] sm:text-xs",
                timeframe === tf
                  ? "bg-card text-foreground shadow-sm border border-border/60 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tf}
            </button>
          ))}

          <div className="w-px h-3.5 bg-border/60 mx-0.5" />

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh Rating History"
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-all flex items-center justify-center hover:bg-card/60"
          >
            <RefreshCw className={cn("size-3", refreshing && "animate-spin text-primary")} />
          </button>
        </div>
      </div>

      {/* VIEW 1: DEDICATED ATCODER OFFICIAL CONTEST STATUS GRAPH */}
      {viewMode === "atcoder" ? (
        <div className="space-y-4 pt-1">
          {/* AtCoder Contest Status Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-foreground tracking-tight flex items-center gap-1.5">
                <Trophy className="size-4 text-cyan-500" />
                Contest Status
              </h4>
              <span className="text-xs text-muted-foreground">
                ({rawAtCoder.length} Rated Matches)
              </span>
            </div>

            {/* Algorithm / Heuristic Tab Switcher */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs font-bold self-start sm:self-auto">
              <button
                onClick={() => {
                  setAtcoderContestType("algorithm");
                  setHoveredAtCoderPoint(null);
                }}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all text-xs flex items-center gap-1",
                  atcoderContestType === "algorithm"
                    ? "bg-card text-foreground shadow-sm border border-border/60 font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="size-3 text-cyan-400" />
                Algorithm
              </button>
              <button
                onClick={() => {
                  setAtcoderContestType("heuristic");
                  setHoveredAtCoderPoint(null);
                }}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all text-xs flex items-center gap-1",
                  atcoderContestType === "heuristic"
                    ? "bg-card text-foreground shadow-sm border border-border/60 font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Trophy className="size-3 text-amber-400" />
                Heuristic
              </button>
            </div>
          </div>

          {/* AtCoder Key Metrics Summary (Rank, Rating, Highest Rating, Rated Matches, Last Competed) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/50 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Rank</span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-foreground">
                {atcoderStats?.globalRank ? `#${atcoderStats.globalRank.toLocaleString()}` : (atcoderCurrentRating > 0 ? "Top Tier" : "Unranked")}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Rating</span>
              <span className={cn("text-sm sm:text-base font-black font-mono", atcoderTierInfo.text)}>
                {atcoderCurrentRating > 0 ? atcoderCurrentRating : "Unrated"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Highest Rating</span>
              <span className="text-sm sm:text-base font-black font-mono text-foreground">
                {stats.atcoder.max || atcoderStats?.maxRating || atcoderCurrentRating}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Rated Matches</span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-foreground">
                {rawAtCoder.length || atcoderStats?.competitionsCount || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Last Competed</span>
              <span className="text-xs sm:text-sm font-semibold text-muted-foreground truncate block">
                {atcoderStats?.lastCompeted || (activeAtCoderContest?.date) || "Active"}
              </span>
            </div>
          </div>

          {/* Dynamic Contest Highlight Banner (Framed in Active Tier Color) */}
          {activeAtCoderContest && (
            <div
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/90 shadow-sm",
                atcoderTierInfo.border
              )}
            >
              {/* Left: Big Rating */}
              <div className="flex items-center gap-3">
                <div className={cn("text-3xl sm:text-4xl font-black font-mono tracking-tighter leading-none", atcoderTierInfo.text)}>
                  {activeAtCoderContest.rating}
                </div>
                {/* Middle: Rank & Delta */}
                {activeAtCoderContest.rank !== undefined && (
                  <div className="border-l border-border/60 pl-3">
                    <div className="text-xs sm:text-sm font-extrabold text-foreground">
                      {activeAtCoderContest.rank}
                      {activeAtCoderContest.rank === 1 ? "st" : activeAtCoderContest.rank === 2 ? "nd" : activeAtCoderContest.rank === 3 ? "rd" : "th"} Place
                    </div>
                    {activeAtCoderContest.delta !== undefined && activeAtCoderContest.delta !== 0 && (
                      <div
                        className={cn(
                          "text-xs font-black font-mono flex items-center gap-0.5",
                          activeAtCoderContest.delta > 0 ? "text-emerald-500" : "text-rose-500"
                        )}
                      >
                        {activeAtCoderContest.delta > 0 ? `+${activeAtCoderContest.delta} ▲` : `${activeAtCoderContest.delta} ▼`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Date & Contest Title */}
              <div className="text-left sm:text-right space-y-0.5 min-w-0">
                <div className="text-[11px] text-muted-foreground font-semibold flex items-center sm:justify-end gap-1">
                  <Calendar className="size-3 text-cyan-500" />
                  <span>{activeAtCoderContest.date}</span>
                </div>
                <h5 className="font-extrabold text-xs sm:text-sm text-foreground truncate max-w-sm" title={activeAtCoderContest.contestName}>
                  {activeAtCoderContest.contestName}
                </h5>
              </div>
            </div>
          )}

          {/* Sub-View Mode Toggles (Rating, Rank, Contests List) */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40 text-xs font-bold">
              <button
                onClick={() => setAtcoderSubView("rating")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all text-xs",
                  atcoderSubView === "rating"
                    ? "bg-card text-foreground shadow-sm border border-border/60 font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Rating
              </button>
              <button
                onClick={() => setAtcoderSubView("rank")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all text-xs",
                  atcoderSubView === "rank"
                    ? "bg-card text-foreground shadow-sm border border-border/60 font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Rank
              </button>
              <button
                onClick={() => setAtcoderSubView("list")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all text-xs flex items-center gap-1",
                  atcoderSubView === "list"
                    ? "bg-card text-foreground shadow-sm border border-border/60 font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-3" />
                Contests ({filteredAtCoderPoints.length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-cyan-500 font-bold">
              <a
                href={atcoderUsername ? `https://atcoder.jp/users/${atcoderUsername}/history` : `https://atcoder.jp/`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-0.5"
              >
                <span>[Competition History]</span>
                <ArrowUpRight className="size-3" />
              </a>
            </div>
          </div>

          {/* AtCoder Graph or List Table */}
          {atcoderSubView === "list" ? (
            <div className="rounded-2xl border border-border/70 overflow-hidden bg-card/60">
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-border/40">
                {filteredAtCoderPoints.slice().reverse().map((c, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredAtCoderPoint(c)}
                    onMouseLeave={() => setHoveredAtCoderPoint(null)}
                    className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-foreground truncate text-xs block">{c.contestName}</span>
                      <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2 mt-0.5">
                        <span>{c.date}</span>
                        {c.rank && <span>• Rank #{c.rank}</span>}
                        {c.performance && <span>• Perf: {c.performance}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black font-mono text-sm text-foreground block">{c.rating}</span>
                      {c.delta !== undefined && c.delta !== 0 && (
                        <span className={cn("text-[10px] font-bold font-mono", c.delta > 0 ? "text-emerald-500" : "text-rose-500")}>
                          {c.delta > 0 ? `+${c.delta}` : `${c.delta}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[280px] sm:h-[340px] w-full rounded-2xl border border-border/80 p-2 sm:p-3 bg-card/40 backdrop-blur-md relative overflow-hidden">
              {atcoderChartData.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 space-y-1">
                  <Trophy className="size-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No rated contest matches found.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={atcoderChartData}
                    margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
                    onMouseMove={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length) {
                        setHoveredAtCoderPoint(state.activePayload[0].payload);
                      }
                    }}
                    onMouseLeave={() => setHoveredAtCoderPoint(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.4)" />

                    {/* Official AtCoder Colored Rating Tier Bands */}
                    {atcoderSubView === "rating" &&
                      ATCODER_TIERS.map((tier) => {
                        if (tier.min > yDomain[1] || tier.max < yDomain[0]) return null;
                        return (
                          <ReferenceArea
                            key={tier.name}
                            y1={Math.max(tier.min, yDomain[0])}
                            y2={Math.min(tier.max, yDomain[1])}
                            fill={tier.color}
                            fillOpacity={0.14}
                            strokeOpacity={0}
                          />
                        );
                      })}

                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      dy={5}
                    />

                    <YAxis
                      domain={atcoderSubView === "rating" ? yDomain : ["dataMin - 10", "dataMax + 10"]}
                      reversed={atcoderSubView === "rank"}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const pt = payload[0].payload as RatingPoint;
                        return (
                          <div className="bg-card/95 text-card-foreground border border-border p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
                            <div className="font-extrabold text-foreground border-b border-border/50 pb-1 flex items-center justify-between gap-2">
                              <span>{pt.date}</span>
                              <span className={cn("font-mono font-black", getAtCoderTierInfo(pt.rating).text)}>
                                {pt.rating}
                              </span>
                            </div>
                            <p className="font-bold text-foreground text-[11px]">{pt.contestName}</p>
                            <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
                              {pt.rank && <span>Rank: #{pt.rank}</span>}
                              {pt.delta !== undefined && (
                                <span className={cn("font-bold", pt.delta >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                  {pt.delta >= 0 ? `+${pt.delta}` : `${pt.delta}`}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />

                    {/* Peak Rating Marker */}
                    {peakAtCoderPoint && atcoderSubView === "rating" && (
                      <ReferenceDot
                        x={new Date(peakAtCoderPoint.timestamp * 1000).toLocaleDateString("en-US", {
                          month: "short",
                          year: filteredAtCoderPoints.length > 25 ? "2-digit" : "numeric",
                        })}
                        y={peakAtCoderPoint.rating}
                        r={6}
                        fill="#EF4444"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        label={{
                          value: `Highest: ${peakAtCoderPoint.rating}`,
                          position: "top",
                          fill: "#EF4444",
                          fontSize: 11,
                          fontWeight: 800,
                          offset: 10,
                        }}
                      />
                    )}

                    <Line
                      type="monotone"
                      dataKey={atcoderSubView === "rating" ? "rating" : "rank"}
                      name={atcoderSubView === "rating" ? "Rating" : "Rank"}
                      stroke={atcoderSubView === "rating" ? "#EF4444" : "#06B6D4"}
                      strokeWidth={2.5}
                      dot={{
                        r: 3.5,
                        fill: atcoderSubView === "rating" ? "#EF4444" : "#06B6D4",
                        stroke: "#ffffff",
                        strokeWidth: 1,
                      }}
                      activeDot={{
                        r: 6,
                        stroke: atcoderSubView === "rating" ? "#EF4444" : "#06B6D4",
                        strokeWidth: 2,
                        fill: "#ffffff",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: MULTI-PLATFORM OVERLAY GRAPH WITH 4 PLATFORMS */
        <>
          {/* Platform Metric Badges / Toggles (Dynamic Responsive Grid - 4 Official Platforms) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {displayedCards.map((card) => {
              const isActive = activePlatforms[card.key];
              return (
                <button
                  key={card.key}
                  onClick={() => togglePlatform(card.key)}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-left flex flex-col justify-between space-y-1 relative overflow-hidden",
                    isActive
                      ? `${card.activeBg} text-foreground shadow-sm`
                      : "bg-muted/30 border-border/40 text-muted-foreground opacity-60 hover:opacity-100"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={cn("text-xs font-bold flex items-center gap-1.5 truncate", card.colorClass)}>
                      <span className={cn("size-2 rounded-full shrink-0", card.dotBg)} />
                      <span className="truncate">{card.label}</span>
                    </span>
                    {isActive && <Check className={cn("size-3 shrink-0", card.checkColor)} />}
                  </div>
                  <div className="flex items-baseline justify-between w-full pt-0.5">
                    <span className="text-sm sm:text-base font-extrabold text-foreground">
                      {card.stat.current !== null ? card.stat.current : "N/A"}
                    </span>
                    {card.stat.max !== null && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Peak: <strong className="text-foreground font-bold">{card.stat.max}</strong>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Chart Area */}
          {!hasData ? (
            <div className="h-[260px] w-full rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <Code2 className="size-8 text-muted-foreground/50" />
              <h4 className="text-sm font-semibold text-foreground">No Performance History Available</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                Link your platform handles in profile settings to plot your real-time rating & activity trajectory.
              </p>
            </div>
          ) : (
            <div className="h-[280px] sm:h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />

                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    dy={6}
                  />

                  <YAxis
                    domain={yDomain}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  {activePlatforms.codeforces && (
                    <Line
                      type="monotone"
                      dataKey="codeforces"
                      name="Codeforces"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#3B82F6", strokeWidth: 1, stroke: "#ffffff" }}
                      activeDot={{ r: 6.5, stroke: "#3B82F6", strokeWidth: 2.5, fill: "#ffffff" }}
                      connectNulls
                    />
                  )}

                  {activePlatforms.leetcode && (
                    <Line
                      type="monotone"
                      dataKey="leetcode"
                      name="LeetCode"
                      stroke="#F59E0B"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#F59E0B", strokeWidth: 1, stroke: "#ffffff" }}
                      activeDot={{ r: 6.5, stroke: "#F59E0B", strokeWidth: 2.5, fill: "#ffffff" }}
                      connectNulls
                    />
                  )}

                  {activePlatforms.codechef && (
                    <Line
                      type="monotone"
                      dataKey="codechef"
                      name="CodeChef"
                      stroke="#A855F7"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#A855F7", strokeWidth: 1, stroke: "#ffffff" }}
                      activeDot={{ r: 6.5, stroke: "#A855F7", strokeWidth: 2.5, fill: "#ffffff" }}
                      connectNulls
                    />
                  )}

                  {activePlatforms.atcoder && (
                    <Line
                      type="monotone"
                      dataKey="atcoder"
                      name="AtCoder"
                      stroke="#06B6D4"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#06B6D4", strokeWidth: 1, stroke: "#ffffff" }}
                      activeDot={{ r: 6.5, stroke: "#06B6D4", strokeWidth: 2.5, fill: "#ffffff" }}
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
