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
  ArrowUpRight,
  Code2,
  RefreshCw,
  Edit3,
  Pin,
} from "lucide-react";
import { HackerRankStats } from "@/types/codingProfile";
import { extractUsername } from "@/services/codingProfileService";
import { UnifiedPlatformLogo } from "./PlatformLogos";
import { UserAvatarImage } from "./CodingProfileCard";
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
  const [activeTab, setActiveTab] = useState<"overview" | "badges" | "certificates">("overview");

  const isConnected = Boolean(usernameOrHandle && usernameOrHandle.trim().length > 0);
  const cleanHandle = extractUsername(usernameOrHandle).replace(/^@+/, "");
  const profileUrl = stats?.profile_url || (cleanHandle ? `https://www.hackerrank.com/profile/${cleanHandle}` : `https://www.hackerrank.com/`);

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

      <div className="space-y-6">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-13 sm:size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-105">
              <UnifiedPlatformLogo platform="hackerrank" className="size-7 sm:size-8" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
                  HackerRank
                </h3>
                {isConnected && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-px rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold w-fit whitespace-nowrap leading-tight shrink-0">
                    <CheckCircle2 className="size-2.5 mr-0.5" />Linked
                  </Badge>
                )}
              </div>
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

        {/* Card Body */}
        {!isConnected ? (
          <div className="py-12 px-6 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80 my-2 space-y-4">
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Link your HackerRank handle to unlock domain star badges, verified skill certificates, and competitive solving rankings.
            </p>
            {onConnect && (
              <Button
                onClick={onConnect}
                size="default"
                className="gap-2 text-xs sm:text-sm rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 px-5 py-2"
              >
                <PlusCircle className="size-4" />
                Connect HackerRank
              </Button>
            )}
          </div>
        ) : error ? (
          <div className="py-6 px-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive my-2 flex items-start gap-3.5">
            <AlertCircle className="size-6 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-bold">Failed to sync profile data</p>
              <p className="opacity-90">{error}</p>
              {onEditHandle && (
                <Button
                  onClick={onEditHandle}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs underline text-destructive hover:bg-destructive/10 mt-2 font-semibold"
                >
                  Edit Handle
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 pt-0.5">
            {/* Profile Header Banner (Ultra Compact 1-Row) */}
            {(stats?.name || stats?.school || stats?.country || stats?.avatar || usernameOrHandle) && (
              <div className="px-2.5 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatarImage
                    src={stats?.avatar}
                    name={stats?.name || usernameOrHandle}
                    fallbackText={stats?.name || usernameOrHandle}
                    borderColor="border-emerald-500/25"
                    fallbackBg="bg-emerald-500/20 border-emerald-500/30"
                    fallbackTextColor="text-emerald-500"
                    sizeClass="size-7"
                  />
                  <div className="min-w-0">
                    <a
                      href={stats?.profile_url || profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-extrabold text-foreground hover:text-emerald-500 truncate leading-tight flex items-center gap-1 transition-colors group/title"
                      title={`Open ${stats?.name || usernameOrHandle}'s HackerRank Profile`}
                    >
                      <span className="truncate">{stats?.name || usernameOrHandle}</span>
                      <ExternalLink className="size-2.5 opacity-60 group-hover/title:opacity-100 shrink-0" />
                    </a>
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground font-medium leading-none mt-0.5">
                      {stats?.country && (
                        <span className="flex items-center gap-0.5">
                          <Globe className="size-2.5 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[80px]">{stats.country}</span>
                        </span>
                      )}
                      {stats?.school && (
                        <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                          <BookOpen className="size-2.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{stats.school}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Badge className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0 rounded-md border-0 shadow-xs flex items-center gap-0.5">
                    <Trophy className="size-2.5 fill-current" /> {stats?.level ? `Lvl ${stats.level}` : "Hacker"}
                  </Badge>
                  {totalStars > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 rounded-md font-bold border-amber-500/40 text-amber-500 bg-amber-500/10 flex items-center gap-0.5">
                      <Star className="size-2.5 fill-amber-500" /> {totalStars}★
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Sub-Tab Navigation Bar (Overview, Badges, Certificates) */}
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/40 rounded-xl border border-border/50 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                  activeTab === "overview"
                    ? "bg-emerald-600 text-white shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground font-semibold"
                )}
              >
                <Code2 className="size-3 shrink-0" />
                <span className="truncate">Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("badges")}
                disabled={badges.length === 0}
                className={cn(
                  "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                  activeTab === "badges"
                    ? "bg-emerald-600 text-white shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground font-semibold",
                  badges.length === 0 && "opacity-40 cursor-not-allowed"
                )}
              >
                <Star className="size-3 shrink-0" />
                <span className="truncate">Badges ({badgesCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("certificates")}
                disabled={certs.length === 0}
                className={cn(
                  "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                  activeTab === "certificates"
                    ? "bg-emerald-600 text-white shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground font-semibold",
                  certs.length === 0 && "opacity-40 cursor-not-allowed"
                )}
              >
                <Award className="size-3 shrink-0" />
                <span className="truncate">Certs ({certsCount})</span>
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-2.5">
                {/* 4 Compact Key Metrics Tiles (2x2 Grid) */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Challenges Solved */}
                  <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-emerald-500/40 transition-all duration-200 shadow-xs space-y-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="size-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                        <CheckCircle2 className="size-2.5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Challenges
                      </span>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black font-mono text-emerald-500 dark:text-emerald-400 tracking-tight leading-tight">
                        {totalSolved.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                        {stats?.score ? `${stats.score.toLocaleString()} Points` : "Problems Solved"}
                      </div>
                    </div>
                  </div>

                  {/* Global Rank */}
                  <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-emerald-500/40 transition-all duration-200 shadow-xs space-y-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="size-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                        <Globe className="size-2.5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Global Rank
                      </span>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                        {globalRank
                          ? (typeof globalRank === "number"
                            ? `#${globalRank.toLocaleString()}`
                            : (String(globalRank).startsWith("#") ? globalRank : `#${globalRank}`))
                          : (totalSolved > 0 ? "Top Solver" : "Unranked")}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                        Worldwide Standing
                      </div>
                    </div>
                  </div>

                  {/* Domain Badges & Stars */}
                  <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-emerald-500/40 transition-all duration-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <div className="flex items-center gap-1 min-w-0">
                        <div className="size-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                          <Star className="size-2.5" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                          Domain Stars
                        </span>
                      </div>
                      {totalStars > 0 && (
                        <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[9px] px-1 py-0 rounded-md shrink-0">
                          {totalStars}★
                        </Badge>
                      )}
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                        {badgesCount} Badges
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                        Across Coding Domains
                      </div>
                    </div>
                  </div>

                  {/* Verified Certificates */}
                  <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-emerald-500/40 transition-all duration-200 shadow-xs space-y-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="size-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                        <Award className="size-2.5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Certificates
                      </span>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                        {certsCount} Verified
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                        Skill Credentials
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Domain Proficiency Showcase Strip */}
                {badges.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Star className="size-3 text-emerald-500" />
                        Domain Badges
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {badges.length} Badges Earned
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {badges.slice(0, 4).map((b, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="px-2 py-0.5 rounded-lg bg-card/60 border-emerald-500/30 text-[10px] font-bold flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="truncate max-w-[80px]">{b.badge_name}</span>
                          <span className="flex items-center text-amber-500 font-mono text-[9px] font-extrabold">
                            <Star className="size-2 fill-amber-500 mr-0.5" />
                            {b.stars}★
                          </span>
                        </Badge>
                      ))}
                      {badges.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("badges")}
                          className="text-[10px] font-extrabold text-emerald-500 hover:underline ml-auto"
                        >
                          +{badges.length - 4} more →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Inline Certificates Preview Footer */}
                {certs.length > 0 && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-card/40 border border-border/40">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Award className="size-3.5 text-emerald-500 shrink-0" />
                      <div className="flex items-center gap-1 overflow-hidden">
                        {certs.slice(0, 2).map((c, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 rounded-md font-bold truncate max-w-[120px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                          >
                            {c.heading}
                          </Badge>
                        ))}
                        {certs.length > 2 && (
                          <span className="text-[10px] text-muted-foreground font-bold shrink-0">
                            +{certs.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("certificates")}
                      className="text-[10px] font-extrabold text-emerald-500 hover:underline shrink-0 flex items-center gap-0.5"
                    >
                      View all ({certs.length}) →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Badges */}
            {activeTab === "badges" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-0.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Domain Proficiency Badges
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md font-extrabold border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                    {badges.length} Earned
                  </Badge>
                </div>

                <div className="max-h-[190px] overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
                  {badges.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-card/60 border border-border/60 hover:border-emerald-500/40 transition-all duration-200 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-black text-foreground block truncate">
                            {b.badge_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium block truncate">
                            {b.solved ? `${b.solved} problems solved` : "Domain Mastery"}
                          </span>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-lg border-amber-500/30 text-amber-500 bg-amber-500/10 font-black shrink-0 flex items-center gap-0.5">
                        <Star className="size-2.5 fill-amber-500" /> {b.stars}★
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Certificates */}
            {activeTab === "certificates" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-0.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Verified Skill Certificates
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md font-extrabold border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                    {certs.length} Verified
                  </Badge>
                </div>

                <div className="max-h-[190px] overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
                  {certs.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-card/60 border border-border/60 hover:border-emerald-500/40 transition-all duration-200 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <h5 className="text-xs font-black text-foreground truncate">{c.heading}</h5>
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium flex-wrap">
                          {c.level && (
                            <span className="capitalize font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0 rounded border border-emerald-500/20">
                              {c.level}
                            </span>
                          )}
                          {c.earned_at && <span>{new Date(c.earned_at).toLocaleDateString()}</span>}
                        </div>
                      </div>

                      {c.certificate_url && (
                        <a
                          href={c.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold flex items-center gap-1 shrink-0 transition-colors border border-emerald-500/20"
                        >
                          Verify <ArrowUpRight className="size-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
