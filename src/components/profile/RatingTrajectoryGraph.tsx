import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  fetchCodeforcesRatingHistory,
  fetchLeetCodeRatingHistory,
  fetchCodeChefRatingHistory,
  fetchHackerRankRatingHistory,
  mergeRatingHistories,
  MergedRatingPoint,
  RatingPoint,
} from "@/services/ratingHistoryService";
import { CodeChefContestHistory, CodeChefStats, HackerRankStats, LeetCodeStats } from "@/types/codingProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  Check,
  Code2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingTrajectoryGraphProps {
  cfHandle?: string;
  lcUsername?: string;
  ccUsername?: string;
  cwUsername?: string;
  hrUsername?: string;
  hrStats?: HackerRankStats | null;
  lcStats?: LeetCodeStats | null;
  ccStats?: CodeChefStats | null;
  ccContests?: CodeChefContestHistory[];
  selectedPlatformFilter?: "all" | "competitive" | "opensource" | "hackerrank" | "codewars";
  className?: string;
}

type Timeframe = "3M" | "6M" | "1Y" | "ALL";

export function RatingTrajectoryGraph({
  cfHandle,
  lcUsername,
  ccUsername,
  cwUsername,
  hrUsername,
  hrStats,
  lcStats,
  ccStats,
  ccContests,
  selectedPlatformFilter = "all",
  className,
}: RatingTrajectoryGraphProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [mergedData, setMergedData] = useState<MergedRatingPoint[]>([]);
  const [rawCF, setRawCF] = useState<RatingPoint[]>([]);
  const [rawLC, setRawLC] = useState<RatingPoint[]>([]);
  const [rawCC, setRawCC] = useState<RatingPoint[]>([]);
  const [rawHR, setRawHR] = useState<RatingPoint[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("ALL");

  const [activePlatforms, setActivePlatforms] = useState({
    codeforces: true,
    leetcode: true,
    codechef: true,
    hackerrank: true,
  });

  // Sync active platform filter with top selection bar
  useEffect(() => {
    if (selectedPlatformFilter === "hackerrank") {
      setActivePlatforms({ codeforces: false, leetcode: false, codechef: false, hackerrank: true });
    } else if (selectedPlatformFilter === "competitive") {
      setActivePlatforms({ codeforces: true, leetcode: true, codechef: true, hackerrank: false });
    } else {
      setActivePlatforms({ codeforces: true, leetcode: true, codechef: true, hackerrank: true });
    }
  }, [selectedPlatformFilter]);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [cfPoints, lcPoints, ccPoints, hrPoints] = await Promise.all([
        cfHandle ? fetchCodeforcesRatingHistory(cfHandle) : Promise.resolve([]),
        lcUsername ? fetchLeetCodeRatingHistory(lcUsername, lcStats) : Promise.resolve([]),
        fetchCodeChefRatingHistory(ccUsername || "", ccContests, ccStats),
        (hrUsername || hrStats) ? fetchHackerRankRatingHistory(hrUsername || "", hrStats) : Promise.resolve([]),
      ]);

      setRawCF(cfPoints);
      setRawLC(lcPoints);
      setRawCC(ccPoints);
      setRawHR(hrPoints);

      const merged = mergeRatingHistories(cfPoints, lcPoints, ccPoints, [], hrPoints);
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
  }, [cfHandle, lcUsername, ccUsername, hrUsername, hrStats, lcStats, ccStats?.rating, ccContests?.length]);

  // Compute Peak Ratings and Activity Counts across platforms
  const stats = useMemo(() => {
    const cfMax = rawCF.length ? Math.max(...rawCF.map((p) => p.rating)) : null;
    const cfCurrent = rawCF.length ? rawCF[rawCF.length - 1].rating : null;

    const lcMax = rawLC.length ? Math.max(...rawLC.map((p) => p.rating)) : null;
    const lcCurrent = rawLC.length ? rawLC[rawLC.length - 1].rating : null;

    const ccMax = rawCC.length ? Math.max(...rawCC.map((p) => p.rating)) : null;
    const ccCurrent = rawCC.length ? rawCC[rawCC.length - 1].rating : null;

    const hrMax = rawHR.length ? Math.max(...rawHR.map((p) => p.rating)) : null;
    const hrCurrent = rawHR.length ? rawHR[rawHR.length - 1].rating : null;

    const totalCount = rawCF.length + rawLC.length + rawCC.length + rawHR.length;

    return {
      codeforces: { max: cfMax, current: cfCurrent, count: rawCF.length },
      leetcode: { max: lcMax, current: lcCurrent, count: rawLC.length },
      codechef: { max: ccMax, current: ccCurrent, count: rawCC.length },
      hackerrank: { max: hrMax, current: hrCurrent, count: rawHR.length },
      totalCount,
    };
  }, [rawCF, rawLC, rawCC, rawHR]);

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

  // Min and Max Y-axis bounds for smooth visualization
  const yDomain = useMemo(() => {
    const visibleRatings: number[] = [];
    filteredData.forEach((item) => {
      if (activePlatforms.codeforces && typeof item.codeforces === "number") visibleRatings.push(item.codeforces);
      if (activePlatforms.leetcode && typeof item.leetcode === "number") visibleRatings.push(item.leetcode);
      if (activePlatforms.codechef && typeof item.codechef === "number") visibleRatings.push(item.codechef);
      if (activePlatforms.hackerrank && typeof item.hackerrank === "number") visibleRatings.push(item.hackerrank);
    });

    if (visibleRatings.length === 0) return [300, 2000];
    const min = Math.max(0, Math.min(...visibleRatings) - 80);
    const max = Math.max(...visibleRatings) + 80;
    return [Math.floor(min / 50) * 50, Math.ceil(max / 50) * 50];
  }, [filteredData, activePlatforms]);

  const togglePlatform = (key: "codeforces" | "leetcode" | "codechef" | "hackerrank") => {
    setActivePlatforms((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (!updated.codeforces && !updated.leetcode && !updated.codechef && !updated.hackerrank) return prev;
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

          {activePlatforms.hackerrank && typeof dataItem?.hackerrank === "number" && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                  HackerRank
                </span>
                <div className="flex items-center">
                  <span className="font-extrabold text-foreground">{dataItem.hackerrank}</span>
                  {renderDeltaBadge(dataItem.hackerrankDelta)}
                </div>
              </div>
              {dataItem.hackerrankContest && (
                <p className="text-[10px] text-muted-foreground truncate pl-3.5">
                  {dataItem.hackerrankContest}
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

  const hasData = filteredData.length > 0;

  return (
    <div className={cn("rounded-2xl border border-border/70 p-4 sm:p-5 bg-card/90 shadow-sm backdrop-blur-xl space-y-5", className)}>
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <TrendingUp className="size-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Rating & Performance Graph
            </h3>
            {/* Total Activities Tag on right side of title */}
            <Badge variant="outline" className="text-xs font-bold gap-1 px-2.5 py-1 bg-primary/10 text-primary border-primary/20 rounded-xl shrink-0">
              <Trophy className="size-3 text-primary" />
              {stats.totalCount} Total Activities
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedPlatformFilter === "all"
              ? "Contest rating & performance overlay across Competitive Platforms."
              : `Viewing ${selectedPlatformFilter} performance trajectory.`}
          </p>
        </div>

        {/* Filters & Integrated Refresh Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-0.5 bg-muted/60 p-1 rounded-xl border border-border/40 text-xs">
            {(["3M", "6M", "1Y", "ALL"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-semibold transition-all text-xs",
                  timeframe === tf
                    ? "bg-card text-foreground shadow-sm border border-border/60"
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
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin text-primary")} />
            </button>
          </div>
        </div>
      </div>

      {/* Platform Metric Badges / Toggles (4 Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Codeforces Chip */}
        <button
          onClick={() => togglePlatform("codeforces")}
          className={cn(
            "p-3 rounded-xl border transition-all text-left flex flex-col justify-between space-y-1 relative overflow-hidden",
            activePlatforms.codeforces
              ? "bg-blue-500/10 border-blue-500/40 text-foreground"
              : "bg-muted/30 border-border/40 text-muted-foreground opacity-60 hover:opacity-100"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" />
              Codeforces
            </span>
            {activePlatforms.codeforces && <Check className="size-3 text-blue-500" />}
          </div>
          <div className="flex items-baseline justify-between w-full pt-1">
            <span className="text-base font-extrabold text-foreground">
              {stats.codeforces.current !== null ? stats.codeforces.current : "N/A"}
            </span>
            {stats.codeforces.max !== null && (
              <span className="text-[10px] text-muted-foreground">
                Peak: <strong className="text-foreground font-bold">{stats.codeforces.max}</strong>
              </span>
            )}
          </div>
        </button>

        {/* LeetCode Chip */}
        <button
          onClick={() => togglePlatform("leetcode")}
          className={cn(
            "p-3 rounded-xl border transition-all text-left flex flex-col justify-between space-y-1 relative overflow-hidden",
            activePlatforms.leetcode
              ? "bg-amber-500/10 border-amber-500/40 text-foreground"
              : "bg-muted/30 border-border/40 text-muted-foreground opacity-60 hover:opacity-100"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              LeetCode
            </span>
            {activePlatforms.leetcode && <Check className="size-3 text-amber-500" />}
          </div>
          <div className="flex items-baseline justify-between w-full pt-1">
            <span className="text-base font-extrabold text-foreground">
              {stats.leetcode.current !== null ? stats.leetcode.current : "N/A"}
            </span>
            {stats.leetcode.max !== null && (
              <span className="text-[10px] text-muted-foreground">
                Peak: <strong className="text-foreground font-bold">{stats.leetcode.max}</strong>
              </span>
            )}
          </div>
        </button>

        {/* CodeChef Chip */}
        <button
          onClick={() => togglePlatform("codechef")}
          className={cn(
            "p-3 rounded-xl border transition-all text-left flex flex-col justify-between space-y-1 relative overflow-hidden",
            activePlatforms.codechef
              ? "bg-purple-500/10 border-purple-500/40 text-foreground"
              : "bg-muted/30 border-border/40 text-muted-foreground opacity-60 hover:opacity-100"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-purple-500" />
              CodeChef
            </span>
            {activePlatforms.codechef && <Check className="size-3 text-purple-500" />}
          </div>
          <div className="flex items-baseline justify-between w-full pt-1">
            <span className="text-base font-extrabold text-foreground">
              {stats.codechef.current !== null ? stats.codechef.current : "N/A"}
            </span>
            {stats.codechef.max !== null && (
              <span className="text-[10px] text-muted-foreground">
                Peak: <strong className="text-foreground font-bold">{stats.codechef.max}</strong>
              </span>
            )}
          </div>
        </button>

        {/* HackerRank Chip */}
        <button
          onClick={() => togglePlatform("hackerrank")}
          className={cn(
            "p-3 rounded-xl border transition-all text-left flex flex-col justify-between space-y-1 relative overflow-hidden",
            activePlatforms.hackerrank
              ? "bg-emerald-500/10 border-emerald-500/40 text-foreground"
              : "bg-muted/30 border-border/40 text-muted-foreground opacity-60 hover:opacity-100"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              HackerRank
            </span>
            {activePlatforms.hackerrank && <Check className="size-3 text-emerald-500" />}
          </div>
          <div className="flex items-baseline justify-between w-full pt-1">
            <span className="text-base font-extrabold text-foreground">
              {stats.hackerrank.current !== null ? stats.hackerrank.current : "N/A"}
            </span>
            {stats.hackerrank.max !== null && (
              <span className="text-[10px] text-muted-foreground">
                Peak: <strong className="text-foreground font-bold">{stats.hackerrank.max}</strong>
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Main Chart Area */}
      {!hasData ? (
        <div className="h-[260px] w-full rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <Code2 className="size-8 text-muted-foreground/50" />
          <h4 className="text-sm font-semibold text-foreground">No Performance History Available</h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            Link your platform handles in profile settings to plot your rating & activity trajectory.
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
                  dot={{ r: 4, fill: "#3B82F6", strokeWidth: 1, stroke: "#ffffff" }}
                  activeDot={{ r: 7, stroke: "#3B82F6", strokeWidth: 2.5, fill: "#ffffff" }}
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
                  dot={{ r: 4, fill: "#F59E0B", strokeWidth: 1, stroke: "#ffffff" }}
                  activeDot={{ r: 7, stroke: "#F59E0B", strokeWidth: 2.5, fill: "#ffffff" }}
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
                  dot={{ r: 4, fill: "#A855F7", strokeWidth: 1, stroke: "#ffffff" }}
                  activeDot={{ r: 7, stroke: "#A855F7", strokeWidth: 2.5, fill: "#ffffff" }}
                  connectNulls
                />
              )}

              {activePlatforms.hackerrank && (
                <Line
                  type="monotone"
                  dataKey="hackerrank"
                  name="HackerRank"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10B981", strokeWidth: 1, stroke: "#ffffff" }}
                  activeDot={{ r: 7, stroke: "#10B981", strokeWidth: 2.5, fill: "#ffffff" }}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
