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
} from "lucide-react";
import { LeetCodeStats, CodeforcesStats, GitHubStats } from "@/types/codingProfile";
import { extractUsername } from "@/services/codingProfileService";
import { cn } from "@/lib/utils";
import { GitHubPortfolioDashboard } from "./GitHubPortfolioDashboard";

// Real Brand Image CDN URLs
const BRAND_LOGOS: Record<string, string> = {
  leetcode: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/leetcode/leetcode-original.svg",
  codeforces: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codeforces/codeforces-original.svg",
  github: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
};

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

const LeetCodeLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.102 17.93a4.522 4.522 0 0 1-1.396 2.372 4.47 4.47 0 0 1-2.991 1.139 4.468 4.468 0 0 1-3.21-1.332L3.109 14.71a4.52 4.52 0 0 1-.954-1.639 4.444 4.444 0 0 1-.035-2.88 4.502 4.502 0 0 1 1.002-1.584l5.378-5.378a4.498 4.498 0 0 1 3.197-1.334c1.201 0 2.331.47 3.178 1.321l.006.006.918.918a.747.747 0 0 1-1.056 1.056l-.918-.918a3.003 3.003 0 0 0-2.128-.885 3.002 3.002 0 0 0-2.134.891L4.21 9.77a3.002 3.002 0 0 0-.668 1.056 2.96 2.96 0 0 0 .023 1.92 3.013 3.013 0 0 0 .637 1.093l5.395 5.397a2.98 2.98 0 0 0 2.14.888 2.98 2.98 0 0 0 1.994-.76 3.015 3.015 0 0 0 .931-1.581.75.75 0 1 1 1.47.337zm2.493-4.577a.75.75 0 0 1-.53-.22L13.111 8.18a.75.75 0 1 1 1.06-1.06l4.954 4.953a.75.75 0 0 1-.53 1.28z" />
  </svg>
);

const CodeforcesLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.5 7.5a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 3 0V9A1.5 1.5 0 0 0 4.5 7.5zm7.5-4.5a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 3 0V4.5A1.5 1.5 0 0 0 12 3zm7.5 7.5a1.5 1.5 0 0 0-1.5 1.5v4.5a1.5 1.5 0 0 0 3 0V12a1.5 1.5 0 0 0-1.5-1.5z" />
  </svg>
);

const GitHubLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const PlatformIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  leetcode: LeetCodeLogo,
  codeforces: CodeforcesLogo,
  github: GitHubLogo,
};

export function PlatformBrandLogo({ platform, className = "size-7" }: { platform: string; className?: string }) {
  const [hasError, setHasError] = React.useState(false);
  const src = BRAND_LOGOS[platform];

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={platform}
        className={cn(className, "object-contain shrink-0 transition-transform duration-200")}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    );
  }

  const Fallback = PlatformIconMap[platform] || LeetCodeLogo;
  return <Fallback className={className} />;
}

interface CFRankConfig {
  name: string;
  minRating: number;
  maxRating: number;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

const getCodeforcesRankConfig = (rating: number): CFRankConfig => {
  if (rating >= 2400) {
    return { name: "Grandmaster", minRating: 2400, maxRating: 3000, textColor: "text-red-500 font-extrabold", bgColor: "bg-red-500/10", borderColor: "border-red-500/30" };
  }
  if (rating >= 2100) {
    return { name: "Master", minRating: 2100, maxRating: 2399, textColor: "text-amber-500 font-bold", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" };
  }
  if (rating >= 1900) {
    return { name: "Candidate Master", minRating: 1900, maxRating: 2099, textColor: "text-purple-500 font-bold", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" };
  }
  if (rating >= 1600) {
    return { name: "Expert", minRating: 1600, maxRating: 1899, textColor: "text-blue-500 font-bold", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" };
  }
  if (rating >= 1400) {
    return { name: "Specialist", minRating: 1400, maxRating: 1599, textColor: "text-cyan-500 font-bold", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/30" };
  }
  if (rating >= 1200) {
    return { name: "Pupil", minRating: 1200, maxRating: 1399, textColor: "text-emerald-500 font-bold", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30" };
  }
  return { name: "Newbie", minRating: 0, maxRating: 1199, textColor: "text-slate-400 font-medium", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/30" };
};

// SVG Donut Chart Component for LeetCode
const LeetCodeDonutChart = ({ easy, medium, hard, total }: { easy: number; medium: number; hard: number; total: number }) => {
  const size = 150;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const totalCalc = total > 0 ? total : 1;
  const easyRatio = easy / totalCalc;
  const mediumRatio = medium / totalCalc;
  const hardRatio = hard / totalCalc;

  const easyDash = easyRatio * circumference;
  const mediumDash = mediumRatio * circumference;
  const hardDash = hardRatio * circumference;

  const easyOffset = 0;
  const mediumOffset = -easyDash;
  const hardOffset = -(easyDash + mediumDash);

  return (
    <div className="relative flex items-center justify-center shrink-0 my-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />

        {easy > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeDasharray={`${easyDash} ${circumference}`}
            strokeDashoffset={easyOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}

        {medium > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${mediumDash} ${circumference}`}
            strokeDashoffset={mediumOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}

        {hard > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f43f5e"
            strokeWidth={strokeWidth}
            strokeDasharray={`${hardDash} ${circumference}`}
            strokeDashoffset={hardOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold text-foreground font-mono tracking-tight">{total}</span>
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">Solved</span>
      </div>
    </div>
  );
};

interface LeetCodeCardProps {
  platform: "leetcode";
  username?: string | null;
  stats?: LeetCodeStats | null;
  error?: string | null;
  onEdit: () => void;
  className?: string;
}

interface CodeforcesCardProps {
  platform: "codeforces";
  handle?: string | null;
  stats?: CodeforcesStats | null;
  error?: string | null;
  onEdit: () => void;
  className?: string;
}

interface GitHubCardProps {
  platform: "github";
  username?: string | null;
  stats?: GitHubStats | null;
  error?: string | null;
  onEdit: () => void;
  className?: string;
  githubToken?: string | null;
}

type CodingProfileCardProps = LeetCodeCardProps | CodeforcesCardProps | GitHubCardProps;

export function CodingProfileCard(props: CodingProfileCardProps) {
  const isLeetCode = props.platform === "leetcode";
  const isCodeforces = props.platform === "codeforces";
  const isGitHub = props.platform === "github";

  if (isGitHub) {
    return (
      <GitHubPortfolioDashboard
        username={(props as GitHubCardProps).username}
        stats={(props as GitHubCardProps).stats}
        error={(props as GitHubCardProps).error}
        onEdit={props.onEdit}
        className={props.className}
        githubToken={(props as GitHubCardProps).githubToken}
      />
    );
  }

  const rawInput = isLeetCode
    ? (props as LeetCodeCardProps).username
    : isCodeforces
      ? (props as CodeforcesCardProps).handle
      : (props as GitHubCardProps).username;
  const usernameOrHandle = extractUsername(rawInput);

  const hasLinked = Boolean(usernameOrHandle && usernameOrHandle.trim().length > 0);

  const profileUrl = isLeetCode
    ? `https://leetcode.com/u/${usernameOrHandle}/`
    : isCodeforces
      ? `https://codeforces.com/profile/${usernameOrHandle}`
      : `https://github.com/${usernameOrHandle}`;

  const platformTitle = isLeetCode ? "LeetCode" : isCodeforces ? "Codeforces" : "GitHub";

  const brandGlow = isLeetCode
    ? "group-hover:border-[#FFA116]/50 group-hover:shadow-[0_0_30px_rgba(255,161,22,0.18)]"
    : isCodeforces
      ? "group-hover:border-[#1F8ACB]/50 group-hover:shadow-[0_0_30px_rgba(31,138,203,0.18)]"
      : "group-hover:border-blue-500/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.18)]";

  const iconBg = isLeetCode
    ? "bg-[#FFA116]/10 border-[#FFA116]/20"
    : isCodeforces
      ? "bg-[#1F8ACB]/10 border-[#1F8ACB]/20"
      : "bg-blue-500/10 border-blue-500/20";

  return (
    <div
      className={cn(
        "group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[380px] w-full max-w-full",
        "bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-2xl hover:-translate-y-1",
        brandGlow,
        props.className
      )}
    >
      <div
        className={cn(
          "absolute -top-32 -right-32 size-64 rounded-full blur-3xl opacity-0 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none",
          isLeetCode ? "bg-[#FFA116]" : isCodeforces ? "bg-[#1F8ACB]" : "bg-blue-500"
        )}
      />

      <div className="space-y-6">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={cn("size-13 sm:size-14 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 shadow-sm p-2.5 shrink-0", iconBg)}>
              <PlatformBrandLogo platform={props.platform} className="size-7 sm:size-8" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
                  {platformTitle}
                </h3>
                {hasLinked && (
                  <Badge variant="outline" className="text-[11px] px-2 py-0.5 rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-bold tracking-wide">
                    <CheckCircle2 className="size-3 mr-1" /> Linked
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[180px] sm:max-w-[240px]">
                {hasLinked ? `@${usernameOrHandle}` : "Not linked"}
              </p>
            </div>
          </div>

          {hasLinked && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors border border-transparent hover:border-border/60 shadow-sm"
              title={`View ${platformTitle} Profile`}
            >
              <ExternalLink className="size-5" />
            </a>
          )}
        </div>

        {/* Card Body */}
        {!hasLinked ? (
          <div className="py-12 px-6 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80 my-2 space-y-4">
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Link your {platformTitle} handle to unlock detailed stats, problem counts, and competitive programming highlights.
            </p>
            <Button
              variant="outline"
              size="default"
              onClick={props.onEdit}
              className="gap-2 text-xs sm:text-sm rounded-2xl font-bold border-primary/30 hover:bg-primary/10 hover:text-primary transition-all px-5 py-2"
            >
              <PlusCircle className="size-4" />
              Connect {platformTitle}
            </Button>
          </div>
        ) : props.error ? (
          <div className="py-6 px-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive my-2 flex items-start gap-3.5">
            <AlertCircle className="size-6 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-bold">Failed to sync profile data</p>
              <p className="opacity-90">{props.error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={props.onEdit}
                className="h-8 px-2 text-xs underline text-destructive hover:bg-destructive/10 mt-2 font-semibold"
              >
                Edit Handle
              </Button>
            </div>
          </div>
        ) : isLeetCode ? (
          (() => {
            const lcStats = (props as LeetCodeCardProps).stats;
            const easy = lcStats?.easy ?? 0;
            const medium = lcStats?.medium ?? 0;
            const hard = lcStats?.hard ?? 0;
            const total = lcStats?.totalSolved ?? (easy + medium + hard);

            const totalCalc = Math.max(1, total);
            const easyPct = Math.round((easy / totalCalc) * 100);
            const mediumPct = Math.round((medium / totalCalc) * 100);
            const hardPct = Math.round((hard / totalCalc) * 100);

            return (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 py-3">
                <LeetCodeDonutChart
                  easy={easy}
                  medium={medium}
                  hard={hard}
                  total={total}
                />

                <div className="flex-1 w-full space-y-4">
                  {/* Easy Row */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
                        Easy
                      </span>
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className="font-extrabold text-foreground text-sm sm:text-base">{easy}</span>
                        <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {easyPct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-emerald-500/15 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700 shadow-sm"
                        style={{ width: `${easyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Medium Row */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                        <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />
                        Medium
                      </span>
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className="font-extrabold text-foreground text-sm sm:text-base">{medium}</span>
                        <span className="text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {mediumPct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-amber-500/15 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-700 shadow-sm"
                        style={{ width: `${mediumPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Hard Row */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                        <span className="size-2.5 rounded-full bg-rose-500 shrink-0" />
                        Hard
                      </span>
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className="font-extrabold text-foreground text-sm sm:text-base">{hard}</span>
                        <span className="text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/20">
                          {hardPct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-rose-500/15 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-700 shadow-sm"
                        style={{ width: `${hardPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : isCodeforces ? (
          (() => {
            const cfStats = (props as CodeforcesCardProps).stats;
            const rating = cfStats?.rating ?? 0;
            const maxRating = cfStats?.maxRating ?? 0;
            const rankConfig = getCodeforcesRankConfig(rating);

            const range = Math.max(1, rankConfig.maxRating - rankConfig.minRating);
            const progress = Math.min(100, Math.max(0, ((rating - rankConfig.minRating) / range) * 100));

            return (
              <div className="space-y-5 pt-2">
                <div className={cn("p-5 sm:p-6 rounded-2xl border flex items-center justify-between gap-4", rankConfig.bgColor, rankConfig.borderColor)}>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Competitive Rank
                    </span>
                    <span className={cn("text-xl sm:text-2xl", rankConfig.textColor)}>
                      {rankConfig.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground tracking-tight block">{rating}</span>
                    <span className="text-xs text-muted-foreground font-semibold">Max Rating: {maxRating}</span>
                  </div>
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-muted/20 border border-border/50">
                  <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-muted-foreground">
                    <span>Rank Progress</span>
                    <span className="font-mono text-foreground font-extrabold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full transition-all duration-700 shadow-sm"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground">Unique Problems Solved</span>
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-primary">{cfStats?.totalSolved ?? 0}</span>
                </div>
              </div>
            );
          })()
        ) : (
          /* Comprehensive GitHub Profile & Stats Display */
          (() => {
            const ghStats = (props as GitHubCardProps).stats;
            const createdYear = ghStats?.createdAt
              ? new Date(ghStats.createdAt).getFullYear()
              : null;

            return (
              <div className="space-y-6 pt-2">
                {/* Profile Header Banner */}
                {(ghStats?.avatarUrl || ghStats?.bio || ghStats?.company || ghStats?.location || ghStats?.blog) && (
                  <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {ghStats?.avatarUrl ? (
                        <img
                          src={ghStats.avatarUrl}
                          alt={ghStats.name || ghStats.username || "GitHub Avatar"}
                          className="size-14 rounded-2xl object-cover border-2 border-blue-500/30 shadow-md shrink-0"
                        />
                      ) : (
                        <div className="size-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl shrink-0">
                          {(ghStats?.name || ghStats?.username || "G").charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
                            {ghStats?.name || ghStats?.username}
                          </h4>
                          {createdYear && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold">
                              Member since {createdYear}
                            </Badge>
                          )}
                        </div>

                        {ghStats?.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-xl">
                            {ghStats.bio}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap pt-1">
                          {ghStats?.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="size-3 text-blue-500 dark:text-blue-400" />
                              {ghStats.company}
                            </span>
                          )}
                          {ghStats?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3 text-blue-500 dark:text-blue-400" />
                              {ghStats.location}
                            </span>
                          )}
                          {ghStats?.blog && (
                            <a
                              href={ghStats.blog.startsWith("http") ? ghStats.blog : `https://${ghStats.blog}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <Globe className="size-3" />
                              {ghStats.blog.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6 High-Impact Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <GitBranch className="size-5 text-blue-500 dark:text-blue-400 mx-auto mb-1.5" />
                    <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono block">
                      {ghStats?.publicRepos ?? 0}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block mt-0.5">Repos</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <Star className="size-5 text-amber-400 mx-auto mb-1.5" />
                    <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono block">
                      {ghStats?.totalStars ?? 0}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mt-0.5">Stars</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                    <GitFork className="size-5 text-cyan-400 mx-auto mb-1.5" />
                    <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono block">
                      {ghStats?.totalForks ?? 0}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mt-0.5">Forks</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <Users className="size-5 text-indigo-400 mx-auto mb-1.5" />
                    <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono block">
                      {ghStats?.followers ?? 0}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mt-0.5">Followers</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <UserCheck className="size-5 text-emerald-400 mx-auto mb-1.5" />
                    <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono block">
                      {ghStats?.following ?? 0}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">Following</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <FileCode className="size-5 text-rose-400 mx-auto mb-1.5" />
                    <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono block">
                      {ghStats?.publicGists ?? 0}
                    </span>
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mt-0.5">Gists</span>
                  </div>
                </div>

                {/* Top Languages Distribution */}
                {ghStats?.topLanguages && ghStats.topLanguages.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Code2 className="size-3.5 text-blue-500 dark:text-blue-400 shrink-0" /> Programming Languages & Stack
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-semibold w-fit">
                        Top {ghStats.topLanguages.length} Languages
                      </span>
                    </div>

                    {/* Multi-color language progress bar */}
                    <div className="h-3 rounded-full bg-muted/60 overflow-hidden flex w-full">
                      {ghStats.topLanguages.map((item) => (
                        <div
                          key={item.language}
                          title={`${item.language}: ${item.percentage}%`}
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: getLanguageColor(item.language),
                          }}
                          className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                        />
                      ))}
                    </div>

                    {/* Language badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {ghStats.topLanguages.map((item) => (
                        <div
                          key={item.language}
                          className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-card border border-border/60 text-xs font-semibold min-w-0"
                        >
                          <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                            <span
                              className="size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: getLanguageColor(item.language) }}
                            />
                            <span className="text-foreground truncate">{item.language}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono font-bold shrink-0">
                            {item.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Featured Repositories */}
                {ghStats?.topRepos && ghStats.topRepos.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="size-3.5 text-blue-500 dark:text-blue-400" /> Featured Repositories
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ghStats.topRepos.map((repo) => (
                        <a
                          key={repo.name}
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/repo p-4 rounded-2xl bg-card border border-border/70 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-extrabold text-sm text-foreground group-hover/repo:text-sky-400 transition-colors truncate">
                                {repo.name}
                              </h5>
                            </div>

                            {repo.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                {repo.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40 font-mono">
                            {repo.language ? (
                              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                <span
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: getLanguageColor(repo.language) }}
                                />
                                {repo.language}
                              </span>
                            ) : (
                              <span />
                            )}

                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Star className="size-3 text-amber-400 fill-amber-400/20" />
                                {repo.stars}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitFork className="size-3 text-cyan-400" />
                                {repo.forks}
                              </span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
