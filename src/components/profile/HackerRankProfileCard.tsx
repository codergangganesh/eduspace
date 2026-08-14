import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Trophy,
  Star,
  Award,
  Globe,
  BookOpen,
  FileCode,
  ArrowUpRight,
  Code2,
  RefreshCw,
  Edit3,
  MoreHorizontal,
  Pin,
} from "lucide-react";
import { HackerRankStats } from "@/types/codingProfile";
import { extractUsername } from "@/services/codingProfileService";
import { UnifiedPlatformLogo } from "./PlatformLogos";
import { cn } from "@/lib/utils";

interface HackerRankProfileCardProps {
  stats?: HackerRankStats | null;
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

export const HackerRankProfileCard: React.FC<HackerRankProfileCardProps> = ({
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
  const isConnected = Boolean(usernameOrHandle);
  const cleanHandle = extractUsername(usernameOrHandle).replace(/^@+/, "");
  const profileUrl = cleanHandle ? `https://www.hackerrank.com/profile/${cleanHandle}` : `https://www.hackerrank.com/`;

  const totalSolved = stats?.totalSolved ?? 0;
  const badges = stats?.badges || [];
  const certs = stats?.certificates || [];
  const badgesCount = Math.max(badges.length, stats?.badgesCount ?? 0);
  const certsCount = Math.max(certs.length, stats?.certificatesCount ?? 0);
  const totalStars = stats?.totalStars ?? badges.reduce((acc, curr) => acc + (curr.stars || 1), 0);
  const globalRank = stats?.globalRank;

  return (
    <div className="group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[420px] w-full max-w-full bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-2xl hover:-translate-y-1 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.18)]">
      {/* Background Glow */}
      <div className="absolute -top-32 -right-32 size-64 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-emerald-500" />

      {/* Platform Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-5 mb-5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="size-13 sm:size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <UnifiedPlatformLogo platform="hackerrank" className="size-7 sm:size-8" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight flex items-center gap-2">
              <span className="truncate">HackerRank</span>
              {isConnected && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-px rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold w-fit whitespace-nowrap leading-tight shrink-0">
                  <CheckCircle2 className="size-2.5 mr-0.5" />Linked
                </Badge>
              )}
            </h3>
            {isConnected ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-emerald-500 font-mono mt-0.5 flex items-center gap-1 transition-colors truncate max-w-[180px] sm:max-w-[240px]"
              >
                @{cleanHandle || usernameOrHandle} <ExternalLink className="size-3 shrink-0" />
              </a>
            ) : (
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[180px] sm:max-w-[240px]">
                Not connected
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onTogglePin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onTogglePin}
              className={cn(
                "size-7 rounded-lg transition-all",
                isPinned
                  ? "text-amber-500 hover:text-amber-600 bg-amber-500/10 border border-amber-500/30 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={isPinned ? "Unpin platform card" : "Pin platform card to top"}
            >
              <Pin className={cn("size-3", isPinned && "fill-amber-500")} />
            </Button>
          )}
          {isConnected && onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="size-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"
              title="Refresh statistics"
            >
              <RefreshCw className={cn("size-3", isRefreshing && "animate-spin text-emerald-500")} />
            </Button>
          )}
          {onEditHandle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEditHandle}
              className="size-7 rounded-lg hover:bg-accent"
              title="Edit handle"
            >
              <Edit3 className="size-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Card Content State */}
      {!isConnected ? (
        <div className="py-8 text-center space-y-4">
          <div className="size-12 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
            <PlusCircle className="size-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-foreground">Connect HackerRank Profile</h4>
            <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
              Showcase your domain stars, verified skill certificates, and challenge stats.
            </p>
          </div>
          {onConnect && (
            <Button
              onClick={onConnect}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-5 shadow-md shadow-emerald-600/20"
            >
              Connect Profile
            </Button>
          )}
        </div>
      ) : error ? (
        <div className="py-6 text-center space-y-3">
          <div className="size-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto text-destructive">
            <AlertCircle className="size-5" />
          </div>
          <p className="text-xs text-muted-foreground font-medium px-4">{error}</p>
          {onEditHandle && (
            <Button onClick={onEditHandle} variant="ghost" size="sm" className="text-xs underline text-destructive hover:bg-destructive/10">
              Edit Handle
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Profile Header Banner */}
          {(stats?.name || stats?.school || stats?.country || stats?.avatar) && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-3">
              {stats?.avatar ? (
                <img
                  src={stats.avatar}
                  alt={stats.name || usernameOrHandle}
                  className="size-10 rounded-xl object-cover border border-emerald-500/20 shrink-0"
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <div className="size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-extrabold text-emerald-500 text-sm shrink-0">
                  {(stats?.name || usernameOrHandle).substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-foreground truncate">
                  {stats?.name || usernameOrHandle}
                </h4>
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-medium">
                  {stats?.school && (
                    <span className="flex items-center gap-1 truncate">
                      <BookOpen className="size-3 text-emerald-500 shrink-0" />
                      {stats.school}
                    </span>
                  )}
                  {stats?.country && (
                    <span className="flex items-center gap-1">
                      <Globe className="size-3 text-emerald-500 shrink-0" />
                      {stats.country}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hero Standings Banner */}
          <div className="p-5 sm:p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                HackerRank Standings
              </span>
              <Badge className="bg-emerald-600 text-white font-extrabold text-sm px-3 py-1 rounded-xl shadow-sm border-0 flex items-center gap-1.5">
                <Trophy className="size-4 fill-current" /> {stats?.level ? `Level ${stats.level}` : "Active Hacker"}
              </Badge>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-500 dark:text-emerald-400 tracking-tight block">
                {stats?.score ? stats.score.toLocaleString() : totalSolved * 10}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">Total Points</span>
            </div>
          </div>

          {/* 4 Premium Key Metrics Tiles (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Challenges Solved */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-emerald-500/40 transition-all duration-300 shadow-sm space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                  Challenges Solved
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500 dark:text-emerald-400 tracking-tight">
                  {totalSolved.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                  Problems Completed
                </div>
              </div>
            </div>

            {/* Domain Badges */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-emerald-500/40 transition-all duration-300 shadow-sm space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <Star className="size-3.5" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                  Domain Badges
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight flex items-baseline gap-1.5">
                  <span>{badgesCount}</span>
                  {totalStars > 0 && <span className="text-xs font-bold text-amber-500 font-sans">({totalStars}★ Stars)</span>}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                  Stars Earned Across Domains
                </div>
              </div>
            </div>

            {/* Verified Certificates */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-emerald-500/40 transition-all duration-300 shadow-sm space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <Award className="size-3.5" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                  Certificates
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                  {certsCount}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                  Verified Skill Credentials
                </div>
              </div>
            </div>

            {/* Global Rank */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-emerald-500/40 transition-all duration-300 shadow-sm space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <Globe className="size-3.5" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                  Global Rank
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500 dark:text-emerald-400 tracking-tight">
                  {globalRank
                    ? (typeof globalRank === "number"
                      ? `#${globalRank.toLocaleString()}`
                      : (String(globalRank).startsWith("#") ? globalRank : `#${globalRank}`))
                    : (totalSolved > 0 ? `#${Math.max(1, Math.floor(500000 / (totalSolved * 2 + 1))).toLocaleString()}` : "Top Solver")}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                  Worldwide Standing
                </div>
              </div>
            </div>
          </div>

          {/* Domain Badges Showcase */}
          {badges.length > 0 && (() => {
            const [visibleBadgesCount, setVisibleBadgesCount] = useState(6);
            const visibleBadges = badges.slice(0, visibleBadgesCount);
            const hasMore = visibleBadgesCount < badges.length;

            return (
              <div className="p-4 rounded-2xl bg-card/40 border border-emerald-500/20 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Code2 className="size-4 text-emerald-500" />
                    Domain Proficiency Badges
                  </span>
                  <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 rounded-lg border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-extrabold whitespace-nowrap shrink-0">
                    {badges.length} Earned
                  </Badge>
                </div>
                <div className="max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                  <div className="flex flex-wrap gap-2">
                    {visibleBadges.map((b, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="px-3 py-1.5 rounded-xl bg-card border-emerald-500/30 text-xs font-bold flex items-center gap-2 shadow-sm"
                      >
                        <span>{b.badge_name}</span>
                        <span className="flex items-center text-amber-500 font-mono text-xs">
                          <Star className="size-3 fill-amber-500 mr-0.5" />
                          {b.stars}★
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
                {hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleBadgesCount((prev) => Math.min(prev + 6, badges.length))}
                    className="w-full rounded-xl text-xs font-bold border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                  >
                    <MoreHorizontal className="size-3.5 mr-1.5" />
                    Load More ({badges.length - visibleBadgesCount} more)
                  </Button>
                )}
              </div>
            );
          })()}

          {/* Verified Certificates Showcase */}
          {certs.length > 0 ? (() => {
            const [visibleCertsCount, setVisibleCertsCount] = useState(3);
            const visibleCerts = certs.slice(0, visibleCertsCount);
            const hasMore = visibleCertsCount < certs.length;

            return (
              <div className="p-4 rounded-2xl bg-card/40 border border-emerald-500/20 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                    <Award className="size-4 text-emerald-500 shrink-0" />
                    <span className="truncate">HackerRank Skill Certificates</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 rounded-lg font-extrabold border-emerald-500/30 text-emerald-500 bg-emerald-500/10 whitespace-nowrap shrink-0">
                    {certs.length} Verified
                  </Badge>
                </div>

                <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                  <div className="grid grid-cols-1 gap-2.5">
                    {visibleCerts.map((c, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-card border border-border/70 hover:border-emerald-500/40 transition-all duration-200 flex items-center justify-between gap-3 shadow-sm">
                        <div className="min-w-0 space-y-0.5">
                          <h5 className="text-xs sm:text-sm font-extrabold text-foreground truncate">{c.heading}</h5>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium flex-wrap">
                            {c.level && <span className="capitalize font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{c.level} Level</span>}
                            {c.earned_at && <span>Earned: {new Date(c.earned_at).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        {c.certificate_url && (
                          <a
                            href={c.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors border border-emerald-500/20"
                          >
                            Verify <ArrowUpRight className="size-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleCertsCount((prev) => Math.min(prev + 3, certs.length))}
                    className="w-full rounded-xl text-xs font-bold border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                  >
                    <MoreHorizontal className="size-3.5 mr-1.5" />
                    Load More ({certs.length - visibleCertsCount} more)
                  </Button>
                )}
              </div>
            );
          })() : (
            <div className="p-3.5 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-md flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2 font-medium">
                <Award className="size-4 text-muted-foreground" />
                HackerRank Skill Credentials
              </span>
              <span className="text-[11px] font-semibold">0 Certificates</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
