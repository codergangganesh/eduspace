import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Edit3,
  Pin,
  Flame,
  Trophy,
  BookOpen,
  Award,
  TrendingUp,
  Layers,
  CheckCircle2,
  Building2,
  User,
} from "lucide-react";
import { GeeksForGeeksStats } from "@/types/codingProfile";
import { extractUsername } from "@/services/codingProfileService";
import { UnifiedPlatformLogo } from "./PlatformLogos";
import { cn } from "@/lib/utils";

interface GeeksForGeeksProfileCardProps {
  stats?: GeeksForGeeksStats | null;
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

function getDifficultyTextColor(type: "easy" | "medium" | "hard") {
  if (type === "easy")   return "text-emerald-500";
  if (type === "medium") return "text-amber-500";
  return "text-red-500";
}

function getDifficultyBarColor(type: "easy" | "medium" | "hard") {
  if (type === "easy")   return "bg-emerald-500";
  if (type === "medium") return "bg-amber-500";
  return "bg-red-500";
}

function getGFGRankLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 10000) return { label: "⭐ Expert",     color: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/30" };
  if (score >= 5000)  return { label: "Senior",        color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/30" };
  if (score >= 2000)  return { label: "Advanced",      color: "text-cyan-400",    bg: "bg-cyan-400/10 border-cyan-400/30" };
  if (score >= 1000)  return { label: "Intermediate",  color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/30" };
  if (score >= 400)   return { label: "Basic",         color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" };
  return               { label: "Beginner",           color: "text-slate-400",   bg: "bg-slate-400/10 border-slate-400/30" };
}

export const GeeksForGeeksProfileCard: React.FC<GeeksForGeeksProfileCardProps> = ({
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

  const isConnected = Boolean(usernameOrHandle?.trim());
  const cleanHandle = extractUsername(usernameOrHandle).replace(/^@+/, "");
  const profileUrl = stats?.profile_url
    || (cleanHandle ? `https://www.geeksforgeeks.org/user/${cleanHandle}/` : `https://www.geeksforgeeks.org/`);

  const totalSolved  = stats?.totalSolved  ?? 0;
  const codingScore  = stats?.codingScore  ?? 0;
  const streak       = stats?.streak       ?? 0;
  const rankLabel    = getGFGRankLabel(codingScore);
  const displayName  = stats?.display_name && stats.display_name !== cleanHandle ? stats.display_name : null;

  // Difficulty: use actual values if available, otherwise estimate from total
  const rawEasy   = stats?.easySolved   ?? 0;
  const rawMedium = stats?.mediumSolved ?? 0;
  const rawHard   = stats?.hardSolved   ?? 0;
  const hasRealBreakdown = (rawEasy + rawMedium + rawHard) > 0;

  const easySolved   = hasRealBreakdown ? rawEasy   : Math.round(totalSolved * 0.50);
  const mediumSolved = hasRealBreakdown ? rawMedium : Math.round(totalSolved * 0.35);
  const hardSolved   = hasRealBreakdown ? rawHard   : (totalSolved - Math.round(totalSolved * 0.50) - Math.round(totalSolved * 0.35));
  const isEstimated  = !hasRealBreakdown && totalSolved > 0;

  const easyPct   = totalSolved > 0 ? Math.min(100, Math.round((easySolved   / totalSolved) * 100)) : 0;
  const mediumPct = totalSolved > 0 ? Math.min(100, Math.round((mediumSolved / totalSolved) * 100)) : 0;
  const hardPct   = totalSolved > 0 ? Math.min(100, Math.round((hardSolved   / totalSolved) * 100)) : 0;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading && !stats) {
    return (
      <div className="group relative rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-7 space-y-5 min-h-[420px] backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="group relative rounded-3xl border border-dashed border-border/70 bg-card/70 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center min-h-[300px] gap-5 transition-all duration-300 hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(47,141,70,0.15)]">
        <div className="size-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-sm">
          <UnifiedPlatformLogo platform="geeksforgeeks" className="size-9" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-foreground">GeeksforGeeks</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Connect your GFG profile to track coding score, problems solved, and daily streak.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onConnect}
          className="rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold gap-1.5 shadow-sm"
        >
          <PlusCircle className="size-3.5" />
          Connect GeeksforGeeks
        </Button>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && !stats) {
    return (
      <div className="group relative rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 sm:p-7 flex flex-col gap-4 min-h-[220px]">
        <div className="flex items-center gap-3.5 border-b border-border/50 pb-4">
          <div className="size-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 p-2.5">
            <UnifiedPlatformLogo platform="geeksforgeeks" className="size-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-foreground">GeeksforGeeks</h3>
            <p className="text-[11px] text-muted-foreground font-mono">@{cleanHandle}</p>
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

  // ── Full card ─────────────────────────────────────────────────────────────
  return (
    <div className="group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[440px] w-full max-w-full bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-2xl hover:-translate-y-1 hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(47,141,70,0.18)]">
      {/* Background glow */}
      <div className="absolute -top-32 -right-32 size-64 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-green-500" />
      <div className="absolute -bottom-24 -left-24 size-52 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none bg-emerald-600" />

      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar / Logo */}
            <div className="relative shrink-0">
              {stats?.profile_image && !avatarError ? (
                <img
                  src={stats.profile_image}
                  alt={displayName || cleanHandle}
                  className="size-14 rounded-2xl object-cover border border-border/60 shadow-sm"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="size-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <UnifiedPlatformLogo platform="geeksforgeeks" className="size-8" />
                </div>
              )}
              {/* Connected badge */}
              <div className="absolute -bottom-1.5 -right-1.5 size-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                <CheckCircle2 className="size-2.5 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
                  GeeksforGeeks
                </h3>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", rankLabel.color, rankLabel.bg)}>
                  {rankLabel.label}
                </span>
              </div>

              {/* Display real name if different from handle */}
              {displayName && (
                <p className="text-[11px] text-foreground/80 font-semibold flex items-center gap-1 mt-0.5">
                  <User className="size-3 shrink-0" />
                  {displayName}
                </p>
              )}

              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-green-500 hover:underline flex items-center gap-0.5 font-semibold font-mono truncate max-w-[200px]"
              >
                @{cleanHandle}
                <ExternalLink className="size-2.5 shrink-0" />
              </a>

              {stats?.institution && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                  <Building2 className="size-3 shrink-0" />
                  {stats.institution}
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
              title="Refresh Stats"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-green-400 transition-all hover:bg-green-400/10 disabled:opacity-40"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            </button>
            <button
              onClick={onEditHandle}
              title="Edit Username"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-all hover:bg-muted/60"
            >
              <Edit3 className="size-3.5" />
            </button>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-green-400 transition-all hover:bg-green-400/10"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {/* ── Hero Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Problems Solved */}
          <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
            <Layers className="size-4 text-green-500 mx-auto mb-1 opacity-80" />
            <div className="text-xl sm:text-2xl font-black font-mono text-foreground leading-none">{totalSolved}</div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Solved</div>
          </div>
          {/* GFG Score */}
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-center">
            <Trophy className="size-4 text-primary mx-auto mb-1 opacity-80" />
            <div className="text-xl sm:text-2xl font-black font-mono text-primary leading-none">{codingScore.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Score</div>
          </div>
          {/* Streak */}
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-center">
            <Flame className={cn("size-4 mx-auto mb-1", streak > 0 ? "text-orange-500" : "text-muted-foreground/40")} />
            <div className={cn("text-xl sm:text-2xl font-black font-mono leading-none", streak > 0 ? "text-orange-500" : "text-foreground")}>
              {streak}
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Streak</div>
          </div>
        </div>

        {/* ── Difficulty Breakdown ── */}
        {totalSolved > 0 && (
          <div className="space-y-2.5 p-4 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-muted-foreground" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Problem Breakdown</span>
              </div>
              {isEstimated && (
                <span className="text-[9px] text-muted-foreground/60 font-medium italic">~estimated</span>
              )}
            </div>

            {[
              { label: "Easy",   solved: easySolved,   pct: easyPct,   type: "easy"   as const },
              { label: "Medium", solved: mediumSolved, pct: mediumPct, type: "medium" as const },
              { label: "Hard",   solved: hardSolved,   pct: hardPct,   type: "hard"   as const },
            ].map(({ label, solved, pct, type }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={cn("text-[11px] font-bold", getDifficultyTextColor(type))}>{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{pct}%</span>
                    <span className={cn("text-xs font-extrabold font-mono min-w-[2ch] text-right", getDifficultyTextColor(type))}>
                      {solved}
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted/60">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", getDifficultyBarColor(type))}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Rank & Score tiles ── */}
        {(stats?.rank || stats?.institutionRank || codingScore > 0) && (
          <div className="grid grid-cols-2 gap-2.5">
            {(stats?.rank || stats?.institutionRank) && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="size-3" /> Inst. Rank
                </span>
                <span className="text-sm font-extrabold font-mono text-foreground">
                  #{String(stats?.rank || stats?.institutionRank)}
                </span>
              </div>
            )}
            {codingScore > 0 && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Award className="size-3" /> GFG Score
                </span>
                <span className="text-sm font-extrabold font-mono text-green-500">
                  {codingScore.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-4 mt-4">
        <span className="text-[10px] text-muted-foreground font-medium">
          {stats?.last_updated
            ? `Updated ${new Date(stats.last_updated).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
            : "GeeksforGeeks"}
        </span>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-bold text-green-500 hover:underline"
        >
          View Profile <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
};
