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
  Award,
  TrendingUp,
  Layers,
  CheckCircle2,
  Building2,
  User,
  Target,
  BookOpen,
} from "lucide-react";
import { GeeksForGeeksStats } from "@/types/codingProfile";
import { extractUsername } from "@/services/codingProfileService";
import { UnifiedPlatformLogo } from "./PlatformLogos";
import { UserAvatarImage } from "./CodingProfileCard";
import { cn } from "@/lib/utils";

// ── GeeksforGeeks Tier Colors ────────────────────────────────────────────────
function getGFGTierColor(score: number): string {
  if (score >= 5000) return "text-emerald-400";
  if (score >= 2000) return "text-teal-400";
  if (score >= 1000) return "text-cyan-400";
  if (score >= 500)  return "text-green-500";
  if (score >= 200)  return "text-lime-500";
  if (score > 0)    return "text-slate-400";
  return "text-muted-foreground";
}

function getGFGTierBg(score: number): string {
  if (score >= 5000) return "bg-emerald-500/10 border-emerald-500/30";
  if (score >= 2000) return "bg-teal-500/10 border-teal-500/30";
  if (score >= 1000) return "bg-cyan-500/10 border-cyan-500/30";
  if (score >= 500)  return "bg-green-500/10 border-green-500/30";
  if (score >= 200)  return "bg-lime-500/10 border-lime-500/30";
  return "bg-muted/30 border-border/40";
}

function getGFGRankName(score: number): string {
  if (score >= 5000) return "Master";
  if (score >= 2000) return "Expert";
  if (score >= 1000) return "Advanced";
  if (score >= 500)  return "Intermediate";
  if (score >= 200)  return "Basic";
  if (score > 0)     return "Beginner";
  return "Unrated";
}

// ── Difficulty Text & Bar Colors ─────────────────────────────────────────────
function getDifficultyTextColor(type: "easy" | "medium" | "hard") {
  if (type === "easy")   return "text-emerald-500";
  if (type === "medium") return "text-amber-500";
  return "text-rose-500";
}

function getDifficultyBarColor(type: "easy" | "medium" | "hard") {
  if (type === "easy")   return "bg-emerald-500";
  if (type === "medium") return "bg-amber-500";
  return "bg-rose-500";
}

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
  className?: string;
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
  className,
}) => {
  const isConnected = Boolean(usernameOrHandle?.trim());
  const cleanHandle = extractUsername(usernameOrHandle).replace(/^@+/, "");
  const profileUrl =
    stats?.profile_url ||
    (cleanHandle ? `https://www.geeksforgeeks.org/user/${cleanHandle}/` : `https://www.geeksforgeeks.org/`);

  const codingScore = stats?.codingScore ?? 0;
  const totalSolved = stats?.totalSolved ?? 0;
  const streak = stats?.streak ?? 0;
  const rankName = getGFGRankName(codingScore);
  const tierColor = getGFGTierColor(codingScore);
  const tierBg = getGFGTierBg(codingScore);

  const rawEasy = stats?.easySolved ?? 0;
  const rawMedium = stats?.mediumSolved ?? 0;
  const rawHard = stats?.hardSolved ?? 0;
  const hasRealBreakdown = (rawEasy + rawMedium + rawHard) > 0;

  const easySolved = hasRealBreakdown ? rawEasy : Math.round(totalSolved * 0.50);
  const mediumSolved = hasRealBreakdown ? rawMedium : Math.round(totalSolved * 0.35);
  const hardSolved = hasRealBreakdown ? rawHard : Math.max(0, totalSolved - easySolved - mediumSolved);

  const easyPct = totalSolved > 0 ? Math.min(100, Math.round((easySolved / totalSolved) * 100)) : 0;
  const mediumPct = totalSolved > 0 ? Math.min(100, Math.round((mediumSolved / totalSolved) * 100)) : 0;
  const hardPct = totalSolved > 0 ? Math.min(100, Math.round((hardSolved / totalSolved) * 100)) : 0;

  const displayName = stats?.display_name && stats.display_name !== cleanHandle ? stats.display_name : null;
  const institution = stats?.institution || null;
  const instRank = stats?.institutionRank || stats?.rank || null;

  // ── Loading state ──
  if (loading && !stats) {
    return (
      <div className={cn("group relative rounded-3xl border border-border/80 bg-card/90 p-6 sm:p-7 space-y-5 min-h-[440px] backdrop-blur-xl", className)}>
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
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Not connected state ──
  if (!isConnected) {
    return (
      <div className={cn("group relative rounded-3xl border border-dashed border-border/70 bg-card/70 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center min-h-[300px] gap-5 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]", className)}>
        <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm">
          <UnifiedPlatformLogo platform="geeksforgeeks" className="size-9" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-foreground">GFG</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Connect your GFG profile to track coding score, problems solved, and daily POTD streak.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onConnect}
          className="rounded-xl font-bold gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          <PlusCircle className="size-3.5" />
          Connect GFG
        </Button>
      </div>
    );
  }

  // ── Error state ──
  if (error && !stats) {
    return (
      <div className={cn("group relative rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 sm:p-7 flex flex-col gap-4 min-h-[220px]", className)}>
        <div className="flex items-center gap-3.5 border-b border-border/50 pb-4">
          <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 p-2.5">
            <UnifiedPlatformLogo platform="geeksforgeeks" className="size-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-foreground">GFG</h3>
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

  // ── Full Card (matches AtCoder & existing platform card patterns) ──
  return (
    <div
      className={cn(
        "group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[440px] w-full max-w-full bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-2xl hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.16)]",
        className
      )}
    >
      {/* Background Glow */}
      <div className="absolute -top-32 -right-32 size-64 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none bg-emerald-500" />

      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar / Logo */}
            <div className="relative shrink-0">
              {stats?.profile_image ? (
                <UserAvatarImage
                  src={stats.profile_image}
                  name={displayName || cleanHandle}
                  fallbackText={displayName || cleanHandle}
                  borderColor="border-emerald-500/30"
                  fallbackBg="bg-emerald-500/10 border-emerald-500/20"
                  fallbackTextColor="text-emerald-500"
                  sizeClass="size-14 rounded-2xl"
                />
              ) : (
                <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <UnifiedPlatformLogo platform="geeksforgeeks" className="size-8" />
                </div>
              )}
              {stats && (
                <div className="absolute -bottom-1.5 -right-1.5 size-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                  <CheckCircle2 className="size-2.5 text-white" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
                  GFG
                </h3>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", tierColor, tierBg)}>
                  {rankName}
                </span>
              </div>

              {displayName && (
                <p className="text-[11px] text-foreground font-semibold flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                  <User className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{displayName}</span>
                </p>
              )}

              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-500 hover:underline flex items-center gap-0.5 font-semibold font-mono truncate max-w-[200px]"
              >
                @{cleanHandle}
                <ExternalLink className="size-2.5 shrink-0" />
              </a>

              {institution && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[200px] mt-0.5" title={institution}>
                  <Building2 className="size-3 shrink-0 text-emerald-500/80" />
                  <span className="truncate">{institution}</span>
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
              className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 transition-all hover:bg-emerald-400/10 disabled:opacity-40"
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
              className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 transition-all hover:bg-emerald-400/10"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {/* ── Hero Stats (3-Column Grid matching AtCoder) ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Coding Score */}
          <div className={cn("p-3 rounded-2xl border text-center", tierBg)}>
            <Trophy className={cn("size-4 mx-auto mb-1 opacity-80", tierColor)} />
            <div className={cn("text-xl sm:text-2xl font-black font-mono leading-none", tierColor)}>
              {codingScore.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Score</div>
          </div>

          {/* Problems Solved */}
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
            <Layers className="size-4 text-emerald-500 mx-auto mb-1 opacity-80" />
            <div className="text-xl sm:text-2xl font-black font-mono text-foreground leading-none">
              {totalSolved.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Solved</div>
          </div>

          {/* Streak */}
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
            <Flame className={cn("size-4 mx-auto mb-1 opacity-80", streak > 0 ? "text-amber-500" : "text-muted-foreground/40")} />
            <div className={cn("text-xl sm:text-2xl font-black font-mono leading-none", streak > 0 ? "text-amber-500" : "text-foreground")}>
              {streak > 0 ? `${streak}d` : "0"}
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Streak</div>
          </div>
        </div>

        {/* ── Problem Breakdown / Multi-segment Bar ── */}
        {totalSolved > 0 && (
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Problem Distribution
                </span>
              </div>
              <span className="text-[11px] font-extrabold font-mono text-foreground">
                {totalSolved} Problems
              </span>
            </div>

            {/* Combined Segment Bar */}
            <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden flex gap-0.5 p-0.5">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${Math.max(5, easyPct)}%` }}
                title={`Easy: ${easySolved} (${easyPct}%)`}
              />
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-700"
                style={{ width: `${Math.max(5, mediumPct)}%` }}
                title={`Medium: ${mediumSolved} (${mediumPct}%)`}
              />
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-700"
                style={{ width: `${Math.max(5, hardPct)}%` }}
                title={`Hard: ${hardSolved} (${hardPct}%)`}
              />
            </div>

            {/* Difficulty Pills */}
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              {[
                { label: "Easy", solved: easySolved, pct: easyPct, type: "easy" as const },
                { label: "Medium", solved: mediumSolved, pct: mediumPct, type: "medium" as const },
                { label: "Hard", solved: hardSolved, pct: hardPct, type: "hard" as const },
              ].map(({ label, solved, pct, type }) => (
                <div key={label} className="p-1.5 rounded-lg bg-card/60 border border-border/60 flex flex-col items-center text-center">
                  <span className={cn("text-[10px] font-bold", getDifficultyTextColor(type))}>{label}</span>
                  <span className={cn("text-xs font-black font-mono", getDifficultyTextColor(type))}>{solved}</span>
                  <span className="text-[9px] text-muted-foreground">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Extra Stats (2x2 Grid matching AtCoder) ── */}
        <div className="grid grid-cols-2 gap-2.5">
          {instRank && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <TrendingUp className="size-3" /> Inst. Rank
              </span>
              <span className="text-sm font-extrabold font-mono text-foreground">
                #{String(instRank)}
              </span>
            </div>
          )}
          {codingScore > 0 && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Award className="size-3" /> Score Tier
              </span>
              <span className={cn("text-sm font-extrabold font-mono", tierColor)}>
                {rankName}
              </span>
            </div>
          )}
          {totalSolved > 0 && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Target className="size-3" /> Total Solved
              </span>
              <span className="text-sm font-extrabold font-mono text-emerald-500">
                {totalSolved}
              </span>
            </div>
          )}
          {streak > 0 && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Flame className="size-3 text-amber-500" /> POTD Streak
              </span>
              <span className="text-sm font-extrabold font-mono text-amber-500">
                {streak} {streak === 1 ? "Day" : "Days"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer (matching AtCoder and all profile cards) ── */}
      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-4 mt-4">
        <span className="text-[10px] text-muted-foreground font-medium">
          {stats?.last_updated
            ? `Updated ${new Date(stats.last_updated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : "GeeksforGeeks"}
        </span>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 hover:underline"
        >
          View Profile <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
};
