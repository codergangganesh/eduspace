import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Edit3,
  Pin,
  Trophy,
  Target,
  Zap,
  Award,
  TrendingUp,
  Star,
  CheckCircle2,
  Globe,
  BarChart2,
} from "lucide-react";
import {
  AtCoderStats,
  AtCoderContestHistory,
} from "@/types/codingProfile";
import { extractUsername } from "@/services/codingProfileService";
import { RatingPoint } from "@/services/ratingHistoryService";
import { UnifiedPlatformLogo } from "./PlatformLogos";
import { cn } from "@/lib/utils";

// ── AtCoder Tier Colors ──────────────────────────────────────────────────────
function getAtCoderTierColor(rating: number): string {
  if (rating >= 2800) return "text-red-500";
  if (rating >= 2400) return "text-orange-500";
  if (rating >= 2000) return "text-yellow-400";
  if (rating >= 1600) return "text-cyan-400";
  if (rating >= 1200) return "text-blue-400";
  if (rating >= 800)  return "text-green-500";
  if (rating >= 400)  return "text-amber-700";
  if (rating > 0)     return "text-slate-400";
  return "text-muted-foreground";
}

function getAtCoderTierBg(rating: number): string {
  if (rating >= 2800) return "bg-red-500/10 border-red-500/30";
  if (rating >= 2400) return "bg-orange-500/10 border-orange-500/30";
  if (rating >= 2000) return "bg-yellow-400/10 border-yellow-400/30";
  if (rating >= 1600) return "bg-cyan-400/10 border-cyan-400/30";
  if (rating >= 1200) return "bg-blue-400/10 border-blue-400/30";
  if (rating >= 800)  return "bg-green-500/10 border-green-500/30";
  if (rating >= 400)  return "bg-amber-700/10 border-amber-700/30";
  return "bg-muted/30 border-border/40";
}

function getAtCoderRankName(rating: number): string {
  if (rating >= 2800) return "Red";
  if (rating >= 2400) return "Orange";
  if (rating >= 2000) return "Yellow";
  if (rating >= 1600) return "Blue";
  if (rating >= 1200) return "Cyan";
  if (rating >= 800)  return "Green";
  if (rating >= 400)  return "Brown";
  if (rating > 0)     return "Gray";
  return "Unrated";
}

// ── Props ────────────────────────────────────────────────────────────────────
interface AtCoderProfileCardProps {
  stats?: AtCoderStats | null;
  error?: string | null;
  loading?: boolean;
  usernameOrHandle: string;
  onConnect?: () => void;
  onRefresh?: () => void;
  onEditHandle?: () => void;
  isRefreshing?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

// ── Mini sparkline for recent contests ───────────────────────────────────────
function MiniSparkline({ pts }: { pts: AtCoderContestHistory[] }) {
  if (!pts || pts.length < 2) return null;
  const ratings = pts.map((p) => p.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const range = max - min || 1;
  const W = 120;
  const H = 32;
  const points = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * W;
    const y = H - ((p.rating - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lastRating = pts[pts.length - 1].rating;
  const firstRating = pts[0].rating;
  const isUp = lastRating >= firstRating;

  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={isUp ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={parseFloat(points[points.length - 1].split(",")[0])}
        cy={parseFloat(points[points.length - 1].split(",")[1])}
        r="2.5"
        fill={isUp ? "#22c55e" : "#ef4444"}
      />
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export const AtCoderProfileCard: React.FC<AtCoderProfileCardProps> = ({
  stats,
  error,
  loading = false,
  usernameOrHandle,
  onConnect,
  onRefresh,
  onEditHandle,
  isRefreshing,
  isPinned,
  onTogglePin,
}) => {
  const [avatarError, setAvatarError] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "heuristic">("overview");

  const isConnected = Boolean(usernameOrHandle?.trim());
  const cleanHandle = extractUsername(usernameOrHandle).replace(/^@+/, "");
  const profileUrl =
    stats?.profile_url ||
    (cleanHandle ? `https://atcoder.jp/users/${cleanHandle}` : `https://atcoder.jp/`);

  const rating = stats?.rating ?? 0;
  const maxRating = stats?.maxRating ?? rating;
  const totalSolved = stats?.totalSolved ?? 0;
  const competitionsCount = stats?.competitionsCount ?? stats?.totalCompetitions ?? 0;
  const rankName = getAtCoderRankName(rating);
  const tierColor = getAtCoderTierColor(rating);
  const tierBg = getAtCoderTierBg(rating);

  const recentContests: AtCoderContestHistory[] = (
    stats?.contestHistory || stats?.recentContests || []
  ).slice(-12);

  const heuristicRating = stats?.heuristicRating ?? 0;
  const hasHeuristic = heuristicRating > 0;

  // ── Not connected ──
  if (!isConnected) {
    return (
      <div className="group relative rounded-3xl border border-dashed border-border/70 bg-card/70 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center min-h-[300px] gap-5 transition-all duration-300 hover:border-sky-500/50 hover:shadow-[0_0_30px_rgba(14,165,233,0.12)]">
        <div className="size-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shadow-sm">
          <UnifiedPlatformLogo platform="atcoder" className="size-9" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-foreground">AtCoder</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Connect your AtCoder profile to track ratings, contest history, and algorithm rankings.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onConnect}
          className="rounded-xl font-bold gap-1.5 shadow-sm"
        >
          <PlusCircle className="size-3.5" />
          Connect AtCoder
        </Button>
      </div>
    );
  }

  // ── Error state ──
  if (error && !stats) {
    return (
      <div className="group relative rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 sm:p-7 flex flex-col gap-4 min-h-[220px]">
        <div className="flex items-center gap-3.5 border-b border-border/50 pb-4">
          <div className="size-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 p-2.5">
            <UnifiedPlatformLogo platform="atcoder" className="size-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-foreground">AtCoder</h3>
            <p className="text-[11px] text-muted-foreground">{cleanHandle}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <AlertCircle className="size-8 text-rose-500/70" />
          <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1.5 rounded-xl text-xs">
              <RefreshCw className="size-3" /> Retry
            </Button>
            <Button variant="outline" size="sm" onClick={onEditHandle} className="gap-1.5 rounded-xl text-xs">
              <Edit3 className="size-3" /> Edit Username
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Full card ──
  return (
    <div className="group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[440px] w-full max-w-full bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-2xl hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-[0_0_30px_rgba(14,165,233,0.16)]">
      {/* Background Glow */}
      <div className="absolute -top-32 -right-32 size-64 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none bg-sky-400" />

      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar / Logo */}
            <div className="relative shrink-0">
              {stats?.avatar && !avatarError ? (
                <img
                  src={stats.avatar}
                  alt={cleanHandle}
                  className="size-14 rounded-2xl object-cover border border-border/60 shadow-sm"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="size-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <UnifiedPlatformLogo platform="atcoder" className="size-8" />
                </div>
              )}
              {stats && (
                <div className="absolute -bottom-1.5 -right-1.5 size-5 rounded-full bg-sky-500 border-2 border-card flex items-center justify-center">
                  <CheckCircle2 className="size-2.5 text-white" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
                  AtCoder
                </h3>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", tierColor, tierBg)}>
                  {rankName}
                </span>
                {stats?.country && (
                  <span className="text-base leading-none" title={stats.country}>
                    {stats.countryFlag || <Globe className="size-3.5 text-muted-foreground" />}
                  </span>
                )}
              </div>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-500 hover:underline flex items-center gap-0.5 font-semibold truncate max-w-[200px]"
              >
                @{cleanHandle}
                <ExternalLink className="size-2.5 shrink-0" />
              </a>
              {stats?.affiliation && (
                <p className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                  {stats.affiliation}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onTogglePin && (
              <button
                onClick={onTogglePin}
                title={isPinned ? "Unpin" : "Pin to Top"}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  isPinned ? "text-amber-400 bg-amber-400/10" : "text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10"
                )}
              >
                <Pin className="size-3.5" />
              </button>
            )}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 transition-all hover:bg-sky-400/10 disabled:opacity-40"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            </button>
            <button
              onClick={onEditHandle}
              title="Edit"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all hover:bg-muted/60"
            >
              <Edit3 className="size-3.5" />
            </button>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 transition-all hover:bg-sky-400/10"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {/* ── Tab Bar (only if heuristic stats exist) ── */}
        {hasHeuristic && (
          <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border/40">
            {(["overview", "heuristic"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-1 text-[11px] font-bold rounded-lg transition-all capitalize",
                  activeTab === tab
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "overview" ? "Algorithm" : "Heuristic"}
              </button>
            ))}
          </div>
        )}

        {/* ── Hero Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Rating */}
          <div className={cn("p-3 rounded-2xl border text-center", tierBg)}>
            <BarChart2 className={cn("size-4 mx-auto mb-1 opacity-80", tierColor)} />
            <div className={cn("text-xl sm:text-2xl font-black font-mono leading-none", tierColor)}>
              {activeTab === "heuristic" && hasHeuristic ? heuristicRating : rating}
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Rating</div>
          </div>

          {/* Max Rating */}
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
            <Star className="size-4 text-yellow-500 mx-auto mb-1 opacity-80" />
            <div className="text-xl sm:text-2xl font-black font-mono text-foreground leading-none">
              {activeTab === "heuristic" && hasHeuristic ? (stats?.heuristicMaxRating ?? 0) : maxRating}
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Peak</div>
          </div>

          {/* Contests */}
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
            <Trophy className="size-4 text-amber-500 mx-auto mb-1 opacity-80" />
            <div className="text-xl sm:text-2xl font-black font-mono text-foreground leading-none">
              {activeTab === "heuristic" && hasHeuristic
                ? (stats?.heuristicCompetitionsCount ?? 0)
                : competitionsCount}
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Contests</div>
          </div>
        </div>

        {/* ── Sparkline for Algorithm tab ── */}
        {activeTab === "overview" && recentContests.length > 1 && (
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                Rating Trend
              </p>
              <p className="text-xs font-extrabold text-foreground">
                Last {recentContests.length} contests
              </p>
            </div>
            <MiniSparkline pts={recentContests} />
          </div>
        )}

        {/* ── Extra Stats ── */}
        <div className="grid grid-cols-2 gap-2.5">
          {totalSolved > 0 && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Target className="size-3" /> Solved
              </span>
              <span className="text-sm font-extrabold font-mono text-foreground">{totalSolved}</span>
            </div>
          )}
          {(stats?.highestPerformance ?? 0) > 0 && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Zap className="size-3" /> Best Perf.
              </span>
              <span className="text-sm font-extrabold font-mono text-foreground">{stats?.highestPerformance}</span>
            </div>
          )}
          {(stats?.bestRank ?? 0) > 0 && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Award className="size-3" /> Best Rank
              </span>
              <span className="text-sm font-extrabold font-mono text-foreground">#{stats?.bestRank}</span>
            </div>
          )}
          {(stats?.globalRank ?? 0) > 0 && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <TrendingUp className="size-3" /> Global Rank
              </span>
              <span className="text-sm font-extrabold font-mono text-foreground">#{stats?.globalRank}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-4 mt-4">
        <span className="text-[10px] text-muted-foreground font-medium">
          {stats?.last_updated
            ? `Updated ${new Date(stats.last_updated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : "AtCoder"}
        </span>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-bold text-sky-500 hover:underline"
        >
          View Profile <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
};
