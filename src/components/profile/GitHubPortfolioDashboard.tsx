import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ExternalLink,
  AlertCircle,
  PlusCircle,
  Star,
  GitBranch,
  Users,
  UserCheck,
  FileCode,
  ArrowUpRight,
  Code2,
  Building2,
  MapPin,
  Globe,
  GitFork,
  BookOpen,
  Mail,
  Briefcase,
  Eye,
  Calendar,
  GitCommit,
  GitPullRequest,
  Clock,
  CircleDot,
  CheckCircle,
  History,
  Key,
  Flame,
  Zap,
  Search,
  Trophy,
  Award,
  AtSign,
  Twitter,
} from "lucide-react";
import { GitHubStats } from "@/types/codingProfile";
import { GitHubProfileSearchDialog } from "./GitHubProfileSearchDialog";
import { GitHubContributionHeatmap } from "./GitHubContributionHeatmap";
import { cn } from "@/lib/utils";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  HTML: "#e34c26",
  CSS: "#563d7c",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  Vue: "#41b883",
  React: "#61dafb",
  Dart: "#00B4AB",
  Jupyter: "#DA5B0B",
  SCSS: "#c6538c",
};

function getLanguageColor(lang: string | null | undefined): string {
  if (!lang) return "#94a3b8";
  return LANGUAGE_COLORS[lang] || "#8b5cf6";
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

interface GitHubPortfolioDashboardProps {
  username?: string | null;
  stats?: GitHubStats | null;
  error?: string | null;
  onEdit: () => void;
  className?: string;
  githubToken?: string | null;
}

export function GitHubPortfolioDashboard({
  username,
  stats,
  error,
  onEdit,
  className,
  githubToken,
}: GitHubPortfolioDashboardProps) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const hasLinked = Boolean(username && username.trim().length > 0);
  const profileUrl = stats?.htmlUrl || `https://github.com/${username}`;

  if (!hasLinked) {
    return (
      <div className={cn("rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-8 text-center space-y-4 shadow-sm", className)}>
        <div className="size-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
          <GitBranch className="size-8" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="font-bold text-lg text-foreground">Connect Your GitHub Profile</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Link your GitHub handle to showcase your open-source projects, top languages, stargazers, and development portfolio.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          <Button
            onClick={onEdit}
            className="rounded-2xl font-bold gap-2 text-xs px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <PlusCircle className="size-4" /> Connect GitHub
          </Button>
          <Button
            onClick={() => setIsSearchOpen(true)}
            variant="outline"
            className="rounded-2xl font-bold gap-2 text-xs px-5 py-2 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 shadow-sm"
          >
            <Search className="size-4" /> Search Profiles
          </Button>
        </div>

        <GitHubProfileSearchDialog
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          githubToken={githubToken}
        />
      </div>
    );
  }

  if (error && !stats) {
    const fallbackAvatar = `https://github.com/${username}.png`;
    return (
      <div className={cn("rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/95 to-card/90 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-md w-full", className)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <div className="flex items-center gap-4">
            <img
              src={fallbackAvatar}
              alt={username || "GitHub Avatar"}
              className="size-16 rounded-2xl object-cover border-2 border-blue-500/30 shadow-md shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-xl text-foreground tracking-tight">@{username}</h3>
                <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 rounded-full border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold flex items-center gap-1">
                  <AlertCircle className="size-3" /> Live Sync Rate-Limited
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                GitHub's unauthenticated API rate limit (60 req/hr) was reached. Add a free GitHub token below to unlock 5,000 req/hr live sync!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="rounded-2xl text-xs font-bold gap-1.5"
            >
              <Key className="size-3.5 text-blue-500" /> Add Token / Edit Handle
            </Button>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all font-bold text-xs flex items-center gap-2 shadow-sm"
            >
              <span>View GitHub Profile</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        {/* Step-by-Step Recommendation Card */}
        <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Key className="size-4" /> Recommended: Unlock 5,000 Requests/Hour (Free Token)
            </h5>
            <Button
              variant="link"
              size="sm"
              onClick={onEdit}
              className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400 font-bold underline"
            >
              Paste Token Here $\rightarrow$
            </Button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            By default, GitHub restricts guest IP requests to 60/hr. Generating a free token takes 10 seconds and grants your profile a dedicated <strong>5,000 requests per hour</strong> limit.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-card border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Step 1: Open GitHub Settings</span>
              <p className="text-[11px] text-muted-foreground">
                Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">github.com/settings/tokens</a> and click <em>Generate new token (classic)</em>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Step 2: Leave Scopes Blank</span>
              <p className="text-[11px] text-muted-foreground">
                Type a note (e.g. <code>EduSpace</code>) and leave <strong>all scope checkboxes unchecked</strong> (0 permissions needed!).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/60 text-xs space-y-1">
              <span className="font-bold text-foreground block">Step 3: Paste Token</span>
              <p className="text-[11px] text-muted-foreground">
                Click <em>Generate token</em>, copy the <code>ghp_...</code> code, and paste it into <strong>Edit Handles</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>Connected GitHub Account: <strong className="text-foreground font-mono">@{username}</strong></span>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setIsSearchOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400"
            >
              <Search className="size-3.5" /> Search Profiles
            </Button>
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1">
              <span>github.com/{username}</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        <GitHubProfileSearchDialog
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          githubToken={githubToken}
        />
      </div>
    );
  }

  const joinedDateFormatted = stats?.createdAt
    ? new Date(stats.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <div className={cn("space-y-6 w-full", className)}>
      {/* Top Banner Card: Developer Profile Header */}
      <div className="group relative rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/95 to-card/90 backdrop-blur-xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all overflow-hidden space-y-6">
        <div className="absolute -top-32 -right-32 size-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-start gap-5 w-full">
          {stats?.avatarUrl ? (
            <div className="relative shrink-0">
              <img
                src={stats.avatarUrl}
                alt={stats.name || stats.username || "GitHub Avatar"}
                className="size-16 sm:size-20 rounded-2xl object-cover border-2 border-blue-500/30 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 bg-card border border-border/60 rounded-full p-1 shadow-sm">
                <CheckCircle className="size-4 text-blue-500 fill-blue-500/20" />
              </div>
            </div>
          ) : (
            <div className="size-16 sm:size-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-2xl shrink-0 shadow-inner">
              {(stats?.name || stats?.username || "G").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-2 flex-1 min-w-0">
            {/* Top Name Row: Name + Handle on Left, Search + View Profile Buttons on Right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-extrabold text-xl sm:text-2xl text-foreground tracking-tight">
                  {stats?.name || stats?.username}
                </h3>
                <span className="text-xs font-mono text-muted-foreground font-semibold">
                  @{stats?.username || username}
                </span>
              </div>

              {/* Action Header Buttons: Placed right inline with the developer name */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                <Button
                  onClick={() => setIsSearchOpen(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-2xl text-xs font-bold gap-1.5 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 shadow-sm transition-transform active:scale-95 px-3.5 py-1.5"
                >
                  <Search className="size-3.5 text-blue-500" />
                  <span>Search Profiles</span>
                </Button>

                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <span>View GitHub Profile</span>

                </a>
              </div>
            </div>

            {/* Developer Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">









              {/* Dedicated Quota Badge */}


              {/* Daily Coding Streak Badge */}
              {(stats?.streak?.currentStreak ?? 1) > 0 && (
                <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 rounded-full border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold flex items-center gap-1">
                  <Flame className="size-3 text-amber-500 fill-amber-500/30 animate-pulse" /> {stats?.streak?.currentStreak || 1} Day Streak
                </Badge>
              )}

              {joinedDateFormatted && (
                <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 rounded-full border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold flex items-center gap-1">
                  <Calendar className="size-3" /> Joined {joinedDateFormatted}
                </Badge>
              )}
            </div>

            {stats?.bio && (
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {stats.bio}
              </p>
            )}

            {/* Contact & Metadata Pills */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">

              {stats?.company && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="size-3.5 text-blue-500 dark:text-blue-400" />
                  {stats.company}
                </span>
              )}
              {stats?.location && (
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="size-3.5 text-blue-500 dark:text-blue-400" />
                  {stats.location}
                </span>
              )}

              {/* {stats?.email && (
                <a
                  href={`mailto:${stats.email}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium"
                >
                  <Mail className="size-3.5 text-blue-500 dark:text-blue-400" />
                  {stats.email}
                </a>
              )} */}
              {stats?.twitterUsername && (
                <a
                  href={`https://twitter.com/${stats.twitterUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sky-500 hover:underline font-semibold"
                >
                  <Twitter className="size-3.5 text-sky-400" />
                  @{stats.twitterUsername}
                </a>
              )}
            </div>


          </div>
        </div>

        {/* 8-Tile Metrics Dashboard Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
            <GitBranch className="size-4 text-blue-500 dark:text-blue-400 mx-auto mb-1" />
            <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono block">
              {stats?.publicRepos ?? 0}
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">Repos</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <Star className="size-4 text-amber-400 mx-auto mb-1" />
            <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono block">
              {stats?.totalStars ?? 0}
            </span>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Stars</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
            <GitFork className="size-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono block">
              {stats?.totalForks ?? 0}
            </span>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Forks</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
            <Eye className="size-4 text-indigo-400 mx-auto mb-1" />
            <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono block">
              {stats?.totalWatchers ?? 0}
            </span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Watchers</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
            <Users className="size-4 text-blue-400 mx-auto mb-1" />
            <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono block">
              {stats?.followers ?? 0}
            </span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Followers</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <UserCheck className="size-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono block">
              {stats?.following ?? 0}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Following</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
            <FileCode className="size-4 text-rose-400 mx-auto mb-1" />
            <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono block">
              {stats?.publicGists ?? 0}
            </span>
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Gists</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center">
            <CircleDot className="size-4 text-teal-400 mx-auto mb-1" />
            <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono block">
              {stats?.totalOpenIssues ?? 0}
            </span>
            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">Open Issues</span>
          </div>
        </div>
      </div>

      {/* 1. Top Programming Languages & Stack (Full Width - Fills Entire Space) */}
      {stats?.topLanguages && stats.topLanguages.length > 0 && (
        <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-4 sm:p-6 space-y-4 shadow-sm w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
              <Code2 className="size-4 text-blue-500 dark:text-blue-400 shrink-0" /> Programming Languages & Stack
            </h4>
            <span className="text-[11px] sm:text-xs font-mono text-muted-foreground bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-semibold w-fit">
              Top {stats.topLanguages.length} Languages
            </span>
          </div>

          {/* Multi-segment Progress Bar */}
          <div className="h-3 sm:h-3.5 rounded-full bg-muted/60 overflow-hidden flex shadow-inner w-full">
            {stats.topLanguages.map((item) => (
              <div
                key={item.language}
                title={`${item.language}: ${item.percentage}% (${item.count} repos)`}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: getLanguageColor(item.language),
                }}
                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>

          {/* Language Badges Grid: Spans up to 6 columns on desktop to fill full width */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            {stats.topLanguages.map((item) => (
              <div
                key={item.language}
                className="p-3 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between gap-2 min-w-0"
              >
                <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                  <span
                    className="size-2.5 sm:size-3 rounded-full shrink-0"
                    style={{ backgroundColor: getLanguageColor(item.language) }}
                  />
                  <span className="text-xs font-bold text-foreground truncate">{item.language}</span>
                </div>
                <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 shrink-0">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Featured Repositories Grid (Full Width) */}
      {stats?.topRepos && stats.topRepos.length > 0 && (
        <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-4 sm:p-6 space-y-4 shadow-sm w-full">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
              <BookOpen className="size-4 text-blue-500 dark:text-blue-400 shrink-0" /> Featured Repositories ({stats?.publicRepos ?? stats.topRepos.length})
            </h4>
            <Sheet>
              <SheetTrigger asChild>
                <button className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                  <span>View All ({stats?.publicRepos ?? stats.topRepos.length})</span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[92vw] sm:max-w-lg p-6 overflow-y-auto rounded-l-3xl border-l border-border/80">
                <SheetHeader className="pb-4 border-b border-border/50">
                  <SheetTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                    <BookOpen className="size-4 text-blue-500 dark:text-blue-400" />
                    All Public Repositories ({stats?.publicRepos ?? stats.topRepos.length})
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    Public projects and repositories for @{stats?.username || username}.
                  </SheetDescription>
                </SheetHeader>

                {/* Repository list inside Slide-Over Side Sheet */}
                <div className="space-y-3.5 py-4">
                  {stats.topRepos.map((repo) => (
                    <a
                      key={repo.name}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/repo p-4 rounded-2xl bg-muted/30 border border-border/60 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all space-y-2 flex flex-col justify-between block shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-extrabold text-sm text-foreground group-hover/repo:text-sky-400 transition-colors truncate">
                            {repo.name}
                          </h5>
                        </div>

                        {repo.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            {repo.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40 font-mono">
                        {repo.language ? (
                          <span className="flex items-center gap-1.5 font-semibold text-foreground">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            />
                            {repo.language}
                          </span>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1" title="Stargazers">
                            <Star className="size-3.5 text-amber-400 fill-amber-400/20" />
                            {repo.stars}
                          </span>
                          <span className="flex items-center gap-1" title="Forks">
                            <GitFork className="size-3.5 text-cyan-400" />
                            {repo.forks}
                          </span>
                          <span className="flex items-center gap-1" title="Open Issues">
                            <CircleDot className="size-3.5 text-teal-400" />
                            {repo.openIssues}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.topRepos.slice(0, 4).map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/repo p-5 rounded-2xl bg-card border border-border/80 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all space-y-3 flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-extrabold text-sm text-foreground group-hover/repo:text-sky-400 transition-colors truncate">
                      {repo.name}
                    </h5>
                  </div>

                  {repo.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50 font-mono">
                  {repo.language ? (
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                      />
                      {repo.language}
                    </span>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 text-amber-400 fill-amber-400/20" />
                      {repo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="size-3.5 text-cyan-400" />
                      {repo.forks}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 3. Bottom Grid: Recent Activity & Organizations */}
      <div
        className={cn(
          "grid grid-cols-1 gap-6 w-full",
          stats?.organizations && stats.organizations.length > 0 ? "lg:grid-cols-3" : "grid-cols-1"
        )}
      >
        {/* Recent Open-Source Activity */}
        {stats?.recentEvents && stats.recentEvents.length > 0 && (
          <div
            className={cn(
              "rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-4 sm:p-6 space-y-4 shadow-sm",
              stats?.organizations && stats.organizations.length > 0 ? "lg:col-span-2" : "w-full"
            )}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                <Clock className="size-4 text-blue-500 dark:text-blue-400 shrink-0" /> Recent Activity
              </h4>
              <Sheet>
                <SheetTrigger asChild>
                  <button className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                    <span>View All</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[92vw] sm:max-w-md p-6 overflow-y-auto rounded-l-3xl border-l border-border/80">
                  <SheetHeader className="pb-4 border-b border-border/50">
                    <SheetTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
                      <History className="size-4 text-blue-500 dark:text-blue-400" />
                      Recent GitHub Activity
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground">
                      Latest open-source events, commits, pull requests, and stars for @{stats?.username || username}.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-3 py-4">
                    {stats.recentEvents.map((evt) => (
                      <a
                        key={evt.id}
                        href={evt.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/evt p-3.5 rounded-2xl bg-muted/30 border border-border/60 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all flex items-start gap-3 text-xs block shadow-sm"
                      >
                        <div className="p-2 rounded-xl bg-blue-500/10 border border-border/20 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                          {evt.type === "PushEvent" ? (
                            <GitCommit className="size-4" />
                          ) : evt.type === "PullRequestEvent" ? (
                            <GitPullRequest className="size-4" />
                          ) : (
                            <GitBranch className="size-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-foreground truncate group-hover/evt:text-blue-500 dark:group-hover/evt:text-blue-400 transition-colors">
                              {evt.repoName}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                              {formatRelativeTime(evt.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {evt.message}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div
              className={cn(
                "grid gap-3",
                stats?.organizations && stats.organizations.length > 0
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              )}
            >
              {stats.recentEvents.slice(0, 4).map((evt) => (
                <a
                  key={evt.id}
                  href={evt.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/evt p-4 rounded-2xl bg-muted/20 border border-border/50 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all flex items-start gap-3 text-xs block"
                >
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-border/20 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    {evt.type === "PushEvent" ? (
                      <GitCommit className="size-4" />
                    ) : evt.type === "PullRequestEvent" ? (
                      <GitPullRequest className="size-4" />
                    ) : (
                      <GitBranch className="size-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-foreground truncate group-hover/evt:text-blue-500 dark:group-hover/evt:text-blue-400 transition-colors">
                        {evt.repoName}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {formatRelativeTime(evt.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {evt.message}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Public Organizations (Occupies 1 column if available) */}
        {stats?.organizations && stats.organizations.length > 0 && (
          <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-4 sm:p-6 space-y-4 shadow-sm lg:col-span-1">
            <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
              <Building2 className="size-4 text-blue-500 dark:text-blue-400 shrink-0" /> Organizations ({stats.organizations.length})
            </h4>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {stats.organizations.map((org) => (
                <a
                  key={org.login}
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={org.login}
                  className="p-2 rounded-2xl bg-card border border-border/60 hover:border-blue-500/50 hover:scale-105 transition-all flex items-center gap-2.5 shadow-sm"
                >
                  <img
                    src={org.avatarUrl}
                    alt={org.login}
                    className="size-8 rounded-xl object-cover"
                  />
                  <span className="text-xs font-bold text-foreground pr-1">@{org.login}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contribution Heatmap Calendar (Full Width at Bottom) */}
      <div className="w-full">
        <GitHubContributionHeatmap
          contributions={stats?.contributionData}
          username={stats?.username || username}
          totalContributions={stats?.contributionData?.reduce((s, d) => s + d.count, 0)}
          accountCreatedYear={stats?.createdAt ? new Date(stats.createdAt).getFullYear() : undefined}
          hasFullHistory={
            // GraphQL data covers multiple years; events-only data covers ~90 days max
            // We detect this by checking if any contribution predates 90 days ago
            (() => {
              const days90ago = new Date();
              days90ago.setDate(days90ago.getDate() - 91);
              const cutoff = days90ago.toISOString().split("T")[0];
              return (stats?.contributionData ?? []).some((d) => d.date < cutoff && d.count > 0);
            })()
          }
          onAddToken={onEdit}
        />
      </div>

      {/* Global GitHub Profile Search Dialog */}
      <GitHubProfileSearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        githubToken={githubToken}
      />
    </div>
  );
}
