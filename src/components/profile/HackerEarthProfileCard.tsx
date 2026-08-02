import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Trophy,
  Flame,
  Globe,
  Award,
} from "lucide-react";
import { HackerEarthStats } from "@/types/codingProfile";
import { cn } from "@/lib/utils";

interface HackerEarthProfileCardProps {
  stats?: HackerEarthStats | null;
  error?: string | null;
  loading?: boolean;
  usernameOrHandle: string;
  onConnect?: () => void;
  onRefresh?: () => void;
  onEditHandle?: () => void;
}

export const HackerEarthProfileCard: React.FC<HackerEarthProfileCardProps> = ({
  stats,
  error,
  loading = false,
  usernameOrHandle,
  onConnect,
  onRefresh,
  onEditHandle,
}) => {
  const isConnected = Boolean(usernameOrHandle);
  const profileUrl = `https://www.hackerearth.com/@${encodeURIComponent(usernameOrHandle)}`;

  const rating = stats?.rating ?? 0;
  const maxRating = stats?.maxRating ?? rating;
  const totalSolved = stats?.totalSolved ?? 0;
  const contestsAttended = stats?.contestsAttended ?? 0;
  const globalRank = stats?.globalRank;
  const rankTitle = stats?.rank || (rating > 0 ? "Competitive Solver" : "Unrated");

  return (
    <div className="group relative rounded-3xl border border-sky-500/20 bg-card/40 p-6 backdrop-blur-xl transition-all duration-500 hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/5">
      {/* Platform Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 font-black text-lg">
            HE
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-lg text-foreground tracking-tight flex items-center gap-2">
              <span className="truncate">HackerEarth</span>
              {isConnected && (
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-sky-500/30 bg-sky-500/10 text-sky-400 shrink-0">
                  Connected
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground font-medium truncate">
              {isConnected ? `@${usernameOrHandle}` : "Not connected"}
            </p>
          </div>
        </div>

        {isConnected && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="size-9 rounded-xl border border-border/80 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 shrink-0"
            title="View HackerEarth Profile"
          >
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>

      {/* Card Content State */}
      {!isConnected ? (
        <div className="py-8 text-center space-y-4">
          <div className="size-12 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
            <PlusCircle className="size-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-foreground">Connect HackerEarth Profile</h4>
            <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
              Showcase your HackerEarth rating, global rank, and contest standings.
            </p>
          </div>
          {onConnect && (
            <Button
              onClick={onConnect}
              size="sm"
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl px-5 shadow-md shadow-sky-600/20"
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
          {(stats?.name || stats?.country || stats?.avatar) && (
            <div className="p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/15 flex items-center gap-3">
              {stats?.avatar ? (
                <img
                  src={stats.avatar}
                  alt={stats.name || usernameOrHandle}
                  className="size-10 rounded-xl object-cover border border-sky-500/20 shrink-0"
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <div className="size-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center font-extrabold text-sky-400 text-sm shrink-0">
                  {(stats?.name || usernameOrHandle).substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-foreground truncate">
                  {stats?.name || usernameOrHandle}
                </h4>
                {stats?.country && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium truncate mt-0.5">
                    <Globe className="size-3 text-sky-400 shrink-0" />
                    {stats.country}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Hero Standings Banner */}
          <div className="p-5 sm:p-6 rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/20 to-sky-500/5 flex items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                HackerEarth Rating
              </span>
              <Badge className="bg-sky-600 text-white font-extrabold text-sm px-3 py-1 rounded-xl shadow-sm border-0 flex items-center gap-1.5">
                <Trophy className="size-4 fill-current" /> {rankTitle}
              </Badge>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-sky-400 tracking-tight block">
                {rating}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Peak Rating: <span className="font-mono text-foreground">{maxRating}</span>
              </span>
            </div>
          </div>

          {/* 4 Premium Key Metrics Tiles (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Rating Score */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-sky-500/40 transition-all duration-300 shadow-sm space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Trophy className="size-3.5" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                  Rating
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-sky-400 tracking-tight">
                  {rating ? rating : "Unrated"}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                  Competitive Score
                </div>
              </div>
            </div>

            {/* Global Rank */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-sky-500/40 transition-all duration-300 shadow-sm space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Globe className="size-3.5" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                  Global Rank
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                  {globalRank ? `#${globalRank.toLocaleString()}` : "Top Solver"}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                  Worldwide Standing
                </div>
              </div>
            </div>

            {/* Contests Attended */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-sky-500/40 transition-all duration-300 shadow-sm space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Flame className="size-3.5" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                  Contests
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                  {contestsAttended}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                  Attended & Rated
                </div>
              </div>
            </div>

            {/* Problems Solved */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-sky-500/40 transition-all duration-300 shadow-sm space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                  Problems Solved
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black font-mono text-sky-400 tracking-tight">
                  {totalSolved.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                  Challenges Completed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
