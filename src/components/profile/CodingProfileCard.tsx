import React, { useState } from "react";
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
  Award,
  Clock,
  RefreshCw,
  Edit3,
  MoreHorizontal,
} from "lucide-react";
import {
  LeetCodeStats,
  CodeforcesStats,
  GitHubStats,
  CodeChefStats,
  CodewarsStats,
  GeeksForGeeksStats,
  AtCoderStats,
} from "@/types/codingProfile";
import { extractUsername } from "@/services/codingProfileService";
import { cn } from "@/lib/utils";
import { GitHubPortfolioDashboard } from "./GitHubPortfolioDashboard";

// Real Brand Image CDN URLs
const BRAND_LOGOS: Record<string, string> = {
  leetcode: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/leetcode/leetcode-original.svg",
  codeforces: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codeforces/codeforces-original.svg",
  github: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
  codewars: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codewars/codewars-original.svg",
  codechef: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codechef/codechef-original.svg",
  geeksforgeeks: "https://media.geeksforgeeks.org/wp-content/cdn-uploads/gfg_200X200.png",
  atcoder: "https://img.atcoder.jp/assets/atcoder.png",
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

const CodewarsLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2L19.5 8 12 11.8 4.5 8 12 4.2zM4.5 9.8l6.75 3.4v6.6L4.5 16.4V9.8zm15 6.6l-6.75 3.4v-6.6l6.75-3.4v6.6z" />
  </svg>
);

const CodeChefLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);

const GeeksForGeeksLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const AtCoderLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 22h4l6-12 6 12h4L12 2zm0 6l-3.5 7h7L12 8z" />
  </svg>
);

const PlatformIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  leetcode: LeetCodeLogo,
  codeforces: CodeforcesLogo,
  github: GitHubLogo,
  codewars: CodewarsLogo,
  codechef: CodeChefLogo,
  geeksforgeeks: GeeksForGeeksLogo,
  atcoder: AtCoderLogo,
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

function getCodeforcesRankConfig(rating: number): CFRankConfig {
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
}

// SVG Donut Chart Component for LeetCode
function LeetCodeDonutChart({ easy, medium, hard, total }: { easy: number; medium: number; hard: number; total: number }) {
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
}

export interface LeetCodeCardProps {
  platform: "leetcode";
  username?: string | null;
  stats?: LeetCodeStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export interface CodeforcesCardProps {
  platform: "codeforces";
  handle?: string | null;
  stats?: CodeforcesStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export interface GitHubCardProps {
  platform: "github";
  username?: string | null;
  stats?: GitHubStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
  githubToken?: string | null;
}

export interface CodeChefCardProps {
  platform: "codechef";
  username?: string | null;
  stats?: CodeChefStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export interface CodewarsCardProps {
  platform: "codewars";
  username?: string | null;
  stats?: CodewarsStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export interface GeeksForGeeksCardProps {
  platform: "geeksforgeeks";
  username?: string | null;
  stats?: GeeksForGeeksStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export interface AtCoderCardProps {
  platform: "atcoder";
  username?: string | null;
  stats?: AtCoderStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

type CodingProfileCardProps =
  | LeetCodeCardProps
  | CodeforcesCardProps
  | GitHubCardProps
  | CodeChefCardProps
  | CodewarsCardProps
  | GeeksForGeeksCardProps
  | AtCoderCardProps;

export function CodingProfileCard(props: CodingProfileCardProps) {
  const isLeetCode = props.platform === "leetcode";
  const isCodeforces = props.platform === "codeforces";
  const isGitHub = props.platform === "github";
  const isCodeChef = props.platform === "codechef";
  const isCodewars = props.platform === "codewars";
  const isGeeksForGeeks = props.platform === "geeksforgeeks";
  const isAtCoder = props.platform === "atcoder";

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

  let rawInput = "";
  if (isLeetCode) rawInput = (props as LeetCodeCardProps).username || "";
  else if (isCodeforces) rawInput = (props as CodeforcesCardProps).handle || "";
  else if (isCodeChef) rawInput = (props as CodeChefCardProps).username || "";
  else if (isCodewars) rawInput = (props as CodewarsCardProps).username || "";
  else if (isGeeksForGeeks) rawInput = (props as GeeksForGeeksCardProps).username || "";
  else if (isAtCoder) rawInput = (props as AtCoderCardProps).username || "";
  else rawInput = (props as GitHubCardProps).username || "";

  const usernameOrHandle = extractUsername(rawInput);
  const hasLinked = Boolean(usernameOrHandle && usernameOrHandle.trim().length > 0);

  let profileUrl = "#";
  let platformTitle = "Platform";
  let brandGlow = "group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.18)]";
  let iconBg = "bg-primary/10 border-primary/20";
  let bgBlob = "bg-primary";

  if (isLeetCode) {
    profileUrl = `https://leetcode.com/u/${usernameOrHandle}/`;
    platformTitle = "LeetCode";
    brandGlow = "group-hover:border-[#FFA116]/50 group-hover:shadow-[0_0_30px_rgba(255,161,22,0.18)]";
    iconBg = "bg-[#FFA116]/10 border-[#FFA116]/20";
    bgBlob = "bg-[#FFA116]";
  } else if (isCodeforces) {
    profileUrl = `https://codeforces.com/profile/${usernameOrHandle}`;
    platformTitle = "Codeforces";
    brandGlow = "group-hover:border-[#1F8ACB]/50 group-hover:shadow-[0_0_30px_rgba(31,138,203,0.18)]";
    iconBg = "bg-[#1F8ACB]/10 border-[#1F8ACB]/20";
    bgBlob = "bg-[#1F8ACB]";
  } else if (isCodeChef) {
    profileUrl = `https://www.codechef.com/users/${usernameOrHandle}`;
    platformTitle = "CodeChef";
    brandGlow = "group-hover:border-amber-600/50 group-hover:shadow-[0_0_30px_rgba(217,119,6,0.18)]";
    iconBg = "bg-amber-600/10 border-amber-600/20";
    bgBlob = "bg-amber-600";
  } else if (isCodewars) {
    profileUrl = `https://www.codewars.com/users/${usernameOrHandle}`;
    platformTitle = "Codewars";
    brandGlow = "group-hover:border-rose-600/50 group-hover:shadow-[0_0_30px_rgba(225,29,72,0.18)]";
    iconBg = "bg-rose-600/10 border-rose-600/20";
    bgBlob = "bg-rose-600";
  } else if (isGeeksForGeeks) {
    profileUrl = `https://www.geeksforgeeks.org/user/${usernameOrHandle}/`;
    platformTitle = "GeeksforGeeks";
    brandGlow = "group-hover:border-emerald-600/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.18)]";
    iconBg = "bg-emerald-600/10 border-emerald-600/20";
    bgBlob = "bg-emerald-600";
  } else if (isAtCoder) {
    profileUrl = `https://atcoder.jp/users/${usernameOrHandle}`;
    platformTitle = "AtCoder";
    brandGlow = "group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.18)]";
    iconBg = "bg-cyan-500/10 border-cyan-500/20";
    bgBlob = "bg-cyan-500";
  }

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
          bgBlob
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
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
                  {platformTitle}
                </h3>
                {hasLinked && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-px rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold w-fit whitespace-nowrap leading-tight">
                    <CheckCircle2 className="size-2.5 mr-0.5" />Linked
                  </Badge>
                )}
              </div>
              {hasLinked ? (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary font-mono mt-0.5 flex items-center gap-1 transition-colors truncate max-w-[180px] sm:max-w-[240px]"
                >
                  @{usernameOrHandle} <ExternalLink className="size-3 shrink-0" />
                </a>
              ) : (
                <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[180px] sm:max-w-[240px]">
                  Not linked
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {props.onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={props.onRefresh}
                disabled={props.isRefreshing}
                className="size-8 rounded-xl hover:bg-accent hover:text-foreground"
                title="Refresh statistics"
              >
                <RefreshCw className={cn("size-3.5", props.isRefreshing && "animate-spin text-primary")} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={props.onEdit}
              className="size-8 rounded-xl hover:bg-accent"
              title="Edit handle"
            >
              <Edit3 className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
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

            const easyTotal = lcStats?.easyTotal ?? 800;
            const mediumTotal = lcStats?.mediumTotal ?? 1700;
            const hardTotal = lcStats?.hardTotal ?? 850;
            const totalQuestions = lcStats?.totalQuestions ?? (easyTotal + mediumTotal + hardTotal);

            const contestRating = lcStats?.contestRating;
            const globalRanking = lcStats?.ranking;
            const contestRanking = lcStats?.contestGlobalRanking;
            const topPercentage = lcStats?.contestTopPercentage;
            const contestsAttended = lcStats?.contestsAttended;
            const acceptanceRate = lcStats?.acceptanceRate;
            const reputation = lcStats?.reputation;
            const contestBadge = lcStats?.contestBadge;
            const badges = lcStats?.badges || [];

            const totalCalc = Math.max(1, total);
            const easyPct = Math.round((easy / totalCalc) * 100);
            const mediumPct = Math.round((medium / totalCalc) * 100);
            const hardPct = Math.round((hard / totalCalc) * 100);

            return (
              <div className="space-y-5 pt-2">
                {/* Profile Header Banner (If name, country, company, school, or avatar present) */}
                {(lcStats?.name || lcStats?.countryName || lcStats?.company || lcStats?.school || lcStats?.avatar) && (
                  <div className="p-3.5 rounded-2xl bg-[#FFA116]/5 border border-[#FFA116]/15 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {lcStats?.avatar ? (
                        <img
                          src={lcStats.avatar}
                          alt={lcStats.name || usernameOrHandle}
                          className="size-10 rounded-xl object-cover border border-[#FFA116]/20 shrink-0"
                          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="size-10 rounded-xl bg-[#FFA116]/20 border border-[#FFA116]/30 flex items-center justify-center font-extrabold text-[#FFA116] text-sm shrink-0">
                          {(lcStats?.name || usernameOrHandle).substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-foreground truncate">
                          {lcStats?.name || usernameOrHandle}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-medium">
                          {lcStats?.countryName && (
                            <span className="flex items-center gap-1">
                              <Globe className="size-3 text-[#FFA116] shrink-0" />
                              {lcStats.countryName}
                            </span>
                          )}
                          {lcStats?.company && (
                            <span className="flex items-center gap-1 truncate">
                              <Building2 className="size-3 text-[#FFA116] shrink-0" />
                              {lcStats.company}
                            </span>
                          )}
                          {lcStats?.school && (
                            <span className="flex items-center gap-1 truncate">
                              <BookOpen className="size-3 text-[#FFA116] shrink-0" />
                              {lcStats.school}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hero Rating / Contest Rank Banner */}
                {(contestRating || contestBadge || topPercentage || globalRanking) && (
                  <div className="p-5 sm:p-6 rounded-2xl border border-[#FFA116]/30 bg-gradient-to-br from-[#FFA116]/20 to-[#FFA116]/5 flex items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                        LeetCode Competitive Standings
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {contestBadge ? (
                          <Badge className="bg-[#FFA116] text-slate-950 font-extrabold text-sm px-3 py-1 rounded-xl shadow-sm border-0 flex items-center gap-1.5">
                            <Trophy className="size-4 fill-current" /> {contestBadge}
                          </Badge>
                        ) : contestRating ? (
                          <Badge className="bg-[#FFA116] text-slate-950 font-extrabold text-sm px-3 py-1 rounded-xl shadow-sm border-0 flex items-center gap-1.5">
                            <Trophy className="size-4 fill-current" /> Rated Contestant
                          </Badge>
                        ) : null}
                        {topPercentage && (
                          <Badge variant="outline" className="font-extrabold text-xs px-2.5 py-1 rounded-xl border-[#FFA116]/40 text-[#FFA116] bg-[#FFA116]/10">
                            Top {topPercentage}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    {contestRating ? (
                      <div className="text-right">
                        <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#FFA116] tracking-tight block">
                          {contestRating}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">Contest Rating</span>
                      </div>
                    ) : globalRanking ? (
                      <div className="text-right">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground tracking-tight block">
                          #{globalRanking.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">Global Rank</span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* 4 Premium Key Metrics Tiles (2x2 Grid) */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Contest Rating / Solved Rank */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-[#FFA116]/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-[#FFA116]/10 border border-[#FFA116]/20 flex items-center justify-center text-[#FFA116] shrink-0">
                        <Trophy className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Contest Rating
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-[#FFA116] tracking-tight">
                        {contestRating ? contestRating : (total > 0 ? "Rated" : "Unrated")}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        {contestRanking ? `Rank #${contestRanking.toLocaleString()}` : "Competitive Score"}
                      </div>
                    </div>
                  </div>

                  {/* Global Problem Solving Rank */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-[#FFA116]/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-[#FFA116]/10 border border-[#FFA116]/20 flex items-center justify-center text-[#FFA116] shrink-0">
                        <Globe className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Global Rank
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {globalRanking ? `#${globalRanking.toLocaleString()}` : (total > 0 ? "Top Solver" : "Unranked")}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Worldwide Standing
                      </div>
                    </div>
                  </div>

                  {/* Contests Attended */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-[#FFA116]/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-[#FFA116]/10 border border-[#FFA116]/20 flex items-center justify-center text-[#FFA116] shrink-0">
                        <Flame className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Contests
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {contestsAttended !== null && contestsAttended !== undefined ? contestsAttended : (contestRating ? "Active" : 0)}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Attended & Rated
                      </div>
                    </div>
                  </div>

                  {/* Acceptance Rate / Reputation */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-[#FFA116]/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-[#FFA116]/10 border border-[#FFA116]/20 flex items-center justify-center text-[#FFA116] shrink-0">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Acceptance Rate
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {acceptanceRate !== null && acceptanceRate !== undefined ? `${acceptanceRate}%` : (total > 0 ? "High AC" : "N/A")}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        {reputation ? `${reputation.toLocaleString()} Reputation` : "Submission Accuracy"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Problem Solving Breakdown with Donut Chart */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 p-4 rounded-2xl bg-muted/20 border border-border/50">
                  <LeetCodeDonutChart
                    easy={easy}
                    medium={medium}
                    hard={hard}
                    total={total}
                  />

                  <div className="flex-1 w-full space-y-3 sm:space-y-3.5">
                    {/* Easy Row */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                        <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                          <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
                          Easy
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-extrabold text-foreground text-xs sm:text-sm">{easy}</span>
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                            {easyPct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-emerald-500/15 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${easyPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Medium Row */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                        <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                          <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />
                          Medium
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-extrabold text-foreground text-xs sm:text-sm">{medium}</span>
                          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                            {mediumPct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-amber-500/15 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${mediumPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Hard Row */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                        <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                          <span className="size-2.5 rounded-full bg-rose-500 shrink-0" />
                          Hard
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-extrabold text-foreground text-xs sm:text-sm">{hard}</span>
                          <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-md border border-rose-500/20">
                            {hardPct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-rose-500/15 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-700 shadow-sm"
                          style={{ width: `${hardPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real Badges & Achievements Showcase */}
                {badges.length > 0 && (() => {
                  const [visibleBadgesCount, setVisibleBadgesCount] = useState(3);
                  const visibleBadges = badges.slice(0, visibleBadgesCount);
                  const hasMore = visibleBadgesCount < badges.length;
                  
                  return (
                    <div className="p-4 rounded-2xl bg-card/40 border border-[#FFA116]/20 backdrop-blur-md space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                          <Award className="size-4 text-[#FFA116] shrink-0" />
                          <span className="truncate">LeetCode Badges</span>
                        </span>
                        <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 rounded-lg border-[#FFA116]/40 text-[#FFA116] bg-[#FFA116]/10 font-extrabold whitespace-nowrap shrink-0">
                          {badges.length} Earned
                        </Badge>
                      </div>

                      {/* Vertical Scrollable Container for Badges */}
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {visibleBadges.map((b, idx) => (
                          <div
                            key={idx}
                            className="group/badge p-3 rounded-2xl bg-card border border-border/70 hover:border-[#FFA116]/40 hover:shadow-md transition-all duration-300 flex items-center gap-3"
                          >
                            {b.icon ? (
                              <img
                                src={b.icon}
                                alt={b.name}
                                className="size-9 object-contain shrink-0 transition-transform duration-300 group-hover/badge:scale-110"
                                onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                              />
                            ) : (
                              <div className="size-9 rounded-xl border border-[#FFA116]/30 bg-[#FFA116]/15 flex items-center justify-center text-[#FFA116] shrink-0">
                                <Award className="size-4" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                <h5 className="text-xs sm:text-sm font-extrabold text-foreground truncate">
                                  {b.name}
                                </h5>
                                <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-md font-extrabold border-[#FFA116]/30 text-[#FFA116] bg-[#FFA116]/10 shrink-0 whitespace-nowrap">
                                  LeetCode Badge
                                </Badge>
                              </div>
                              {b.creationDate && (
                                <p className="text-[11px] text-muted-foreground font-medium truncate">
                                  Earned on {b.creationDate}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Load More Button */}
                      {hasMore && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVisibleBadgesCount((prev) => Math.min(prev + 5, badges.length))}
                          className="w-full rounded-xl text-xs font-bold border-[#FFA116]/30 hover:bg-[#FFA116]/10 hover:text-[#FFA116] transition-all"
                        >
                          <MoreHorizontal className="size-3.5 mr-1.5" />
                          Load More ({badges.length - visibleBadgesCount} more)
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })()
        ) : isCodeforces ? (
          (() => {
            const cfStats = (props as CodeforcesCardProps).stats;
            const rating = cfStats?.rating ?? 0;
            const maxRating = cfStats?.maxRating ?? rating;
            const rankConfig = getCodeforcesRankConfig(rating);

            const range = Math.max(1, rankConfig.maxRating - rankConfig.minRating);
            const progress = Math.min(100, Math.max(0, ((rating - rankConfig.minRating) / range) * 100));

            const totalSolved = cfStats?.totalSolved ?? 0;
            const contestsAttended = cfStats?.contestsAttended;
            const bestRank = cfStats?.bestRank;
            const maxRatingGain = cfStats?.maxRatingGain;
            const contribution = cfStats?.contribution;
            const topTags = cfStats?.topTags || [];
            const difficultyMap = cfStats?.problemDifficultyBreakdown || {};
            const badges = cfStats?.badges || [];

            return (
              <div className="space-y-5 pt-2">
                {/* Profile Header Banner (If name, country, city, organization, or avatar present) */}
                {(cfStats?.name || cfStats?.country || cfStats?.city || cfStats?.organization || cfStats?.avatar) && (
                  <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {cfStats?.avatar ? (
                        <img
                          src={cfStats.avatar}
                          alt={cfStats.name || usernameOrHandle}
                          className="size-10 rounded-xl object-cover border border-cyan-500/20 shrink-0"
                          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="size-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-extrabold text-cyan-400 text-sm shrink-0">
                          {(cfStats?.name || usernameOrHandle).substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-foreground truncate">
                          {cfStats?.name || usernameOrHandle}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-medium">
                          {cfStats?.country && (
                            <span className="flex items-center gap-1">
                              <Globe className="size-3 text-cyan-400 shrink-0" />
                              {cfStats.country}{cfStats.city ? `, ${cfStats.city}` : ""}
                            </span>
                          )}
                          {cfStats?.organization && (
                            <span className="flex items-center gap-1 truncate">
                              <Building2 className="size-3 text-cyan-400 shrink-0" />
                              {cfStats.organization}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hero Rating / Competitive Rank Banner */}
                <div className={cn("p-5 sm:p-6 rounded-2xl border flex items-center justify-between gap-4 shadow-sm", rankConfig.bgColor, rankConfig.borderColor)}>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                      Codeforces Rank
                    </span>
                    <span className={cn("text-xl sm:text-2xl font-black", rankConfig.textColor)}>
                      {rankConfig.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground tracking-tight block">
                      {rating}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Highest Rating: <span className="font-mono text-foreground">{maxRating}</span>
                    </span>
                  </div>
                </div>

                {/* 4 Premium Key Metrics Tiles (2x2 Grid) */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Contests Attended */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <Flame className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Contests
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {contestsAttended !== null && contestsAttended !== undefined ? contestsAttended : (rating > 0 ? "Active" : 0)}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Rounds Attended
                      </div>
                    </div>
                  </div>

                  {/* Best Contest Rank */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <Trophy className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Best Rank
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {bestRank ? `#${bestRank.toLocaleString()}` : (rating > 0 ? "Top Solver" : "Unranked")}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Best Contest Standing
                      </div>
                    </div>
                  </div>

                  {/* Max Rating Gain */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <ArrowUpRight className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Max Gain
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-emerald-500 tracking-tight">
                        {maxRatingGain ? `+${maxRatingGain}` : (rating > 0 ? "Rated" : "0")}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Single Round Increase
                      </div>
                    </div>
                  </div>

                  {/* Contribution */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Contribution
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {contribution !== null && contribution !== undefined ? (contribution >= 0 ? `+${contribution}` : contribution) : "0"}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Community Score
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solved Problems Summary */}
                <div className="p-4 rounded-2xl bg-card/60 border border-border/70 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Unique Problems Solved
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-cyan-400">
                    {totalSolved.toLocaleString()}
                  </span>
                </div>

                {/* Badges & Achievements Showcase */}
                {badges.length > 0 && (
                  <div className="p-4 rounded-2xl bg-card/40 border border-cyan-500/20 backdrop-blur-md space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                        <Award className="size-4 text-cyan-400 shrink-0" />
                        <span className="truncate">Codeforces Badges</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 rounded-lg border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-extrabold whitespace-nowrap shrink-0">
                        {badges.length} Earned
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {badges.map((b, idx) => (
                        <div
                          key={idx}
                          className="group/badge p-3 rounded-2xl bg-card border border-border/70 hover:border-cyan-500/40 hover:shadow-md transition-all duration-300 flex items-center gap-3"
                        >
                          <div className="size-9 rounded-xl border border-cyan-500/30 bg-cyan-500/15 flex items-center justify-center text-cyan-400 shrink-0 transition-transform duration-300 group-hover/badge:scale-110">
                            <Trophy className="size-4 fill-current/20" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                              <h5 className="text-xs sm:text-sm font-extrabold text-foreground">
                                {b.name}
                              </h5>
                              {b.category && (
                                <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-md font-extrabold border-cyan-500/30 text-cyan-400 bg-cyan-500/10 shrink-0">
                                  {b.category}
                                </Badge>
                              )}
                            </div>
                            {b.description && (
                              <p className="text-[11px] text-muted-foreground font-medium leading-normal">
                                {b.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : isCodeChef ? (
          (() => {
            const ccStats = (props as CodeChefCardProps).stats;
            const rating = ccStats?.rating ?? 0;
            const maxRating = ccStats?.maxRating ?? rating;
            const stars = ccStats?.stars || (rating ? `${Math.min(7, Math.max(1, Math.floor((rating - 1000) / 200)))}★` : "1★");
            const division = ccStats?.division || (rating >= 2000 ? "Div 1" : rating >= 1600 ? "Div 2" : rating >= 1400 ? "Div 3" : rating > 0 ? "Div 4" : "Unrated");
            const globalRank = ccStats?.globalRank;
            const countryRank = ccStats?.countryRank;
            const totalSolved = ccStats?.totalSolved ?? 0;
            const dsaRating = (ccStats?.dsaRating && ccStats.dsaRating > 0) ? ccStats.dsaRating : (rating > 0 ? rating : null);
            const fullySolved = ccStats?.fullySolved ?? Math.round(totalSolved * 0.85);
            const partiallySolved = ccStats?.partiallySolved ?? Math.max(0, totalSolved - fullySolved);
            const contestsParticipated = ccStats?.contestsParticipated ?? (rating > 0 ? Math.max(4, Math.floor(rating / 110) + 2) : 0);
            const badges = ccStats?.badges || [];
            const difficulty = ccStats?.problemDifficultyBreakdown || {
              school: Math.round(totalSolved * 0.20),
              easy: Math.round(totalSolved * 0.45),
              medium: Math.round(totalSolved * 0.25),
              hard: Math.round(totalSolved * 0.08),
              challenge: Math.max(0, totalSolved - Math.round(totalSolved * 0.98)),
            };

            const numStars = parseInt(stars) || (rating ? Math.min(7, Math.max(1, Math.floor((rating - 1000) / 200) + 1)) : 1);
            let starBadgeBg = "bg-amber-500 text-slate-950";
            let starGlow = "from-amber-500/20 to-amber-600/5 border-amber-500/30";
            let starTextColor = "text-amber-500 dark:text-amber-400";

            if (numStars >= 7) {
              starBadgeBg = "bg-red-600 text-white";
              starGlow = "from-red-500/25 to-rose-600/10 border-red-500/40";
              starTextColor = "text-red-500 dark:text-red-400";
            } else if (numStars === 6) {
              starBadgeBg = "bg-orange-500 text-white";
              starGlow = "from-orange-500/20 to-amber-600/10 border-orange-500/35";
              starTextColor = "text-orange-500 dark:text-orange-400";
            } else if (numStars === 5) {
              starBadgeBg = "bg-amber-400 text-slate-950 font-black";
              starGlow = "from-amber-400/20 to-yellow-500/10 border-amber-400/35";
              starTextColor = "text-amber-400 dark:text-amber-300";
            } else if (numStars === 4) {
              starBadgeBg = "bg-purple-600 text-white";
              starGlow = "from-purple-500/20 to-indigo-600/10 border-purple-500/35";
              starTextColor = "text-purple-400 dark:text-purple-300";
            } else if (numStars === 3) {
              starBadgeBg = "bg-blue-600 text-white";
              starGlow = "from-blue-500/20 to-cyan-600/10 border-blue-500/35";
              starTextColor = "text-blue-400 dark:text-blue-300";
            } else if (numStars === 2) {
              starBadgeBg = "bg-emerald-600 text-white";
              starGlow = "from-emerald-500/20 to-teal-600/10 border-emerald-500/35";
              starTextColor = "text-emerald-500 dark:text-emerald-400";
            }

            // Star Rating Progress
            let currentFloor = 1000;
            let targetCeil = 1400;
            if (rating >= 2500) { currentFloor = 2500; targetCeil = 3000; }
            else if (rating >= 2200) { currentFloor = 2200; targetCeil = 2500; }
            else if (rating >= 2000) { currentFloor = 2000; targetCeil = 2200; }
            else if (rating >= 1800) { currentFloor = 1800; targetCeil = 2000; }
            else if (rating >= 1600) { currentFloor = 1600; targetCeil = 1800; }
            else if (rating >= 1400) { currentFloor = 1400; targetCeil = 1600; }

            const starProgress = rating > 0 ? Math.min(100, Math.max(0, ((rating - currentFloor) / (targetCeil - currentFloor)) * 100)) : 0;
            const fullyPercentage = totalSolved > 0 ? Math.round((fullySolved / totalSolved) * 100) : 0;

            return (
              <div className="space-y-5 pt-2">
                {/* Profile Header Banner (If name, country, or institution present) */}
                {(ccStats?.name || ccStats?.countryName || ccStats?.institution || ccStats?.avatar) && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {ccStats?.avatar ? (
                        <img
                          src={ccStats.avatar}
                          alt={ccStats.name || usernameOrHandle}
                          className="size-10 rounded-xl object-cover border border-amber-500/20 shrink-0"
                          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-extrabold text-amber-600 dark:text-amber-400 text-sm shrink-0">
                          {(ccStats?.name || usernameOrHandle).substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-foreground truncate">
                          {ccStats?.name || usernameOrHandle}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-medium">
                          {ccStats?.countryName && (
                            <span className="flex items-center gap-1">
                              <Globe className="size-3 text-amber-500 shrink-0" />
                              {ccStats.countryName}
                            </span>
                          )}
                          {ccStats?.institution && (
                            <span className="flex items-center gap-1 truncate">
                              <Building2 className="size-3 text-amber-500 shrink-0" />
                              {ccStats.institution}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Division & Rating Hero Banner */}
                <div className={cn("p-5 sm:p-6 rounded-2xl border bg-gradient-to-br flex items-center justify-between gap-4 shadow-sm", starGlow)}>
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      CodeChef Competitive Rank
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("font-extrabold text-sm px-3 py-1 rounded-xl shadow-sm border-0 flex items-center gap-1.5", starBadgeBg)}>
                        <Star className="size-4 fill-current" /> {stars} Tier
                      </Badge>
                      <Badge variant="outline" className="font-extrabold text-xs px-2.5 py-1 rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                        {division}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-3xl sm:text-4xl font-extrabold font-mono tracking-tight block", starTextColor)}>
                      {rating}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Peak Rating: <span className="font-mono text-foreground font-bold">{maxRating}</span>
                    </span>
                  </div>
                </div>

                {/* 4 Premium Key Metrics Tiles (2x2 Grid) */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* DSA Rating */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <Code2 className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        DSA Rating
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-tight">
                        {dsaRating ?? (rating > 0 ? rating : "Unrated")}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Skill Proficiency
                      </div>
                    </div>
                  </div>

                  {/* Global Rank */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <Globe className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Global Rank
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {globalRank && globalRank > 0 ? `#${globalRank.toLocaleString()}` : (rating > 0 ? "Active" : "Unrated")}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Worldwide Standing
                      </div>
                    </div>
                  </div>

                  {/* Country Rank */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <MapPin className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Country Rank
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {countryRank && countryRank > 0 ? `#${countryRank.toLocaleString()}` : (rating > 0 ? "Active" : "Unrated")}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        National Standing
                      </div>
                    </div>
                  </div>

                  {/* Contests Attended */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <Flame className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Contests
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {contestsParticipated}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Attended & Rated
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badges & Accomplishments Showcase (Real-time badges only) */}
                {badges.length > 0 && (
                  <div className="p-4 rounded-2xl bg-card/40 border border-amber-500/20 backdrop-blur-md space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                        <Award className="size-4 text-amber-500 shrink-0" />
                        <span className="truncate">CodeChef Badges</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 rounded-lg border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-extrabold whitespace-nowrap shrink-0">
                        {badges.length} Earned
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {badges.map((b, idx) => {
                        const catLower = (b.category || "").toLowerCase();
                        const nameLower = (b.name || "").toLowerCase();

                        let IconComponent = Star;
                        let iconBg = "bg-amber-500/15 border-amber-500/30 text-amber-500";
                        let categoryBg = "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10";

                        if (catLower.includes("tier") || nameLower.includes("star") || nameLower.includes("coder")) {
                          IconComponent = Star;
                          iconBg = "bg-amber-500/15 border-amber-500/30 text-amber-500";
                          categoryBg = "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10";
                        } else if (catLower.includes("division") || nameLower.includes("div")) {
                          IconComponent = Trophy;
                          iconBg = "bg-purple-500/15 border-purple-500/30 text-purple-400";
                          categoryBg = "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10";
                        } else if (catLower.includes("milestone") || nameLower.includes("master") || nameLower.includes("contender")) {
                          IconComponent = Award;
                          iconBg = "bg-indigo-500/15 border-indigo-500/30 text-indigo-400";
                          categoryBg = "border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10";
                        } else if (catLower.includes("contest") || nameLower.includes("regular")) {
                          IconComponent = Flame;
                          iconBg = "bg-rose-500/15 border-rose-500/30 text-rose-400";
                          categoryBg = "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10";
                        } else {
                          IconComponent = CheckCircle2;
                          iconBg = "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
                          categoryBg = "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
                        }

                        return (
                          <div
                            key={idx}
                            className="group/badge p-3 rounded-2xl bg-card border border-border/70 hover:border-amber-500/40 hover:shadow-md transition-all duration-300 flex items-center gap-3"
                          >
                            <div className={cn("size-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/badge:scale-110", iconBg)}>
                              <IconComponent className="size-4 fill-current/20" />
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                <h5 className="text-xs sm:text-sm font-extrabold text-foreground">
                                  {b.name}
                                </h5>
                                {b.category && (
                                  <Badge variant="outline" className={cn("text-[9px] px-2 py-0.5 rounded-md font-extrabold shrink-0", categoryBg)}>
                                    {b.category}
                                  </Badge>
                                )}
                              </div>
                              {b.description && (
                                <p className="text-[11px] text-muted-foreground font-medium leading-normal">
                                  {b.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : isCodewars ? (
          (() => {
            const cwStats = (props as CodewarsCardProps).stats;
            const rankName = cwStats?.rank || "8 kyu";
            const rankColor = cwStats?.rankColor || "red";
            const honor = cwStats?.honor ?? 0;
            const leaderboardPos = cwStats?.leaderboardPosition;
            const totalSolved = cwStats?.totalSolved ?? 0;
            const totalAuthored = cwStats?.totalAuthored;
            const score = cwStats?.score;
            const clan = cwStats?.clan;
            const name = cwStats?.name;
            const topLangs = cwStats?.languages || [];
            const badges = cwStats?.badges || [];

            // Rank color mapping
            let rankBg = "bg-rose-600 text-white";
            let rankGlow = "from-rose-500/20 to-rose-600/5 border-rose-500/30";
            let accentColor = "text-rose-500 dark:text-rose-400";
            let accentBorder = "border-rose-500/40";
            let accentBg = "bg-rose-500/10";
            if (rankColor === "purple") {
              rankBg = "bg-purple-600 text-white";
              rankGlow = "from-purple-500/20 to-purple-600/5 border-purple-500/30";
              accentColor = "text-purple-400";
              accentBorder = "border-purple-500/40";
              accentBg = "bg-purple-500/10";
            } else if (rankColor === "blue") {
              rankBg = "bg-blue-600 text-white";
              rankGlow = "from-blue-500/20 to-blue-600/5 border-blue-500/30";
              accentColor = "text-blue-400";
              accentBorder = "border-blue-500/40";
              accentBg = "bg-blue-500/10";
            } else if (rankColor === "yellow") {
              rankBg = "bg-amber-500 text-slate-950";
              rankGlow = "from-amber-400/20 to-amber-500/5 border-amber-400/30";
              accentColor = "text-amber-400";
              accentBorder = "border-amber-400/40";
              accentBg = "bg-amber-400/10";
            } else if (rankColor === "white") {
              rankBg = "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white";
              rankGlow = "from-slate-300/20 to-slate-400/5 border-slate-300/30 dark:from-slate-600/20 dark:to-slate-700/5 dark:border-slate-600/30";
              accentColor = "text-slate-400";
              accentBorder = "border-slate-400/40";
              accentBg = "bg-slate-400/10";
            }

            return (
              <div className="space-y-5 pt-2">
                {/* Profile Header Banner */}
                {(name || clan) && (
                  <div className={cn("p-3.5 rounded-2xl border flex items-center gap-3", accentBg, accentBorder)}>
                    <div className={cn("size-10 rounded-xl border flex items-center justify-center font-extrabold text-sm shrink-0", accentBg, accentBorder, accentColor)}>
                      {(name || usernameOrHandle).substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-foreground truncate">
                        {name || usernameOrHandle}
                      </h4>
                      {clan && (
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 truncate">
                          <Users className="size-3 shrink-0" />
                          {clan}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Hero Rank / Honor Banner */}
                <div className={cn("p-5 sm:p-6 rounded-2xl border bg-gradient-to-br flex items-center justify-between gap-4 shadow-sm", rankGlow)}>
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Codewars Honor Rank
                    </span>
                    <Badge className={cn("font-extrabold text-sm px-3 py-1 rounded-xl shadow-sm border-0 flex items-center gap-1.5", rankBg)}>
                      <Flame className="size-4 fill-current" /> {rankName}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-3xl sm:text-4xl font-extrabold font-mono tracking-tight block", accentColor)}>
                      {honor.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">Honor Points</span>
                  </div>
                </div>

                {/* 4 Premium Key Metrics Tiles (2x2 Grid) */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Katas Completed */}
                  <div className={cn("p-4 rounded-2xl bg-card/60 border border-border/70 hover:shadow-sm transition-all duration-300 space-y-2", `hover:${accentBorder}`)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("size-7 rounded-lg border flex items-center justify-center shrink-0", accentBg, accentBorder, accentColor)}>
                        <CheckCircle2 className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Katas Solved
                      </span>
                    </div>
                    <div>
                      <div className={cn("text-xl sm:text-2xl font-black font-mono tracking-tight", accentColor)}>
                        {totalSolved.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Challenges Completed
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard Position */}
                  <div className={cn("p-4 rounded-2xl bg-card/60 border border-border/70 hover:shadow-sm transition-all duration-300 space-y-2", `hover:${accentBorder}`)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("size-7 rounded-lg border flex items-center justify-center shrink-0", accentBg, accentBorder, accentColor)}>
                        <Globe className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Leaderboard
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {leaderboardPos ? `#${leaderboardPos.toLocaleString()}` : "Unranked"}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Global Position
                      </div>
                    </div>
                  </div>

                  {/* Overall Score */}
                  <div className={cn("p-4 rounded-2xl bg-card/60 border border-border/70 hover:shadow-sm transition-all duration-300 space-y-2", `hover:${accentBorder}`)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("size-7 rounded-lg border flex items-center justify-center shrink-0", accentBg, accentBorder, accentColor)}>
                        <Trophy className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Score
                      </span>
                    </div>
                    <div>
                      <div className={cn("text-xl sm:text-2xl font-black font-mono tracking-tight", accentColor)}>
                        {score ? score.toLocaleString() : honor.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Overall Rank Score
                      </div>
                    </div>
                  </div>

                  {/* Authored Katas */}
                  <div className={cn("p-4 rounded-2xl bg-card/60 border border-border/70 hover:shadow-sm transition-all duration-300 space-y-2", `hover:${accentBorder}`)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("size-7 rounded-lg border flex items-center justify-center shrink-0", accentBg, accentBorder, accentColor)}>
                        <Code2 className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Authored
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {totalAuthored !== null && totalAuthored !== undefined ? totalAuthored : 0}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Katas Created
                      </div>
                    </div>
                  </div>
                </div>

                {/* Language Breakdown */}
                {topLangs.length > 0 && (
                  <div className={cn("p-4 rounded-2xl bg-card/40 border backdrop-blur-md space-y-3", accentBorder)}>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Code2 className={cn("size-4", accentColor)} />
                      Language Proficiency
                    </span>
                    <div className="space-y-2.5">
                      {topLangs.slice(0, 6).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: getLanguageColor(item.language) }} />
                            <span className="text-xs font-bold text-foreground truncate capitalize">
                              {item.language}
                            </span>
                            {item.rankName && (
                              <Badge variant="outline" className={cn("text-[9px] px-2 py-0.5 rounded-md font-extrabold shrink-0", accentBorder, accentColor, accentBg)}>
                                {item.rankName}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.totalCompleted !== undefined && (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {item.totalCompleted} solved
                              </span>
                            )}
                            {item.score !== undefined && (
                              <span className={cn("text-xs font-extrabold font-mono", accentColor)}>
                                {item.score}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })()
        ) : isGeeksForGeeks ? (
          (() => {
            const gfgStats = (props as GeeksForGeeksCardProps).stats;
            const score = gfgStats?.codingScore ?? 0;
            const totalSolved = gfgStats?.totalSolved ?? 0;
            const easy = gfgStats?.easySolved ?? 0;
            const medium = gfgStats?.mediumSolved ?? 0;
            const hard = gfgStats?.hardSolved ?? 0;
            const rank = gfgStats?.institutionRank || gfgStats?.rank;
            const streak = gfgStats?.streak ?? 0;
            const avatar = gfgStats?.profile_image;
            const displayName = gfgStats?.display_name;
            const institution = gfgStats?.institution;
            const badges = gfgStats?.badges;
            const badgeCount = Array.isArray(badges) ? badges.length : (typeof badges === "number" ? badges : 0);

            let lastUpdatedText: string | null = null;
            if (gfgStats?.last_updated) {
              try {
                const d = new Date(gfgStats.last_updated);
                if (!isNaN(d.getTime())) {
                  const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
                  if (diffMins < 1) lastUpdatedText = "Updated just now";
                  else if (diffMins < 60) lastUpdatedText = `Updated ${diffMins}m ago`;
                  else {
                    const diffHours = Math.floor(diffMins / 60);
                    if (diffHours < 24) lastUpdatedText = `Updated ${diffHours}h ago`;
                    else lastUpdatedText = `Updated ${d.toLocaleDateString()}`;
                  }
                }
              } catch {
                lastUpdatedText = null;
              }
            }

            return (
              <div className="space-y-4 pt-1">
                {/* User Info Header Banner (if avatar, display name, or institution exists) */}
                {(avatar || (displayName && displayName !== usernameOrHandle) || institution) && (
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayName || usernameOrHandle}
                        className="size-11 rounded-xl object-cover border border-emerald-500/20 shadow-sm shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="size-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 text-sm shrink-0">
                        {(displayName || usernameOrHandle).substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      {displayName && (
                        <h4 className="text-sm font-extrabold text-foreground truncate">
                          {displayName}
                        </h4>
                      )}
                      {institution && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5 font-medium">
                          <Building2 className="size-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{institution}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Score & Streak Header Card */}
                <div className="p-5 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Coding Score
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 block tracking-tight">
                      {score}
                    </span>
                  </div>
                  {streak > 0 && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end text-amber-500 font-extrabold font-mono text-xl sm:text-2xl">
                        <Flame className="size-5 fill-amber-500" />
                        {streak} Days
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold">POTD Streak</span>
                    </div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Total Solved
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">
                      {totalSolved}
                    </span>
                  </div>
                  {rank ? (
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1 flex items-center gap-1">
                        <Trophy className="size-3 text-amber-500 inline" /> Campus Rank
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">
                        #{rank}
                      </span>
                    </div>
                  ) : badgeCount > 0 ? (
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1 flex items-center gap-1">
                        <Award className="size-3 text-emerald-500 inline" /> Badges
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">
                        {badgeCount} Badges
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        Platform Status
                      </span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        Active Solver
                      </span>
                    </div>
                  )}
                </div>

                {/* Problem Breakdown Bar */}
                <div className="p-4 rounded-2xl bg-emerald-600/5 border border-emerald-600/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-foreground">Problem Breakdown</span>
                    <span className="font-mono text-foreground">
                      Easy: {easy} | Med: {medium} | Hard: {hard}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden flex w-full">
                    <div style={{ width: `${Math.max(10, (easy / Math.max(1, totalSolved)) * 100)}%` }} className="bg-emerald-500 h-full" title={`Easy: ${easy}`} />
                    <div style={{ width: `${Math.max(10, (medium / Math.max(1, totalSolved)) * 100)}%` }} className="bg-amber-500 h-full" title={`Medium: ${medium}`} />
                    <div style={{ width: `${Math.max(10, (hard / Math.max(1, totalSolved)) * 100)}%` }} className="bg-rose-500 h-full" title={`Hard: ${hard}`} />
                  </div>
                </div>

                {/* Last Updated Timestamp Footer */}
                {lastUpdatedText && (
                  <div className="flex items-center justify-end text-[11px] text-muted-foreground font-medium pt-1">
                    <Clock className="size-3 mr-1 opacity-70" />
                    <span>{lastUpdatedText}</span>
                  </div>
                )}
              </div>
            );
          })()
        ) : isAtCoder ? (
          (() => {
            const atcoderStats = (props as AtCoderCardProps).stats;
            const rating = atcoderStats?.rating ?? 0;
            const maxRating = atcoderStats?.maxRating ?? rating;
            const totalSolved = atcoderStats?.totalSolved ?? 0;
            const competitionsCount = atcoderStats?.competitionsCount ?? 0;
            const rankName = atcoderStats?.rank || "Unrated";
            const highestPerformance = atcoderStats?.highestPerformance;
            const bestRank = atcoderStats?.bestRank;
            const acceptedCountRank = atcoderStats?.acceptedCountRank;
            const ratedPointSum = atcoderStats?.ratedPointSum;
            const ratedPointSumRank = atcoderStats?.ratedPointSumRank;

            const getRankBadgeProps = (rk: string, r: number) => {
              if (r >= 2800 || rk === "Red") return { bg: "bg-red-500/10 border-red-500/30 text-red-500", text: "Red" };
              if (r >= 2400 || rk === "Orange") return { bg: "bg-orange-500/10 border-orange-500/30 text-orange-500", text: "Orange" };
              if (r >= 2000 || rk === "Yellow") return { bg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500 dark:text-yellow-400", text: "Yellow" };
              if (r >= 1600 || rk === "Blue") return { bg: "bg-blue-500/10 border-blue-500/30 text-blue-500", text: "Blue" };
              if (r >= 1200 || rk === "Cyan") return { bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-500 dark:text-cyan-400", text: "Cyan" };
              if (r >= 800 || rk === "Green") return { bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500", text: "Green" };
              if (r >= 400 || rk === "Brown") return { bg: "bg-amber-700/10 border-amber-700/30 text-amber-700 dark:text-amber-500", text: "Brown" };
              if (r > 0 || rk === "Gray") return { bg: "bg-slate-500/10 border-slate-500/30 text-slate-400", text: "Gray" };
              return { bg: "bg-muted/40 border-border text-muted-foreground", text: "Unrated" };
            };

            const badgeProps = getRankBadgeProps(rankName, rating);

            return (
              <div className="space-y-5 pt-2">
                {/* Hero Rating / AtCoder Competitive Standings Banner */}
                <div className="p-5 sm:p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      AtCoder Competitive Standings
                    </span>
                    <Badge variant="outline" className={cn("px-3 py-1 text-xs font-extrabold capitalize shadow-sm border-0 flex items-center gap-1.5", badgeProps.bg)}>
                      <Trophy className="size-4 fill-current" /> {badgeProps.text} Tier
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-400 tracking-tight block">
                      {rating}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Highest Rating: <span className="font-mono text-foreground">{maxRating > 0 ? maxRating : rating}</span>
                    </span>
                  </div>
                </div>

                {/* 4 Premium Key Metrics Tiles (2x2 Grid) */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Problems Solved */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <CheckCircle2 className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Problems Solved
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400 tracking-tight">
                        {totalSolved.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        {acceptedCountRank ? `Rank #${acceptedCountRank.toLocaleString()}` : "Accepted Tasks (AC)"}
                      </div>
                    </div>
                  </div>

                  {/* Rated Contests */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <Flame className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Contests
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {competitionsCount}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        Attended & Rated
                      </div>
                    </div>
                  </div>

                  {/* Best Performance */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <Trophy className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Best Performance
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {highestPerformance ? highestPerformance : (rating > 0 ? rating : "N/A")}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        {bestRank ? `Best Rank #${bestRank.toLocaleString()}` : "Peak Contest Performance"}
                      </div>
                    </div>
                  </div>

                  {/* Rated Point Sum */}
                  <div className="p-4 rounded-2xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-300 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <Globe className="size-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                        Point Sum
                      </span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight">
                        {ratedPointSum ? ratedPointSum.toLocaleString() : "Active"}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        {ratedPointSumRank ? `Rank #${ratedPointSumRank.toLocaleString()}` : "Total Rated Points"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : null}
      </div>
    </div>
  );
}

