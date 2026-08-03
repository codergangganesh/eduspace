import React, { useState, useEffect, useCallback } from "react";
import { ChessStats, ChessGame } from "@/types/chessProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ExternalLink,
  RefreshCw,
  Trophy,
  Swords,
  ShieldAlert,
  Search,
  Loader2,
  Edit3,
  CheckCircle2,
  Sparkles,
  Zap,
  Clock,
  Calendar,
  Users,
  Award,
  Flame,
  Globe,
  TrendingUp,
  Target,
  Medal,
  Activity,
  Star,
} from "lucide-react";

const POPULAR_CHESS_HANDLES = ["hikaru", "magnuscarlsen", "dannyrench", "gothamchess", "levonaronian"];

export function ChessPawnIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a3 3 0 0 0-3 3c0 .8.3 1.5.8 2.1C8.6 8.1 8 9.5 8 11c0 1.2.4 2.3 1.1 3.1C7.8 15.3 7 17 7 19h10c0-2-.8-3.7-2.1-4.9.7-.8 1.1-1.9 1.1-3.1 0-1.5-.6-2.9-1.8-3.9.5-.6.8-1.3.8-2.1a3 3 0 0 0-3-3zM6 19v2h12v-2H6z" />
    </svg>
  );
}

import { cn } from "@/lib/utils";
import { fetchChessStats } from "@/services/chessService";
import { toast } from "sonner";

interface ChessProfileCardProps {
  usernameOrHandle?: string | null;
  stats?: ChessStats | null;
  error?: string | null;
  onConnect?: () => void;
  onEditHandle?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ChessProfileCard({
  usernameOrHandle,
  stats: initialStats,
  error: initialError,
  onConnect,
  onEditHandle,
  onRefresh,
  isRefreshing,
}: ChessProfileCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchHandle, setSearchHandle] = useState(usernameOrHandle || initialStats?.username || "");
  const [loading, setLoading] = useState(false);
  const [activeStats, setActiveStats] = useState<ChessStats | null>(initialStats || null);
  const [activeError, setActiveError] = useState<string | null>(initialError || null);

  const isLinked = Boolean(usernameOrHandle || initialStats?.username);

  const handleInspectOrSearch = useCallback(async (handleToFetch: string) => {
    const clean = handleToFetch.trim();
    if (!clean) return;
    setLoading(true);
    setActiveError(null);
    try {
      const res = await fetchChessStats(clean);
      if (res.error) {
        setActiveError(res.error);
        toast.error(res.error);
      } else {
        setActiveStats(res.data);
        setActiveError(null);
        toast.success(`Fetched Chess.com profile for @${res.data?.username}`);
      }
    } catch (err: any) {
      setActiveError(err?.message || "Failed to fetch Chess.com profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialStats) {
      setActiveStats(initialStats);
    } else if (usernameOrHandle && !activeStats) {
      handleInspectOrSearch(usernameOrHandle);
    }
  }, [initialStats, usernameOrHandle, handleInspectOrSearch, activeStats]);

  const currentStats = activeStats || initialStats;
  const currentError = activeError || initialError;

  const profileUrl = currentStats?.profileUrl || (usernameOrHandle ? `https://www.chess.com/member/${usernameOrHandle}` : "https://www.chess.com");

  // Format date display
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return null;
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  // 1. Unlinked Empty State
  if (!isLinked && !currentStats) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#81b64c]/20 bg-card/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-[#81b64c]/40 hover:shadow-lg hover:shadow-[#81b64c]/5">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#81b64c]/20 to-[#538b32]/10 border border-[#81b64c]/30 shadow-inner">
            <ChessPawnIcon className="size-7 text-[#81b64c]" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-bold text-foreground">Chess.com Integration</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your Chess.com account to showcase your ratings (Bullet, Blitz, Rapid, Daily, Chess, Puzzles), overall statistics, achievements, FIDE titles, and recent match activity.
            </p>
          </div>
          <Button
            onClick={onConnect}
            className="h-9 px-5 text-xs font-semibold bg-[#81b64c] hover:bg-[#6fa03d] text-white shadow-md shadow-[#81b64c]/25 gap-2"
          >
            <ChessPawnIcon className="size-3.5" /> Connect Chess.com
          </Button>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (currentError && !currentStats) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/5 p-6 backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <ShieldAlert className="size-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Chess.com Profile Error</h4>
            <p className="text-xs text-muted-foreground max-w-xs">{currentError}</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {onEditHandle && (
              <Button onClick={onEditHandle} variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Edit3 className="size-3.5" /> Edit Username
              </Button>
            )}
            {onRefresh && (
              <Button onClick={onRefresh} variant="ghost" size="sm" className="h-8 text-xs gap-1.5" disabled={isRefreshing}>
                <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} /> Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Mode Ratings list
  const modes = [
    { key: "bullet", label: "Bullet", data: currentStats?.bullet, icon: Zap, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    { key: "blitz", label: "Blitz", data: currentStats?.blitz, icon: Flame, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
    { key: "rapid", label: "Rapid", data: currentStats?.rapid, icon: Clock, color: "text-[#81b64c] bg-[#81b64c]/10 border-[#81b64c]/20" },
    { key: "daily", label: "Daily", data: currentStats?.daily, icon: Calendar, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    { key: "chess", label: "Chess", data: currentStats?.chess960, icon: Swords, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    { key: "puzzle", label: "Puzzles", data: currentStats?.puzzle, icon: Trophy, color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  ].filter((m) => m.data !== null && m.data !== undefined);

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl border border-[#81b64c]/25 bg-card/70 p-5 backdrop-blur-xl transition-all duration-300 hover:border-[#81b64c]/45 hover:shadow-xl hover:shadow-[#81b64c]/5">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#81b64c] via-[#538b32] to-[#81b64c]" />

        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 mb-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              {currentStats?.avatar ? (
                <img
                  src={currentStats.avatar}
                  alt={currentStats.username}
                  className="size-11 rounded-xl object-cover border border-[#81b64c]/30 shadow-md"
                />
              ) : (
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#81b64c]/15 border border-[#81b64c]/30 text-[#81b64c]">
                  <ChessPawnIcon className="size-6" />
                </div>
              )}
              {currentStats?.countryFlagUrl && (
                <img
                  src={currentStats.countryFlagUrl}
                  alt={currentStats.country || "Country"}
                  className="absolute -bottom-1 -right-1 size-4 rounded-full border border-background shadow-xs object-cover"
                  title={currentStats.country || undefined}
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-1.5">
                  {currentStats?.name || currentStats?.username || usernameOrHandle}
                </h3>
                {currentStats?.title && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#81b64c] text-white tracking-wider uppercase">
                    {currentStats.title}
                  </span>
                )}
                {currentStats?.verified && (
                  <span title="Verified Account">
                    <CheckCircle2 className="size-4 text-[#81b64c] fill-[#81b64c]/20" />
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono">@{currentStats?.username || usernameOrHandle}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg hover:bg-[#81b64c]/10 hover:text-[#81b64c]"
                disabled={isRefreshing}
                title="Refresh Chess.com data"
              >
                <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              </Button>
            )}
            {onEditHandle && (
              <Button
                onClick={onEditHandle}
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg hover:bg-muted"
                title="Edit username"
              >
                <Edit3 className="size-3.5" />
              </Button>
            )}
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background/50 hover:bg-[#81b64c] hover:text-white hover:border-[#81b64c] transition-colors"
              title="View profile on Chess.com"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {/* Profile Info Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-4 text-[11px] text-muted-foreground border-y border-border/40 py-2.5">
          {currentStats?.joinedDate && (
            <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-md">
              <Calendar className="size-3 text-[#81b64c]" />
              <span>Joined {formatDate(currentStats.joinedDate)}</span>
            </div>
          )}
          {currentStats?.followers !== undefined && currentStats.followers > 0 && (
            <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-md">
              <Users className="size-3 text-[#81b64c]" />
              <span>{currentStats.followers.toLocaleString()} Followers</span>
            </div>
          )}
          {currentStats?.league && (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-md font-medium">
              <Trophy className="size-3" />
              <span>{currentStats.league} League</span>
            </div>
          )}
          {currentStats?.favoriteTimeControl && (
            <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-md font-medium">
              <Target className="size-3" />
              <span>Fav: {currentStats.favoriteTimeControl}</span>
            </div>
          )}
        </div>

        {/* Rating Modes Grid */}
        <div className="mb-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            Mode Ratings & Statistics
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {modes.length > 0 ? (
              modes.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.key}
                    className="flex flex-col justify-between p-1.5 rounded-xl border border-border/50 bg-background/40 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Icon className="size-3.5 text-[#81b64c]" /> {m.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={cn("text-[9px] font-bold px-1 py-0.2 rounded border leading-none", m.color)}>
                          {m.data?.highestRating}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-base font-extrabold text-foreground tracking-tight">
                        {m.data?.currentRating}
                      </span>
                      {m.data?.winPercentage !== undefined && m.data.gamesPlayed > 0 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {m.data.winPercentage}% Win
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-3 text-xs text-muted-foreground">
                No active mode ratings available.
              </div>
            )}
          </div>
        </div>

        {/* Overall Statistics Highlight Bar */}
        <div className="grid grid-cols-4 gap-1.5 mt-9 mb-2 p-2.5 rounded-xl bg-gradient-to-r from-[#81b64c]/10 via-emerald-500/5 to-transparent border border-[#81b64c]/20 text-center">
          <div className="border-r border-border/40 pr-1">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase">Played</p>
            <p className="text-xs font-black text-foreground">
              {currentStats?.totalGamesPlayed?.toLocaleString() || 0}
            </p>
          </div>
          <div className="border-r border-border/40 pr-1">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase">Wins</p>
            <p className="text-xs font-black text-emerald-500">
              {currentStats?.totalWins?.toLocaleString() || 0}
            </p>
          </div>
          <div className="border-r border-border/40 pr-1">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase">Win Rate</p>
            <p className="text-xs font-black text-[#81b64c]">
              {currentStats?.overallWinRate || 0}%
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-muted-foreground uppercase">Highest</p>
            <p className="text-xs font-black text-foreground">
              {currentStats?.highestRatingAchieved || 0}
            </p>
          </div>
        </div>

        {/* Bottom Action Button */}
        <div className="mt-12">
          <Button
            onClick={() => setIsSheetOpen(true)}
            className="w-full h-9 text-xs font-bold bg-[#81b64c] hover:bg-[#6fa03d] text-white transition-colors gap-2 rounded-xl"
          >
            View All Achievements & Recent Matches
          </Button>
        </div>
      </div>

      {/* Slide-Over Drawer Sheet for In-Depth Stats */}
      <ChessSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        activeStats={currentStats}
        activeError={currentError}
        loading={loading}
        searchHandle={searchHandle}
        setSearchHandle={setSearchHandle}
        onSearch={() => handleInspectOrSearch(searchHandle)}
      />
    </>
  );
}

// Subcomponent: Chess.com Slide-Over Detail Sheet
interface ChessSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeStats: ChessStats | null;
  activeError: string | null;
  loading: boolean;
  searchHandle: string;
  setSearchHandle: (val: string) => void;
  onSearch: () => void;
}

function ChessSheet({
  isOpen,
  onClose,
  activeStats,
  activeError,
  loading,
  searchHandle,
  setSearchHandle,
  onSearch,
}: ChessSheetProps) {
  const modes = [
    { label: "Bullet", data: activeStats?.bullet, icon: Zap },
    { label: "Blitz", data: activeStats?.blitz, icon: Flame },
    { label: "Rapid", data: activeStats?.rapid, icon: Clock },
    { label: "Daily", data: activeStats?.daily, icon: Calendar },
    { label: "Chess960", data: activeStats?.chess960, icon: Swords },
    { label: "Puzzles", data: activeStats?.puzzle, icon: Trophy },
  ].filter((m) => m.data);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-2xl">
        <SheetHeader className="p-5 pb-4 border-b border-border space-y-3 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#81b64c]/20 text-[#81b64c]">
                <ChessPawnIcon className="size-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold">Chess.com Detailed Profile</SheetTitle>
                <SheetDescription className="text-xs">
                  Public profile, modes, achievements, and recent match history
                </SheetDescription>
              </div>
            </div>
          </div>

          {/* Search bar inside sheet */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchHandle}
                onChange={(e) => setSearchHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder="Search any Chess.com handle (e.g. hikaru)..."
                className="h-8 pl-8 text-xs bg-background/60"
              />
            </div>
            <Button
              onClick={onSearch}
              disabled={loading || !searchHandle.trim()}
              size="sm"
              className="h-8 text-xs bg-[#81b64c] hover:bg-[#6fa03d] text-white"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Search"}
            </Button>
          </div>

          {/* Popular handle chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-muted-foreground font-semibold">Popular:</span>
            {POPULAR_CHESS_HANDLES.map((h) => (
              <button
                key={h}
                onClick={() => {
                  setSearchHandle(h);
                  onSearch();
                }}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-muted/60 hover:bg-[#81b64c]/20 hover:text-[#81b64c] border border-border/50 transition-colors"
              >
                @{h}
              </button>
            ))}
          </div>
        </SheetHeader>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeError && (
            <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{activeError}</span>
            </div>
          )}

          {activeStats ? (
            <>
              {/* Profile Card Summary */}
              <div className="p-4 rounded-xl border border-[#81b64c]/30 bg-card/60 space-y-3">
                <div className="flex items-center gap-3">
                  {activeStats.avatar ? (
                    <img src={activeStats.avatar} alt={activeStats.username} className="size-12 rounded-xl object-cover border border-[#81b64c]/30 shadow-md" />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-xl bg-[#81b64c]/15 text-[#81b64c]">
                      <ChessPawnIcon className="size-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-bold text-foreground flex items-center gap-1.5">
                      {activeStats.name || activeStats.username}
                      {activeStats.title && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#81b64c] text-white uppercase">
                          {activeStats.title}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">@{activeStats.username}</p>
                    {activeStats.location && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Globe className="size-3 text-[#81b64c]" /> {activeStats.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Overall stats breakdown */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/40 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Total Played</p>
                    <p className="text-xs font-bold">{activeStats.totalGamesPlayed.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Wins</p>
                    <p className="text-xs font-bold text-emerald-500">{activeStats.totalWins.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Losses</p>
                    <p className="text-xs font-bold text-rose-500">{activeStats.totalLosses.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Draws</p>
                    <p className="text-xs font-bold text-amber-500">{activeStats.totalDraws.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Achievements & League Section */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Award className="size-3.5 text-[#81b64c]" /> Achievements & Badges
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {activeStats.league && (
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-2.5">
                      <Trophy className="size-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">League Tier</p>
                        <p className="text-xs font-bold text-foreground">{activeStats.league}</p>
                      </div>
                    </div>
                  )}
                  {activeStats.title && (
                    <div className="p-3 rounded-xl border border-[#81b64c]/30 bg-[#81b64c]/5 flex items-center gap-2.5">
                      <Medal className="size-5 text-[#81b64c] shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">FIDE / Master Title</p>
                        <p className="text-xs font-bold text-foreground">{activeStats.title}</p>
                      </div>
                    </div>
                  )}
                  {activeStats.verified && (
                    <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Account Status</p>
                        <p className="text-xs font-bold text-foreground">Verified Player</p>
                      </div>
                    </div>
                  )}
                  {activeStats.puzzle?.highestRating && (
                    <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 flex items-center gap-2.5">
                      <Star className="size-5 text-purple-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Puzzle</p>
                        <p className="text-xs font-bold text-foreground">{activeStats.puzzle.highestRating}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mode Breakdown Table */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-[#81b64c]" /> Detailed Mode Statistics
                </h5>
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border/40">
                  {modes.map((m) => {
                    const Icon = m.icon;
                    const stats = m.data!;
                    return (
                      <div key={m.label} className="p-3 bg-card/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-[#81b64c]/10 text-[#81b64c]">
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{m.label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {stats.wins}W • {stats.losses}L • {stats.draws}D ({stats.winPercentage}% Win Rate)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-foreground text-sm">{stats.currentRating}</p>
                          <p className="text-[10px] text-muted-foreground">{stats.highestRating}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Games List */}
              {activeStats.recentGames && activeStats.recentGames.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Swords className="size-3.5 text-[#81b64c]" /> Recent Match Activity
                    </h5>
                    {activeStats.recentResultsSummary && (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Recent: {activeStats.recentResultsSummary.wins}W / {activeStats.recentResultsSummary.losses}L / {activeStats.recentResultsSummary.draws}D
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {activeStats.recentGames.map((game, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl border border-border/60 bg-card/40 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase",
                              game.result === "win" && "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
                              game.result === "loss" && "bg-rose-500/15 text-rose-500 border border-rose-500/30",
                              game.result === "draw" && "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                            )}
                          >
                            {game.result}
                          </span>
                          <div>
                            <p className="font-semibold text-foreground flex items-center gap-1">
                              <span>vs @{game.opponent.username}</span>
                              <span className="text-muted-foreground text-[11px]">({game.opponent.rating})</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                              <span>{game.timeClass}</span>
                              <span>•</span>
                              <span>{game.userColor === 'white' ? '♔ White' : '♚ Black'}</span>
                            </p>
                          </div>
                        </div>
                        <a
                          href={game.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#81b64c] hover:underline text-[11px] font-semibold flex items-center gap-1"
                        >
                          Replay <ExternalLink className="size-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-xs text-muted-foreground">
              Enter a handle above or select a popular handle to inspect their Chess.com profile.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
