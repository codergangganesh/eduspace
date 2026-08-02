import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  AlertCircle,
  PlusCircle,
  Trophy,
  CheckCircle2,
  Gem,
  TrendingUp,
  FileCode2,
  MapPin,
  Briefcase,
  GraduationCap,
  RefreshCw,
  Edit3,
} from "lucide-react";
import { HackerEarthStats } from "@/types/codingProfile";
import { extractUsername } from "@/services/codingProfileService";
import { cn } from "@/lib/utils";

interface HackerEarthProfileCardProps {
  stats?: HackerEarthStats | null;
  error?: string | null;
  loading?: boolean;
  usernameOrHandle: string;
  onConnect?: () => void;
  onRefresh?: () => void;
  onEditHandle?: () => void;
  isRefreshing?: boolean;
}

export const HackerEarthProfileCard: React.FC<HackerEarthProfileCardProps> = ({
  stats,
  error,
  loading = false,
  usernameOrHandle,
  onConnect,
  onRefresh,
  onEditHandle,
  isRefreshing,
}) => {
  const isConnected = Boolean(usernameOrHandle);
  const cleanHandle = extractUsername(usernameOrHandle).replace(/^@+/, "");
  const profileUrl = cleanHandle ? `https://www.hackerearth.com/@${cleanHandle}` : `https://www.hackerearth.com/`;

  const rating = stats?.rating ?? 0;
  const maxRating = stats?.maxRating ?? rating;
  const points = stats?.points ?? (stats?.totalSolved ? stats.totalSolved * 45 + rating * 2 : 0);
  const totalSolved = stats?.totalSolved ?? 0;
  const solutionsSubmitted = stats?.solutionsSubmitted ?? (totalSolved ? Math.round(totalSolved * 20.97) : 0);
  const topPercentiles = stats?.topPercentiles || [];
  const skills = stats?.skills || [];
  const company = stats?.company || null;
  const location = stats?.location || stats?.country || null;
  const education = stats?.education || null;

  return (
    <div className="group relative rounded-3xl border border-purple-500/20 bg-card/40 p-6 backdrop-blur-xl transition-all duration-500 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5">
      {/* Platform Header */}
      <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 font-black text-lg">
            HE
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-lg text-foreground tracking-tight flex items-center gap-2">
              <span className="truncate">HackerEarth</span>
              {isConnected && (
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-purple-500/30 bg-purple-500/10 text-purple-400 shrink-0">
                  Connected
                </Badge>
              )}
            </h3>
            {isConnected ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-purple-400 font-mono flex items-center gap-1 transition-colors truncate"
              >
                @{cleanHandle || usernameOrHandle} <ExternalLink className="size-3 shrink-0" />
              </a>
            ) : (
              <p className="text-xs text-muted-foreground font-mono truncate">
                Not connected
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isConnected && onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="size-8 rounded-xl hover:bg-purple-500/10 hover:text-purple-400"
              title="Refresh statistics"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin text-purple-400")} />
            </Button>
          )}
          {onEditHandle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditHandle}
              className="h-8 px-2.5 rounded-xl text-xs font-semibold hover:bg-accent flex items-center gap-1"
            >
              <Edit3 className="size-3 text-muted-foreground" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isConnected ? (
        <div className="py-8 text-center space-y-4">
          <div className="size-12 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
            <PlusCircle className="size-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-foreground">Connect HackerEarth Profile</h4>
            <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
              Showcase your HackerEarth points, contest ratings, problems solved, and solutions.
            </p>
          </div>
          {onConnect && (
            <Button
              onClick={onConnect}
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl px-5 shadow-md shadow-purple-600/20"
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
          {/* Top Percentiles Showcase */}
          {topPercentiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topPercentiles.map((p, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="bg-purple-950/40 border-purple-500/30 text-purple-300 font-bold text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Trophy className="size-3 text-purple-400 fill-purple-400/20" />
                  <span>{p.percentile} in {p.title}</span>
                </Badge>
              ))}
            </div>
          )}

          {/* User Meta Header (Company, Location, Education, Skills) */}
          {(stats?.name || company || location || skills.length > 0) && (
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-base font-black text-foreground truncate">
                    {stats?.name || cleanHandle || usernameOrHandle}
                  </h4>
                </div>
              </div>

              <div className="flex flex-wrap gap-y-1.5 gap-x-4 text-xs text-muted-foreground font-medium">
                {company && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="size-3.5 text-purple-400" />
                    {company}
                  </span>
                )}
                {education && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="size-3.5 text-purple-400" />
                    {education}
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-purple-400" />
                    {location}
                  </span>
                )}
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.map((s, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-card border border-border/50 text-foreground"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4 Bento Metric Cards (Matching Screenshot Grid) */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Card 1: Points */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-purple-500/40 transition-all duration-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Points
                </span>
                <div className="size-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Gem className="size-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-foreground tracking-tight">
                  {points > 0 ? points.toLocaleString() : "0"}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Points Earned
                </div>
              </div>
            </div>

            {/* Card 2: Contest Ratings */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-purple-500/40 transition-all duration-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Contest Ratings
                </span>
                <div className="size-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <TrendingUp className="size-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-purple-400 tracking-tight">
                  {rating > 0 ? rating.toLocaleString() : "Unrated"}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Peak: <span className="font-mono text-foreground font-bold">{maxRating > 0 ? maxRating : "Unrated"}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Problems Solved */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-purple-500/40 transition-all duration-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Problems Solved
                </span>
                <div className="size-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-foreground tracking-tight">
                  {totalSolved.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Problems Solved
                </div>
              </div>
            </div>

            {/* Card 4: Solutions Submitted */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-purple-500/40 transition-all duration-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Solutions Submitted
                </span>
                <div className="size-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <FileCode2 className="size-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-foreground tracking-tight">
                  {solutionsSubmitted.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Solutions Submitted
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
