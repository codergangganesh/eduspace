import React, { useState, useEffect } from "react";
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
  Pin,
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
import { UnifiedPlatformLogo } from "./PlatformLogos";
import { cn } from "@/lib/utils";
import { GitHubPortfolioDashboard } from "./GitHubPortfolioDashboard";

const BRAND_LOGOS: Record<string, string> = {
  leetcode: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/leetcode/leetcode-original.svg",
  codeforces: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codeforces/codeforces-original.svg",
  github: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
  codewars: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codewars/codewars-original.svg",
  codechef: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codechef/codechef-original.svg",
  geeksforgeeks: "https://media.geeksforgeeks.org/wp-content/cdn-uploads/gfg_200X200.png",
  atcoder: "https://img.atcoder.jp/assets/atcoder.png",
  hackerrank: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/hackerrank/hackerrank-original.svg",
  credly: "https://www.credly.com/assets/apple-touch-icon-180x180.png",
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

export function UserAvatarImage({
  src,
  fallbackSrc,
  name,
  fallbackText,
  borderColor = "border-primary/25",
  fallbackBg = "bg-primary/20 border-primary/30",
  fallbackTextColor = "text-primary",
  sizeClass = "size-7",
}: {
  src?: string | null;
  fallbackSrc?: string | null;
  name?: string | null;
  fallbackText?: string | null;
  borderColor?: string;
  fallbackBg?: string;
  fallbackTextColor?: string;
  sizeClass?: string;
}) {
  const normalizeUrl = (url?: string | null) => {
    if (!url) return null;
    let clean = url.trim();
    if (clean.startsWith("//")) clean = `https:${clean}`;
    if (clean === "null" || clean === "undefined" || clean === "#" || clean.length < 5) return null;
    return clean;
  };

  const primary = normalizeUrl(src);
  const secondary = normalizeUrl(fallbackSrc);

  // Build resilient candidate URL sequence:
  // 1. Direct primary URL
  // 2. Direct secondary URL (if distinct)
  // 3. High-availability global image proxy (CORS-friendly, WebP optimized)
  // 4. Secondary proxy URL (if distinct)
  const candidateUrls = React.useMemo(() => {
    const list: string[] = [];
    if (primary) {
      list.push(primary);
    }
    if (secondary && secondary !== primary) {
      list.push(secondary);
    }
    if (primary && !primary.startsWith("data:") && !primary.includes("wsrv.nl")) {
      list.push(`https://wsrv.nl/?url=${encodeURIComponent(primary)}&w=128&h=128&fit=cover`);
    }
    if (secondary && secondary !== primary && !secondary.startsWith("data:") && !secondary.includes("wsrv.nl")) {
      list.push(`https://wsrv.nl/?url=${encodeURIComponent(secondary)}&w=128&h=128&fit=cover`);
    }
    return list;
  }, [primary, secondary]);

  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [src, fallbackSrc]);

  const activeSrc = candidateUrls[candidateIndex] || null;
  const initials = (fallbackText || name || "CP").trim().substring(0, 2).toUpperCase();

  if (activeSrc) {
    return (
      <img
        src={activeSrc}
        alt={name || "User Avatar"}
        referrerPolicy="no-referrer"
        loading="lazy"
        className={cn(sizeClass, "rounded-lg object-cover border shrink-0 shadow-xs", borderColor)}
        onError={() => {
          setCandidateIndex((prev) => prev + 1);
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        "rounded-lg border flex items-center justify-center font-extrabold text-[11px] shrink-0 shadow-xs select-none",
        fallbackBg,
        fallbackTextColor
      )}
    >
      {initials}
    </div>
  );
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

const LinkedInLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19ZM8.34 18.6V10.8H5.9V18.6H8.34ZM7.12 9.7A1.35 1.35 0 1 0 7.1 6.95A1.35 1.35 0 0 0 7.12 9.7ZM18.1 18.6V14.45C18.1 12.33 17.24 11.55 15.72 11.55C14.76 11.55 14.2 12.1 13.92 12.65H13.88V10.8H11.47C11.5 11.5 11.47 18.6 11.47 18.6H13.92V14.9C13.92 14.2 13.96 13.4 14.86 13.4C15.72 13.4 15.78 14.12 15.78 14.95V18.6H18.1Z" />
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
  linkedin: LinkedInLogo,
  codewars: CodewarsLogo,
  codechef: CodeChefLogo,
  geeksforgeeks: GeeksForGeeksLogo,
  atcoder: AtCoderLogo,
};

export function PlatformBrandLogo({ platform, className = "size-7" }: { platform: string; className?: string }) {
  return <UnifiedPlatformLogo platform={platform} className={className} />;
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
function LeetCodeDonutChart({
  easy,
  medium,
  hard,
  total,
  totalQuestions,
  size = 110,
  strokeWidth = 10,
}: {
  easy: number;
  medium: number;
  hard: number;
  total: number;
  totalQuestions?: number;
  size?: number;
  strokeWidth?: number;
}) {
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
    <div className="relative flex items-center justify-center shrink-0 my-1">
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
        <span className="text-xl sm:text-2xl font-black text-foreground font-mono tracking-tight">{total}</span>
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Solved</span>
      </div>
    </div>
  );
}

export interface BaseCardMetaProps {
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export interface LeetCodeCardProps extends BaseCardMetaProps {
  platform: "leetcode";
  username?: string | null;
  stats?: LeetCodeStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export interface CodeforcesCardProps extends BaseCardMetaProps {
  platform: "codeforces";
  handle?: string | null;
  stats?: CodeforcesStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export interface GitHubCardProps extends BaseCardMetaProps {
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

export interface CodeChefCardProps extends BaseCardMetaProps {
  platform: "codechef";
  username?: string | null;
  stats?: CodeChefStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export interface CodewarsCardProps extends BaseCardMetaProps {
  platform: "codewars";
  username?: string | null;
  stats?: CodewarsStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export interface GeeksForGeeksCardProps extends BaseCardMetaProps {
  platform: "geeksforgeeks";
  username?: string | null;
  stats?: GeeksForGeeksStats | null;
  error?: string | null;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export interface AtCoderCardProps extends BaseCardMetaProps {
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

  const [atcoderTab, setAtcoderTab] = useState<"algo" | "heuristic" | "contests">("algo");
  const [codechefTab, setCodechefTab] = useState<"overview" | "badges" | "contests">("overview");
  const [leetcodeTab, setLeetcodeTab] = useState<"overview" | "badges" | "contests">("overview");
  const [codeforcesTab, setCodeforcesTab] = useState<"overview" | "topics" | "contests">("overview");
  const [codewarsTab, setCodewarsTab] = useState<"overview" | "languages" | "badges">("overview");

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
  if (isLeetCode) rawInput = (props as LeetCodeCardProps).username || (props as any).stats?.username || "";
  else if (isCodeforces) rawInput = (props as CodeforcesCardProps).handle || (props as any).username || (props as CodeforcesCardProps).stats?.handle || "";
  else if (isCodeChef) rawInput = (props as CodeChefCardProps).username || (props as any).stats?.username || "";
  else if (isCodewars) rawInput = (props as CodewarsCardProps).username || (props as any).stats?.username || "";
  else if (isGeeksForGeeks) rawInput = (props as GeeksForGeeksCardProps).username || (props as any).stats?.username || "";
  else if (isAtCoder) rawInput = (props as AtCoderCardProps).username || (props as any).stats?.username || "";
  else rawInput = (props as GitHubCardProps).username || "";

  const usernameOrHandle = extractUsername(rawInput);
  const hasLinked = Boolean(usernameOrHandle && usernameOrHandle.trim().length > 0);

  let profileUrl = "#";
  let platformTitle = "Platform";
  let brandGlow = "group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.18)]";
  let iconBg = "bg-primary/10 border-primary/20";
  let bgBlob = "bg-primary";

  if (isLeetCode) {
    profileUrl = (props as LeetCodeCardProps).stats?.profile_url || `https://leetcode.com/u/${usernameOrHandle}/`;
    platformTitle = "LeetCode";
    brandGlow = "group-hover:border-[#FFA116]/50 group-hover:shadow-[0_0_30px_rgba(255,161,22,0.18)]";
    iconBg = "bg-[#FFA116]/10 border-[#FFA116]/20";
    bgBlob = "bg-[#FFA116]";
  } else if (isCodeforces) {
    profileUrl = (props as CodeforcesCardProps).stats?.profile_url || `https://codeforces.com/profile/${usernameOrHandle}`;
    platformTitle = "Codeforces";
    brandGlow = "group-hover:border-[#1F8ACB]/50 group-hover:shadow-[0_0_30px_rgba(31,138,203,0.18)]";
    iconBg = "bg-[#1F8ACB]/10 border-[#1F8ACB]/20";
    bgBlob = "bg-[#1F8ACB]";
  } else if (isCodeChef) {
    profileUrl = (props as CodeChefCardProps).stats?.profile_url || `https://www.codechef.com/users/${usernameOrHandle}`;
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
    profileUrl = (props as AtCoderCardProps).stats?.profile_url || `https://atcoder.jp/users/${usernameOrHandle}`;
    platformTitle = "AtCoder";
    brandGlow = "group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.18)]";
    iconBg = "bg-cyan-500/10 border-cyan-500/20";
    bgBlob = "bg-cyan-500";
  }

  return (
    <div
      className={cn(
        "group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[420px] w-full max-w-full",
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

          <div className="flex items-center gap-1 shrink-0">
            {props.onTogglePin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={props.onTogglePin}
                className={cn(
                  "size-7 rounded-lg transition-all",
                  props.isPinned
                    ? "text-amber-500 hover:text-amber-600 bg-amber-500/10 border border-amber-500/30 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title={props.isPinned ? "Unpin platform card" : "Pin platform card to top"}
              >
                <Pin className={cn("size-3", props.isPinned && "fill-amber-500")} />
              </Button>
            )}
            {props.onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={props.onRefresh}
                disabled={props.isRefreshing}
                className="size-7 rounded-lg hover:bg-accent hover:text-foreground"
                title="Refresh statistics"
              >
                <RefreshCw className={cn("size-3", props.isRefreshing && "animate-spin text-primary")} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={props.onEdit}
              className="size-7 rounded-lg hover:bg-accent"
              title="Edit handle"
            >
              <Edit3 className="size-3 text-muted-foreground" />
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
            const recentContests = lcStats?.recentContests || [];

            const totalCalc = Math.max(1, total);
            const easyPct = Math.round((easy / totalCalc) * 100);
            const mediumPct = Math.round((medium / totalCalc) * 100);
            const hardPct = Math.round((hard / totalCalc) * 100);

            return (
              <div className="space-y-2.5 pt-0.5">
                {/* Profile Header Banner (Ultra Compact 1-Row) */}
                {(lcStats?.name || lcStats?.countryName || lcStats?.company || lcStats?.school || lcStats?.avatar || lcStats?.streak || lcStats?.totalActiveDays || usernameOrHandle) && (
                  <div className="px-2.5 py-1.5 rounded-xl bg-[#FFA116]/5 border border-[#FFA116]/15 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatarImage
                        src={lcStats?.avatar}
                        name={lcStats?.name || usernameOrHandle}
                        fallbackText={lcStats?.name || usernameOrHandle}
                        borderColor="border-[#FFA116]/25"
                        fallbackBg="bg-[#FFA116]/20 border-[#FFA116]/30"
                        fallbackTextColor="text-[#FFA116]"
                        sizeClass="size-7"
                      />
                      <div className="min-w-0">
                        <a
                          href={lcStats?.profile_url || profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-extrabold text-foreground hover:text-[#FFA116] truncate leading-tight flex items-center gap-1 transition-colors group/title"
                          title={`Open ${lcStats?.name || usernameOrHandle}'s LeetCode Profile`}
                        >
                          <span className="truncate">{lcStats?.name || usernameOrHandle}</span>
                          <ExternalLink className="size-2.5 opacity-60 group-hover/title:opacity-100 shrink-0" />
                        </a>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground font-medium leading-none mt-0.5">
                          {lcStats?.countryName && (
                            <span className="flex items-center gap-0.5">
                              <Globe className="size-2.5 text-[#FFA116] shrink-0" />
                              <span className="truncate max-w-[80px]">{lcStats.countryName}</span>
                            </span>
                          )}
                          {lcStats?.company && (
                            <span className="flex items-center gap-0.5 truncate max-w-[90px]">
                              <Building2 className="size-2.5 text-[#FFA116] shrink-0" />
                              <span className="truncate">{lcStats.company}</span>
                            </span>
                          )}
                          {lcStats?.school && (
                            <span className="flex items-center gap-0.5 truncate max-w-[90px]">
                              <BookOpen className="size-2.5 text-[#FFA116] shrink-0" />
                              <span className="truncate">{lcStats.school}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Streak / Active Days Chip in Header */}
                    {((typeof lcStats?.streak === "number" && lcStats.streak > 0) || (typeof lcStats?.totalActiveDays === "number" && lcStats.totalActiveDays > 0)) && (
                      <div className="flex items-center gap-1 shrink-0">
                        {typeof lcStats?.streak === "number" && lcStats.streak > 0 && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 rounded-md font-bold border-amber-500/40 text-amber-500 bg-amber-500/10 flex items-center gap-0.5">
                            <Flame className="size-2.5 fill-current" /> {lcStats.streak}d
                          </Badge>
                        )}
                        {typeof lcStats?.totalActiveDays === "number" && lcStats.totalActiveDays > 0 && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 rounded-md font-medium border-border/80 text-muted-foreground bg-muted/30">
                            {lcStats.totalActiveDays}d
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Tab Navigation Bar (Overview, Badges, Contests) */}
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/40 rounded-xl border border-border/50 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => setLeetcodeTab("overview")}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      leetcodeTab === "overview"
                        ? "bg-[#FFA116] text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold"
                    )}
                  >
                    <Code2 className="size-3 shrink-0" />
                    <span className="truncate">Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeetcodeTab("badges")}
                    disabled={badges.length === 0}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      leetcodeTab === "badges"
                        ? "bg-[#FFA116] text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold",
                      badges.length === 0 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Award className="size-3 shrink-0" />
                    <span className="truncate">Badges ({badges.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeetcodeTab("contests")}
                    disabled={recentContests.length === 0}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      leetcodeTab === "contests"
                        ? "bg-[#FFA116] text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold",
                      recentContests.length === 0 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Trophy className="size-3 shrink-0" />
                    <span className="truncate">Contests ({recentContests.length})</span>
                  </button>
                </div>

                {/* Tab 1: Overview */}
                {leetcodeTab === "overview" && (
                  <div className="space-y-2.5">
                    {/* 4 Compact Key Metrics Tiles (2x2 Grid) */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Contest Rating */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-[#FFA116]/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="size-5 rounded-md bg-[#FFA116]/10 border border-[#FFA116]/20 flex items-center justify-center text-[#FFA116] shrink-0">
                              <Trophy className="size-2.5" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                              Rating
                            </span>
                          </div>
                          {contestBadge ? (
                            <Badge className="bg-[#FFA116] text-slate-950 font-black text-[9px] px-1.5 py-0 rounded-md border-0 shrink-0">
                              {contestBadge}
                            </Badge>
                          ) : topPercentage ? (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 rounded-md border-[#FFA116]/40 text-[#FFA116] bg-[#FFA116]/10 font-extrabold shrink-0">
                              Top {topPercentage}%
                            </Badge>
                          ) : null}
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-[#FFA116] tracking-tight leading-tight">
                            {contestRating ? contestRating : (total > 0 ? "Rated" : "Unrated")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            {contestRanking ? `Rank #${contestRanking.toLocaleString()}` : (contestRating ? "Contest Rating" : "Competitive Score")}
                          </div>
                        </div>
                      </div>

                      {/* Global Solver Rank */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-[#FFA116]/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-[#FFA116]/10 border border-[#FFA116]/20 flex items-center justify-center text-[#FFA116] shrink-0">
                            <Globe className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Global Rank
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {globalRanking ? `#${globalRanking.toLocaleString()}` : (total > 0 ? "Top Solver" : "Unranked")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Worldwide Standing
                          </div>
                        </div>
                      </div>

                      {/* Contests Attended */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-[#FFA116]/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-[#FFA116]/10 border border-[#FFA116]/20 flex items-center justify-center text-[#FFA116] shrink-0">
                            <Flame className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Contests
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {contestsAttended !== null && contestsAttended !== undefined ? contestsAttended : (contestRating ? "Active" : 0)}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Attended & Rated
                          </div>
                        </div>
                      </div>

                      {/* Acceptance Rate */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-[#FFA116]/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-[#FFA116]/10 border border-[#FFA116]/20 flex items-center justify-center text-[#FFA116] shrink-0">
                            <CheckCircle2 className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Accuracy
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {acceptanceRate !== null && acceptanceRate !== undefined ? `${acceptanceRate}%` : (total > 0 ? "High AC" : "N/A")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            {reputation ? `${reputation.toLocaleString()} Rep` : "Submission AC"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compact Problem Solving Breakdown with Mini Donut Chart */}
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-muted/20 border border-border/50">
                      <LeetCodeDonutChart
                        easy={easy}
                        medium={medium}
                        hard={hard}
                        total={total}
                        totalQuestions={totalQuestions}
                        size={84}
                        strokeWidth={8}
                      />

                      <div className="flex-1 w-full space-y-1.5">
                        {/* Easy Row */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                              <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                              Easy
                            </span>
                            <div className="flex items-center gap-1 font-mono text-[10px]">
                              <span className="font-extrabold text-foreground">{easy}</span>
                              <span className="text-muted-foreground/60 text-[9px]">/{easyTotal}</span>
                              <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0 rounded border border-emerald-500/20">
                                {easyPct}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-emerald-500/15 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-700 shadow-xs"
                              style={{ width: `${easyPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Medium Row */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                              <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                              Med
                            </span>
                            <div className="flex items-center gap-1 font-mono text-[10px]">
                              <span className="font-extrabold text-foreground">{medium}</span>
                              <span className="text-muted-foreground/60 text-[9px]">/{mediumTotal}</span>
                              <span className="text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1 py-0 rounded border border-amber-500/20">
                                {mediumPct}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-amber-500/15 overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-700 shadow-xs"
                              style={{ width: `${mediumPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Hard Row */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                              <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                              Hard
                            </span>
                            <div className="flex items-center gap-1 font-mono text-[10px]">
                              <span className="font-extrabold text-foreground">{hard}</span>
                              <span className="text-muted-foreground/60 text-[9px]">/{hardTotal}</span>
                              <span className="text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1 py-0 rounded border border-rose-500/20">
                                {hardPct}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-rose-500/15 overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full transition-all duration-700 shadow-xs"
                              style={{ width: `${hardPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Badges Preview Footer in Overview Tab */}
                    {badges.length > 0 && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-card/40 border border-[#FFA116]/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                            Badges:
                          </span>
                          <div className="flex items-center gap-1">
                            {badges.slice(0, 4).map((b, i) =>
                              b.icon ? (
                                <img
                                  key={i}
                                  src={b.icon}
                                  alt={b.name}
                                  title={b.name}
                                  className="size-5 object-contain drop-shadow-xs shrink-0"
                                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                                />
                              ) : null
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLeetcodeTab("badges")}
                          className="text-[10px] font-extrabold text-[#FFA116] hover:underline shrink-0 flex items-center gap-0.5"
                        >
                          <span>{badges.length} Earned</span>
                          <ArrowUpRight className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Badges */}
                {leetcodeTab === "badges" && (
                  <div className="p-2.5 rounded-xl bg-card/40 border border-[#FFA116]/20 backdrop-blur-md space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                        <Award className="size-3.5 text-[#FFA116] shrink-0" />
                        <span className="truncate">LeetCode Badges</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.2 rounded-md border-[#FFA116]/40 text-[#FFA116] bg-[#FFA116]/10 font-extrabold whitespace-nowrap shrink-0">
                        {badges.length} Earned
                      </Badge>
                    </div>

                    {/* Scrollable Badges List (Compact height) */}
                    <div className="max-h-[190px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                      {badges.map((b, idx) => (
                        <div
                          key={idx}
                          className="group/badge p-2 rounded-xl bg-card border border-border/70 hover:border-[#FFA116]/40 hover:shadow-xs transition-all duration-200 flex items-center gap-2"
                        >
                          {b.icon ? (
                            <img
                              src={b.icon}
                              alt={b.name}
                              referrerPolicy="no-referrer"
                              className="size-8 object-contain shrink-0 transition-transform duration-200 group-hover/badge:scale-110 drop-shadow-xs"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src.includes("leetcode.com")) {
                                  target.src = target.src.replace("leetcode.com", "assets.leetcode.com");
                                } else if (target.src.includes("assets.leetcode.com")) {
                                  target.src = target.src.replace("assets.leetcode.com", "leetcode.com");
                                } else {
                                  target.onerror = null;
                                  target.style.display = "none";
                                }
                              }}
                            />
                          ) : (
                            <div className="size-8 rounded-lg border border-[#FFA116]/30 bg-[#FFA116]/15 flex items-center justify-center text-[#FFA116] shrink-0 shadow-xs">
                              <Award className="size-3.5" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                              <h5 className="text-[11px] font-extrabold text-foreground truncate">
                                {b.name}
                              </h5>
                              <Badge variant="outline" className="text-[8px] px-1 py-0 rounded-md font-extrabold border-[#FFA116]/30 text-[#FFA116] bg-[#FFA116]/10 shrink-0 whitespace-nowrap">
                                {b.category || "Badge"}
                              </Badge>
                            </div>

                            {(b.description || b.hoverText || b.shortName) && (
                              <p className="text-[9px] text-muted-foreground/90 leading-tight line-clamp-1">
                                {b.description || b.hoverText || b.shortName}
                              </p>
                            )}

                            {b.creationDate && (
                              <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium">
                                <Clock className="size-2 text-[#FFA116] shrink-0" />
                                <span>Earned on {b.creationDate}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Contests */}
                {leetcodeTab === "contests" && (
                  <div className="p-2.5 rounded-xl bg-card/40 border border-[#FFA116]/20 backdrop-blur-md space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                        <Trophy className="size-3.5 text-[#FFA116] shrink-0" />
                        <span className="truncate">Recent Contests</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.2 rounded-md font-extrabold border-[#FFA116]/40 text-[#FFA116] bg-[#FFA116]/10">
                        {recentContests.length} Rated
                      </Badge>
                    </div>

                    <div className="max-h-[190px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                      {recentContests.slice(-8).reverse().map((c, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded-lg bg-card/80 border border-border/60 flex items-center justify-between gap-2 text-xs hover:border-[#FFA116]/30 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="font-extrabold text-foreground truncate text-[11px] leading-tight">
                              {c.name}
                            </h5>
                            <span className="text-[9px] text-muted-foreground font-medium">
                              {c.date || "Completed"} {c.rank ? `• Rank #${c.rank.toLocaleString()}` : ""} {typeof c.problemsSolved === "number" ? `• Solved ${c.problemsSolved}/${c.totalProblems || 4}` : ""}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-xs text-[#FFA116] block leading-tight">
                              {c.rating}
                            </span>
                            <span className="text-[8px] text-muted-foreground font-medium">
                              Rating
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : isCodeforces ? (
          (() => {
            const cfStats = (props as CodeforcesCardProps).stats;
            const rating = cfStats?.rating ?? 0;
            const maxRating = cfStats?.maxRating ?? rating;
            const rankConfig = getCodeforcesRankConfig(rating);

            const totalSolved = cfStats?.totalSolved ?? 0;
            const totalSubmissions = cfStats?.totalSubmissions ?? 0;
            const acceptanceRate = cfStats?.acceptanceRate ?? (totalSubmissions > 0 ? Math.round((totalSolved / totalSubmissions) * 100) : null);
            const contestsAttended = cfStats?.contestsAttended ?? (cfStats?.recentContests?.length || (rating > 0 ? 1 : 0));
            const bestRank = cfStats?.bestRank;
            const maxRatingGain = cfStats?.maxRatingGain;
            const contribution = cfStats?.contribution ?? 0;
            const topTags = cfStats?.topTags || [];
            const difficultyMap = cfStats?.problemDifficultyBreakdown || {};
            const recentContests = cfStats?.recentContests || [];
            const badges = cfStats?.badges || [];
            const languages = cfStats?.languages || [];

            return (
              <div className="space-y-2.5 pt-0.5">
                {/* Profile Header Banner (Ultra Compact 1-Row) */}
                {(cfStats?.name || cfStats?.country || cfStats?.city || cfStats?.organization || cfStats?.avatar || cfStats?.titlePhoto || usernameOrHandle) && (
                  <div className="px-2.5 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/15 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatarImage
                        src={cfStats?.avatar}
                        fallbackSrc={cfStats?.titlePhoto}
                        name={cfStats?.name || usernameOrHandle}
                        fallbackText={cfStats?.name || usernameOrHandle}
                        borderColor="border-cyan-500/25"
                        fallbackBg="bg-cyan-500/20 border-cyan-500/30"
                        fallbackTextColor="text-cyan-400"
                        sizeClass="size-7"
                      />
                      <div className="min-w-0">
                        <a
                          href={cfStats?.profile_url || profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-extrabold text-foreground hover:text-cyan-400 truncate leading-tight flex items-center gap-1 transition-colors group/title"
                          title={`Open ${cfStats?.name || usernameOrHandle}'s Codeforces Profile`}
                        >
                          <span className="truncate">{cfStats?.name || usernameOrHandle}</span>
                          <ExternalLink className="size-2.5 opacity-60 group-hover/title:opacity-100 shrink-0" />
                        </a>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground font-medium leading-none mt-0.5">
                          {cfStats?.country && (
                            <span className="flex items-center gap-0.5">
                              <Globe className="size-2.5 text-cyan-400 shrink-0" />
                              <span className="truncate max-w-[85px]">{cfStats.country}{cfStats.city ? `, ${cfStats.city}` : ""}</span>
                            </span>
                          )}
                          {cfStats?.organization && (
                            <span className="flex items-center gap-0.5 truncate max-w-[95px]">
                              <Building2 className="size-2.5 text-cyan-400 shrink-0" />
                              <span className="truncate">{cfStats.organization}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rank & Peak Tier Chips */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-extrabold border-0 shadow-xs", rankConfig.bgColor, rankConfig.textColor)}>
                        {rankConfig.name}
                      </Badge>
                      {maxRating > 0 && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 rounded-md font-bold border-cyan-500/40 text-cyan-400 bg-cyan-500/10">
                          Peak {maxRating}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-Tab Navigation Bar (Overview, Topics, Contests) */}
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/40 rounded-xl border border-border/50 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => setCodeforcesTab("overview")}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      codeforcesTab === "overview"
                        ? "bg-cyan-500 text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold"
                    )}
                  >
                    <Code2 className="size-3 shrink-0" />
                    <span className="truncate">Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCodeforcesTab("topics")}
                    disabled={topTags.length === 0 && badges.length === 0}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      codeforcesTab === "topics"
                        ? "bg-cyan-500 text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold",
                      topTags.length === 0 && badges.length === 0 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Award className="size-3 shrink-0" />
                    <span className="truncate">Topics & Badges ({topTags.length || badges.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCodeforcesTab("contests")}
                    disabled={recentContests.length === 0 && !contestsAttended}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      codeforcesTab === "contests"
                        ? "bg-cyan-500 text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold",
                      recentContests.length === 0 && !contestsAttended && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Trophy className="size-3 shrink-0" />
                    <span className="truncate">Contests ({recentContests.length || contestsAttended || 0})</span>
                  </button>
                </div>

                {/* Tab 1: Overview */}
                {codeforcesTab === "overview" && (
                  <div className="space-y-2.5">
                    {/* 4 Compact Key Metrics Tiles (2x2 Grid) */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Rating */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="size-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                              <Trophy className="size-2.5" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                              Rating
                            </span>
                          </div>
                          {maxRating && maxRating > 0 && (
                            <span className="text-[9px] font-mono text-muted-foreground font-semibold shrink-0">
                              Peak {maxRating}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className={cn("text-base sm:text-lg font-black font-mono tracking-tight leading-tight", rankConfig.textColor)}>
                            {rating > 0 ? rating : "Unrated"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            {cfStats?.maxRank ? `Max: ${cfStats.maxRank}` : `${rankConfig.name} Standing`}
                          </div>
                        </div>
                      </div>

                      {/* Best Rank */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                            <Flame className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Best Rank
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {bestRank ? `#${bestRank.toLocaleString()}` : (rating > 0 ? "Top Solver" : "Unranked")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            {maxRatingGain ? `Max Gain: +${maxRatingGain}` : "Contest Placement"}
                          </div>
                        </div>
                      </div>

                      {/* Contests Attended */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                            <Trophy className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Contests
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {contestsAttended > 0 ? contestsAttended.toLocaleString() : "0"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Rated Rounds
                          </div>
                        </div>
                      </div>

                      {/* Solved Problems */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                            <CheckCircle2 className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Solved
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-cyan-400 tracking-tight leading-tight">
                            {totalSolved.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            {acceptanceRate !== null ? `${acceptanceRate}% Accuracy` : "Unique Problems"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Problem Solving & Difficulty Breakdown Bar */}
                    {totalSolved > 0 && (
                      <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-extrabold text-foreground flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-500" />
                            {totalSolved} Problems Solved
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {languages.length > 0 ? `Primary: ${languages[0].language}` : "Algorithmic Challenges"}
                          </span>
                        </div>
                        {/* Rating distribution pill summary */}
                        <div className="flex items-center gap-1 flex-wrap text-[9px] font-mono font-bold text-muted-foreground">
                          {Object.entries(difficultyMap).slice(0, 5).map(([tier, count], i) => (
                            <span key={i} className="px-1.5 py-0.2 rounded bg-muted/50 border border-border/60">
                              {tier}: <strong className="text-foreground">{count}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Topics Preview Footer */}
                    {topTags.length > 0 && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-card/40 border border-cyan-500/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                            Topics:
                          </span>
                          <div className="flex items-center gap-1 truncate text-[11px] font-bold text-foreground">
                            {topTags.slice(0, 3).map((t, i) => (
                              <Badge key={i} variant="outline" className="text-[9px] px-1 py-0 rounded border-cyan-500/30 text-cyan-400 bg-cyan-500/10 capitalize truncate max-w-[90px]">
                                {t.name}: {t.count}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCodeforcesTab("topics")}
                          className="text-[10px] font-extrabold text-cyan-400 hover:underline shrink-0 flex items-center gap-0.5"
                        >
                          <span>{topTags.length} Tags</span>
                          <ArrowUpRight className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Topics & Badges */}
                {codeforcesTab === "topics" && (
                  <div className="p-2.5 rounded-xl bg-card/40 border border-cyan-500/20 backdrop-blur-md space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                        <Award className="size-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Algorithm Topics & Badges</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.2 rounded-md border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-extrabold whitespace-nowrap shrink-0">
                        {topTags.length} Topics • {badges.length} Badges
                      </Badge>
                    </div>

                    <div className="max-h-[190px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {/* Top Tags List */}
                      {topTags.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Algorithm Categories
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {topTags.map((tag, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 rounded-lg bg-card/80 border border-border/60 flex items-center justify-between gap-1 text-xs"
                              >
                                <span className="text-[11px] font-bold text-foreground truncate capitalize">
                                  {tag.name}
                                </span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0 rounded font-mono font-black border-cyan-500/30 text-cyan-400 bg-cyan-500/10 shrink-0">
                                  {tag.count}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Badges List */}
                      {badges.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Achievements & Milestones
                          </span>
                          <div className="space-y-1">
                            {badges.map((b, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 rounded-lg bg-card/80 border border-border/60 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="min-w-0">
                                  <h5 className="font-extrabold text-foreground text-[11px] leading-tight truncate">
                                    {b.name}
                                  </h5>
                                  {b.description && (
                                    <p className="text-[9px] text-muted-foreground truncate">
                                      {b.description}
                                    </p>
                                  )}
                                </div>
                                {b.category && (
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 rounded font-extrabold border-cyan-500/30 text-cyan-400 bg-cyan-500/10 shrink-0">
                                    {b.category}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Contests */}
                {codeforcesTab === "contests" && (
                  <div className="p-2.5 rounded-xl bg-card/40 border border-cyan-500/20 backdrop-blur-md space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                        <Trophy className="size-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Recent Codeforces Contests</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.2 rounded-md font-extrabold border-cyan-500/40 text-cyan-400 bg-cyan-500/10">
                        {recentContests.length || contestsAttended || 0} Rated
                      </Badge>
                    </div>

                    <div className="max-h-[190px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                      {recentContests.length > 0 ? (
                        recentContests.slice(-8).reverse().map((c, idx) => {
                          const delta = c.ratingChange;
                          const isPos = delta > 0;
                          return (
                            <div
                              key={idx}
                              className="p-1.5 rounded-lg bg-card/80 border border-border/60 flex items-center justify-between gap-2 text-xs hover:border-cyan-500/30 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <h5 className="font-extrabold text-foreground truncate text-[11px] leading-tight">
                                  {c.contestName}
                                </h5>
                                <span className="text-[9px] text-muted-foreground font-medium">
                                  {c.date || "Completed"} {c.rank ? `• Rank #${c.rank.toLocaleString()}` : ""}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-black text-xs text-cyan-400 block leading-tight">
                                  {c.newRating}
                                </span>
                                <span className={cn("text-[8px] font-extrabold font-mono", isPos ? "text-emerald-500" : delta < 0 ? "text-rose-500" : "text-muted-foreground")}>
                                  {isPos ? `+${delta}` : delta !== 0 ? delta : "0"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          No rated contest history recorded yet.
                        </div>
                      )}
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
            const dsaRating = (typeof ccStats?.dsaRating === "number" && ccStats.dsaRating > 0) ? ccStats.dsaRating : (rating > 0 ? rating : null);
            const fullySolved = typeof ccStats?.fullySolved === "number" ? ccStats.fullySolved : totalSolved;
            const partiallySolved = typeof ccStats?.partiallySolved === "number" ? ccStats.partiallySolved : Math.max(0, totalSolved - fullySolved);
            const contestsParticipated = typeof ccStats?.contestsParticipated === "number"
              ? ccStats.contestsParticipated
              : (Array.isArray(ccStats?.recentContests) && ccStats.recentContests.length > 0
                ? ccStats.recentContests.length
                : 0);
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
              <div className="space-y-2.5 pt-0.5">
                {/* Profile Header Banner (Ultra Compact 1-Row) */}
                {(ccStats?.name || ccStats?.countryName || ccStats?.institution || ccStats?.avatar || usernameOrHandle) && (
                  <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatarImage
                        src={ccStats?.avatar}
                        name={ccStats?.name || usernameOrHandle}
                        fallbackText={ccStats?.name || usernameOrHandle}
                        borderColor="border-amber-500/25"
                        fallbackBg="bg-amber-500/20 border-amber-500/30"
                        fallbackTextColor="text-amber-500"
                        sizeClass="size-7"
                      />
                      <div className="min-w-0">
                        <a
                          href={ccStats?.profile_url || profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-extrabold text-foreground hover:text-amber-500 truncate leading-tight flex items-center gap-1 transition-colors group/title"
                          title={`Open ${ccStats?.name || usernameOrHandle}'s CodeChef Profile`}
                        >
                          <span className="truncate">{ccStats?.name || usernameOrHandle}</span>
                          <ExternalLink className="size-2.5 opacity-60 group-hover/title:opacity-100 shrink-0" />
                        </a>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground font-medium leading-none mt-0.5">
                          {ccStats?.countryName && (
                            <span className="flex items-center gap-0.5">
                              <Globe className="size-2.5 text-amber-500 shrink-0" />
                              <span className="truncate max-w-[80px]">{ccStats.countryName}</span>
                            </span>
                          )}
                          {ccStats?.institution && (
                            <span className="flex items-center gap-0.5 truncate max-w-[90px]">
                              <Building2 className="size-2.5 text-amber-500 shrink-0" />
                              <span className="truncate">{ccStats.institution}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Star & Division Tier Chips */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-extrabold flex items-center gap-0.5 border-0 shadow-xs", starBadgeBg)}>
                        <Star className="size-2.5 fill-current" /> {stars}
                      </Badge>
                      {division && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 rounded-md font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                          {division}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-Tab Navigation Bar (Overview, Badges, Contests) */}
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/40 rounded-xl border border-border/50 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => setCodechefTab("overview")}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      codechefTab === "overview"
                        ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold"
                    )}
                  >
                    <Code2 className="size-3 shrink-0" />
                    <span className="truncate">Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCodechefTab("badges")}
                    disabled={badges.length === 0}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      codechefTab === "badges"
                        ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold",
                      badges.length === 0 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Award className="size-3 shrink-0" />
                    <span className="truncate">Badges ({badges.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCodechefTab("contests")}
                    disabled={!ccStats?.recentContests || ccStats.recentContests.length === 0}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      codechefTab === "contests"
                        ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold",
                      (!ccStats?.recentContests || ccStats.recentContests.length === 0) && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Trophy className="size-3 shrink-0" />
                    <span className="truncate">Contests ({ccStats?.recentContests?.length || 0})</span>
                  </button>
                </div>

                {/* Tab 1: Overview */}
                {codechefTab === "overview" && (
                  <div className="space-y-2.5">
                    {/* 4 Compact Key Metrics Tiles (2x2 Grid) */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Rating */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="size-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                              <Trophy className="size-2.5" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                              Rating
                            </span>
                          </div>
                          {maxRating && maxRating > 0 && (
                            <span className="text-[9px] font-mono text-muted-foreground font-semibold shrink-0">
                              Peak {maxRating}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className={cn("text-base sm:text-lg font-black font-mono tracking-tight leading-tight", starTextColor)}>
                            {rating > 0 ? rating : "Unrated"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            {dsaRating !== null && dsaRating !== rating ? `DSA: ${dsaRating}` : `${division} Standing`}
                          </div>
                        </div>
                      </div>

                      {/* Global Rank */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                            <Globe className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Global Rank
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {globalRank && globalRank > 0 ? `#${globalRank.toLocaleString()}` : (rating > 0 ? "Active" : "Unrated")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Worldwide Standing
                          </div>
                        </div>
                      </div>

                      {/* Country Rank */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                            <MapPin className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Country Rank
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {countryRank && countryRank > 0 ? `#${countryRank.toLocaleString()}` : (rating > 0 && ccStats?.countryName ? ccStats.countryName : "Unrated")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            {ccStats?.countryName ? "National Standing" : "Country Profile"}
                          </div>
                        </div>
                      </div>

                      {/* Contests Attended */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                            <Flame className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Contests
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {contestsParticipated > 0 ? contestsParticipated.toLocaleString() : "0"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Attended & Rated
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Problem Solving Breakdown */}
                    {totalSolved > 0 && (
                      <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-extrabold text-foreground flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-500" />
                            {totalSolved} Solved
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Fully: {fullySolved} ({fullyPercentage}%) {partiallySolved > 0 ? `• Part: ${partiallySolved}` : ""}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden flex w-full">
                          <div
                            style={{ width: `${Math.max(10, (fullySolved / Math.max(1, totalSolved)) * 100)}%` }}
                            className="bg-emerald-500 h-full rounded-l-full"
                            title={`Fully Solved: ${fullySolved}`}
                          />
                          {partiallySolved > 0 && (
                            <div
                              style={{ width: `${Math.max(5, (partiallySolved / Math.max(1, totalSolved)) * 100)}%` }}
                              className="bg-amber-500 h-full rounded-r-full"
                              title={`Partially Solved: ${partiallySolved}`}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Badges Preview Footer in Overview Tab */}
                    {badges.length > 0 && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-card/40 border border-amber-500/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                            Badges:
                          </span>
                          <div className="flex items-center gap-1 truncate text-[11px] font-bold text-foreground">
                            {badges.slice(0, 3).map((b, i) => (
                              <Badge key={i} variant="outline" className="text-[9px] px-1 py-0 rounded border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 truncate max-w-[100px]">
                                {b.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCodechefTab("badges")}
                          className="text-[10px] font-extrabold text-amber-500 hover:underline shrink-0 flex items-center gap-0.5"
                        >
                          <span>{badges.length} Earned</span>
                          <ArrowUpRight className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Badges */}
                {codechefTab === "badges" && (
                  <div className="p-2.5 rounded-xl bg-card/40 border border-amber-500/20 backdrop-blur-md space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                        <Award className="size-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">CodeChef Badges</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.2 rounded-md border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-extrabold whitespace-nowrap shrink-0">
                        {badges.length} Earned
                      </Badge>
                    </div>

                    {/* Scrollable Badges List */}
                    <div className="max-h-[190px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
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
                            className="group/badge p-2 rounded-xl bg-card border border-border/70 hover:border-amber-500/40 hover:shadow-xs transition-all duration-200 flex items-center gap-2"
                          >
                            <div className={cn("size-8 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/badge:scale-110", iconBg)}>
                              <IconComponent className="size-3.5 fill-current/20" />
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                                <h5 className="text-[11px] font-extrabold text-foreground truncate">
                                  {b.name}
                                </h5>
                                {b.category && (
                                  <Badge variant="outline" className={cn("text-[8px] px-1 py-0 rounded-md font-extrabold shrink-0", categoryBg)}>
                                    {b.category}
                                  </Badge>
                                )}
                              </div>
                              {b.description && (
                                <p className="text-[9px] text-muted-foreground/90 leading-tight line-clamp-1">
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

                {/* Tab 3: Contests */}
                {codechefTab === "contests" && (
                  <div className="p-2.5 rounded-xl bg-card/40 border border-amber-500/20 backdrop-blur-md space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                        <Trophy className="size-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Recent Contests</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.2 rounded-md font-extrabold border-amber-500/40 text-amber-500 bg-amber-500/10">
                        {ccStats?.recentContests?.length || 0} Rated
                      </Badge>
                    </div>

                    <div className="max-h-[190px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                      {(ccStats?.recentContests || []).slice(0, 8).map((c, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded-lg bg-card/80 border border-border/60 flex items-center justify-between gap-2 text-xs hover:border-amber-500/30 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="font-extrabold text-foreground truncate text-[11px] leading-tight">
                              {c.name || c.code}
                            </h5>
                            <span className="text-[9px] text-muted-foreground font-medium">
                              {c.date || "Completed"} {c.rank ? `• Rank #${c.rank.toLocaleString()}` : ""}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-xs text-amber-500 block leading-tight">
                              {c.rating}
                            </span>
                            <span className="text-[8px] text-muted-foreground font-medium">
                              Rating
                            </span>
                          </div>
                        </div>
                      ))}
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
            const totalAuthored = cwStats?.totalAuthored ?? 0;
            const score = cwStats?.score ?? honor;
            const clan = cwStats?.clan;
            const name = cwStats?.name;
            const avatar = cwStats?.avatar;
            const topLangs = cwStats?.languages || [];
            const badges = cwStats?.badges || [];
            const recentChallenges = cwStats?.recentChallenges || [];

            // Rank color mapping
            let rankBg = "bg-rose-600 text-white";
            let accentColor = "text-rose-500 dark:text-rose-400";
            let accentBorder = "border-rose-500/40";
            let accentBg = "bg-rose-500/10";
            if (rankColor === "purple") {
              rankBg = "bg-purple-600 text-white";
              accentColor = "text-purple-400";
              accentBorder = "border-purple-500/40";
              accentBg = "bg-purple-500/10";
            } else if (rankColor === "blue") {
              rankBg = "bg-blue-600 text-white";
              accentColor = "text-blue-400";
              accentBorder = "border-blue-500/40";
              accentBg = "bg-blue-500/10";
            } else if (rankColor === "yellow") {
              rankBg = "bg-amber-500 text-slate-950";
              accentColor = "text-amber-400";
              accentBorder = "border-amber-400/40";
              accentBg = "bg-amber-400/10";
            } else if (rankColor === "white") {
              rankBg = "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white";
              accentColor = "text-slate-400";
              accentBorder = "border-slate-400/40";
              accentBg = "bg-slate-400/10";
            }

            const totalLangScore = topLangs.reduce((acc, l) => acc + (l.score || 1), 0) || 1;

            return (
              <div className="space-y-2.5 pt-0.5">
                {/* Profile Header Banner (Ultra Compact 1-Row) */}
                {(name || clan || avatar || usernameOrHandle) && (
                  <div className={cn("px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2", accentBg, accentBorder)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatarImage
                        src={avatar}
                        name={name || usernameOrHandle}
                        fallbackText={name || usernameOrHandle}
                        borderColor={accentBorder}
                        fallbackBg={accentBg}
                        fallbackTextColor={accentColor}
                        sizeClass="size-7"
                      />
                      <div className="min-w-0">
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-extrabold text-foreground hover:text-rose-400 truncate leading-tight flex items-center gap-1 transition-colors group/title"
                          title={`Open ${name || usernameOrHandle}'s Codewars Profile`}
                        >
                          <span className="truncate">{name || usernameOrHandle}</span>
                          <ExternalLink className="size-2.5 opacity-60 group-hover/title:opacity-100 shrink-0" />
                        </a>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground font-medium leading-none mt-0.5">
                          {clan ? (
                            <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                              <Users className="size-2.5 text-rose-500 shrink-0" />
                              <span className="truncate">{clan}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Flame className="size-2.5 text-rose-500 shrink-0" />
                              <span>Warrior</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Badge className={cn("font-black text-[9px] px-1.5 py-0 rounded-md border-0 shadow-xs flex items-center gap-0.5", rankBg)}>
                        {rankName}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5", accentBorder, accentColor, accentBg)}>
                        <Flame className="size-2.5 fill-current" /> {honor.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Sub-Tab Navigation Bar (Overview, Languages, Badges) */}
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/40 rounded-xl border border-border/50 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => setCodewarsTab("overview")}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      codewarsTab === "overview"
                        ? "bg-rose-600 text-white shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold"
                    )}
                  >
                    <Code2 className="size-3 shrink-0" />
                    <span className="truncate">Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCodewarsTab("languages")}
                    disabled={topLangs.length === 0}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      codewarsTab === "languages"
                        ? "bg-rose-600 text-white shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold",
                      topLangs.length === 0 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <FileCode className="size-3 shrink-0" />
                    <span className="truncate">Languages ({topLangs.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCodewarsTab("badges")}
                    disabled={badges.length === 0 && recentChallenges.length === 0}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      codewarsTab === "badges"
                        ? "bg-rose-600 text-white shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold",
                      badges.length === 0 && recentChallenges.length === 0 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Award className="size-3 shrink-0" />
                    <span className="truncate">Badges ({badges.length})</span>
                  </button>
                </div>

                {/* Tab 1: Overview */}
                {codewarsTab === "overview" && (
                  <div className="space-y-2.5">
                    {/* 4 Compact Key Metrics Tiles (2x2 Grid) */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Honor & Rank */}
                      <div className={cn("p-2.5 rounded-xl bg-card/60 border border-border/70 transition-all duration-200 shadow-xs space-y-1 hover:border-rose-500/40")}>
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <div className={cn("size-5 rounded-md flex items-center justify-center shrink-0", accentBg, accentBorder, accentColor)}>
                              <Flame className="size-2.5" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                              Honor
                            </span>
                          </div>
                          <Badge className={cn("font-black text-[9px] px-1 py-0 rounded-md border-0 shrink-0", rankBg)}>
                            {rankName}
                          </Badge>
                        </div>
                        <div>
                          <div className={cn("text-base sm:text-lg font-black font-mono tracking-tight leading-tight", accentColor)}>
                            {honor.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Rank Score: {score.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Global Leaderboard */}
                      <div className={cn("p-2.5 rounded-xl bg-card/60 border border-border/70 transition-all duration-200 shadow-xs space-y-1 hover:border-rose-500/40")}>
                        <div className="flex items-center gap-1 min-w-0">
                          <div className={cn("size-5 rounded-md flex items-center justify-center shrink-0", accentBg, accentBorder, accentColor)}>
                            <Globe className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Leaderboard
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {leaderboardPos ? `#${leaderboardPos.toLocaleString()}` : (honor > 0 ? "Top Warrior" : "Unranked")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Global Standing
                          </div>
                        </div>
                      </div>

                      {/* Katas Completed */}
                      <div className={cn("p-2.5 rounded-xl bg-card/60 border border-border/70 transition-all duration-200 shadow-xs space-y-1 hover:border-rose-500/40")}>
                        <div className="flex items-center gap-1 min-w-0">
                          <div className={cn("size-5 rounded-md flex items-center justify-center shrink-0", accentBg, accentBorder, accentColor)}>
                            <CheckCircle2 className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Katas Solved
                          </span>
                        </div>
                        <div>
                          <div className={cn("text-base sm:text-lg font-black font-mono tracking-tight leading-tight", accentColor)}>
                            {totalSolved.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Completed Challenges
                          </div>
                        </div>
                      </div>

                      {/* Authored Katas */}
                      <div className={cn("p-2.5 rounded-xl bg-card/60 border border-border/70 transition-all duration-200 shadow-xs space-y-1 hover:border-rose-500/40")}>
                        <div className="flex items-center gap-1 min-w-0">
                          <div className={cn("size-5 rounded-md flex items-center justify-center shrink-0", accentBg, accentBorder, accentColor)}>
                            <Code2 className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Authored
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {totalAuthored}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Created Challenges
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compact Language Mastery Strip */}
                    {topLangs.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <FileCode className={cn("size-3", accentColor)} />
                            Language Distribution
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {topLangs.length} Active Languages
                          </span>
                        </div>

                        {/* Multi-segment Progress Bar */}
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden flex gap-0.5 p-0.5">
                          {topLangs.slice(0, 5).map((l, idx) => {
                            const pct = Math.max(8, Math.round((l.score / totalLangScore) * 100));
                            return (
                              <div
                                key={idx}
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: getLanguageColor(l.language),
                                }}
                                title={`${l.language}: ${l.score} pts (${l.rankName || ""})`}
                              />
                            );
                          })}
                        </div>

                        {/* Top Language Chips */}
                        <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                          {topLangs.slice(0, 3).map((l, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-[10px] font-bold">
                              <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: getLanguageColor(l.language) }} />
                              <span className="text-foreground capitalize">{l.language}</span>
                              {l.rankName && (
                                <span className={cn("text-[9px] px-1 py-0 rounded font-black", accentBg, accentColor)}>
                                  {l.rankName}
                                </span>
                              )}
                            </div>
                          ))}
                          {topLangs.length > 3 && (
                            <button
                              type="button"
                              onClick={() => setCodewarsTab("languages")}
                              className={cn("text-[10px] font-extrabold hover:underline ml-auto", accentColor)}
                            >
                              +{topLangs.length - 3} more →
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inline Badges Preview Footer */}
                    {badges.length > 0 && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-card/40 border border-border/40">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <Award className={cn("size-3.5 shrink-0", accentColor)} />
                          <div className="flex items-center gap-1 overflow-hidden">
                            {badges.slice(0, 2).map((b, idx) => {
                              const badgeName = typeof b === "string" ? b : (b as any)?.name || "Badge";
                              return (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className={cn("text-[9px] px-1.5 py-0 rounded-md font-bold truncate max-w-[120px]", accentBorder, accentColor, accentBg)}
                                >
                                  {badgeName}
                                </Badge>
                              );
                            })}
                            {badges.length > 2 && (
                              <span className="text-[10px] text-muted-foreground font-bold shrink-0">
                                +{badges.length - 2}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCodewarsTab("badges")}
                          className={cn("text-[10px] font-extrabold hover:underline shrink-0 flex items-center gap-0.5", accentColor)}
                        >
                          View all ({badges.length}) →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Languages */}
                {codewarsTab === "languages" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs px-0.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Proficiency by Language
                      </span>
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 rounded-md font-extrabold", accentBorder, accentColor, accentBg)}>
                        {topLangs.length} Mastered
                      </Badge>
                    </div>

                    <div className="max-h-[190px] overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
                      {topLangs.map((item, idx) => {
                        const pct = Math.min(100, Math.max(10, Math.round((item.score / totalLangScore) * 100)));
                        const langColor = getLanguageColor(item.language);

                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-card/60 border border-border/60 hover:border-rose-500/40 transition-all duration-200 shadow-2xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: langColor }} />
                                <span className="text-xs font-black text-foreground truncate capitalize">
                                  {item.language}
                                </span>
                                {item.rankName && (
                                  <Badge variant="outline" className={cn("text-[9px] px-1 py-0 rounded font-black shrink-0", accentBorder, accentColor, accentBg)}>
                                    {item.rankName}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                                {item.totalCompleted !== undefined && (
                                  <span className="text-muted-foreground font-semibold">
                                    {item.totalCompleted} solved
                                  </span>
                                )}
                                <span className={cn("font-black", accentColor)}>
                                  {item.score.toLocaleString()} pts
                                </span>
                              </div>
                            </div>

                            <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: langColor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 3: Badges */}
                {codewarsTab === "badges" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs px-0.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Milestones & Badges
                      </span>
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 rounded-md font-extrabold", accentBorder, accentColor, accentBg)}>
                        {badges.length} Earned
                      </Badge>
                    </div>

                    <div className="max-h-[190px] overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
                      {badges.map((b, idx) => {
                        const badgeName = typeof b === "string" ? b : (b as any)?.name || "Achievement";
                        const badgeDesc = typeof b === "string" ? "Codewars Achievement" : (b as any)?.description || (b as any)?.category || "Codewars Achievement";
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-card/60 border border-border/60 hover:border-rose-500/40 transition-all duration-200 flex items-center gap-2.5 shadow-2xs"
                          >
                            <div className={cn("size-6 rounded-lg flex items-center justify-center shrink-0", accentBg, accentBorder, accentColor)}>
                              <Award className="size-3" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-foreground block truncate">{badgeName}</span>
                              <span className="text-[10px] text-muted-foreground font-medium block truncate">
                                {badgeDesc}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {recentChallenges.length > 0 && (
                        <div className="pt-2 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block px-1">
                            Recent Katas Solved
                          </span>
                          {recentChallenges.slice(0, 3).map((rc, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-muted/30 border border-border/50 text-[10px] flex items-center justify-between gap-2">
                              <span className="font-bold text-foreground truncate">{rc.name}</span>
                              <span className="text-muted-foreground shrink-0 font-mono">
                                {rc.completedAt ? new Date(rc.completedAt).toLocaleDateString() : "Solved"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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
                {(avatar || displayName || institution || usernameOrHandle) && (
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <UserAvatarImage
                      src={avatar}
                      name={displayName || usernameOrHandle}
                      fallbackText={displayName || usernameOrHandle}
                      borderColor="border-emerald-500/20"
                      fallbackBg="bg-emerald-500/20 border-emerald-500/30"
                      fallbackTextColor="text-emerald-600 dark:text-emerald-400"
                      sizeClass="size-11"
                    />
                    <div className="min-w-0 flex-1">
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-extrabold text-foreground hover:text-emerald-500 truncate flex items-center gap-1 transition-colors group/title"
                        title={`Open ${displayName || usernameOrHandle}'s GeeksforGeeks Profile`}
                      >
                        <span className="truncate">{displayName || usernameOrHandle}</span>
                        <ExternalLink className="size-3 opacity-60 group-hover/title:opacity-100 shrink-0" />
                      </a>
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

            // Algorithm Stats
            const rating = atcoderStats?.rating ?? 0;
            const maxRating = atcoderStats?.maxRating ?? rating;
            const totalSolved = atcoderStats?.totalSolved ?? 0;
            const competitionsCount = atcoderStats?.competitionsCount ?? 0;
            const rankName = atcoderStats?.rank || "Unrated";
            const globalRank = atcoderStats?.globalRank;
            const highestPerformance = atcoderStats?.highestPerformance;
            const bestRank = atcoderStats?.bestRank;
            const acceptedCountRank = atcoderStats?.acceptedCountRank;
            const ratedPointSum = atcoderStats?.ratedPointSum;
            const ratedPointSumRank = atcoderStats?.ratedPointSumRank;
            const avatar = atcoderStats?.avatar;
            const country = atcoderStats?.country;
            const countryFlag = atcoderStats?.countryFlag;
            const affiliation = atcoderStats?.affiliation;
            const birthYear = atcoderStats?.birthYear;
            const wins = atcoderStats?.wins;
            const lastCompeted = atcoderStats?.lastCompeted;
            const recentContests = atcoderStats?.recentContests || [];

            // Heuristic Stats
            const heuristicRating = atcoderStats?.heuristicRating ?? 0;
            const heuristicMaxRating = atcoderStats?.heuristicMaxRating ?? heuristicRating;
            const heuristicRank = atcoderStats?.heuristicRank || (heuristicRating > 0 ? "Rated" : "Unrated");
            const heuristicCompetitionsCount = atcoderStats?.heuristicCompetitionsCount ?? 0;
            const heuristicTotalCompetitions = atcoderStats?.heuristicTotalCompetitions ?? heuristicCompetitionsCount;
            const heuristicHighestPerformance = atcoderStats?.heuristicHighestPerformance;
            const heuristicBestRank = atcoderStats?.heuristicBestRank;
            const heuristicRecentContests = atcoderStats?.heuristicRecentContests || [];

            const getRankBadgeProps = (rk: string, r: number) => {
              const lower = (rk || "").toLowerCase();
              if (r >= 2800 || lower.includes("red") || lower.includes("king") || lower.includes("dan")) {
                return {
                  bg: "bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400",
                  glow: "from-red-500/20 to-red-600/5 border-red-500/30",
                  text: rk || "Red",
                  textColor: "text-red-500 dark:text-red-400",
                  badgeBg: "bg-red-600 text-white font-extrabold",
                };
              }
              if (r >= 2400 || lower.includes("orange")) {
                return {
                  bg: "bg-orange-500/10 border-orange-500/30 text-orange-500 dark:text-orange-400",
                  glow: "from-orange-500/20 to-orange-600/5 border-orange-500/30",
                  text: rk || "Orange",
                  textColor: "text-orange-500 dark:text-orange-400",
                  badgeBg: "bg-orange-500 text-white font-extrabold",
                };
              }
              if (r >= 2000 || lower.includes("yellow")) {
                return {
                  bg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500 dark:text-yellow-400",
                  glow: "from-yellow-500/20 to-amber-600/5 border-yellow-500/30",
                  text: rk || "Yellow",
                  textColor: "text-yellow-500 dark:text-yellow-400",
                  badgeBg: "bg-yellow-500 text-slate-950 font-extrabold",
                };
              }
              if (r >= 1600 || lower.includes("blue")) {
                return {
                  bg: "bg-blue-500/10 border-blue-500/30 text-blue-500 dark:text-blue-400",
                  glow: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
                  text: rk || "Blue",
                  textColor: "text-blue-500 dark:text-blue-400",
                  badgeBg: "bg-blue-600 text-white font-extrabold",
                };
              }
              if (r >= 1200 || lower.includes("cyan")) {
                return {
                  bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-500 dark:text-cyan-400",
                  glow: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30",
                  text: rk || "Cyan",
                  textColor: "text-cyan-500 dark:text-cyan-400",
                  badgeBg: "bg-cyan-600 text-white font-extrabold",
                };
              }
              if (r >= 800 || lower.includes("green")) {
                return {
                  bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400",
                  glow: "from-emerald-500/20 to-teal-600/5 border-emerald-500/30",
                  text: rk || "Green",
                  textColor: "text-emerald-500 dark:text-emerald-400",
                  badgeBg: "bg-emerald-600 text-white font-extrabold",
                };
              }
              if (r >= 400 || lower.includes("brown")) {
                return {
                  bg: "bg-amber-700/10 border-amber-700/30 text-amber-700 dark:text-amber-500",
                  glow: "from-amber-700/20 to-amber-800/5 border-amber-700/30",
                  text: rk || "Brown",
                  textColor: "text-amber-700 dark:text-amber-500",
                  badgeBg: "bg-amber-700 text-white font-extrabold",
                };
              }
              if (r > 0 || lower.includes("gray")) {
                return {
                  bg: "bg-slate-500/10 border-slate-500/30 text-slate-400",
                  glow: "from-slate-500/20 to-slate-600/5 border-slate-500/30",
                  text: rk || "Gray",
                  textColor: "text-slate-400",
                  badgeBg: "bg-slate-600 text-white font-extrabold",
                };
              }
              return {
                bg: "bg-muted/40 border-border text-muted-foreground",
                glow: "from-muted/20 to-muted/5 border-border",
                text: "Unrated",
                textColor: "text-muted-foreground",
                badgeBg: "bg-muted text-muted-foreground font-bold",
              };
            };

            const activeProps = atcoderTab === "heuristic"
              ? getRankBadgeProps(heuristicRank, heuristicRating)
              : getRankBadgeProps(rankName, rating);

            const totalContestsCount = recentContests.length + heuristicRecentContests.length;

            return (
              <div className="space-y-2.5 pt-0.5">
                {/* Profile Header Banner (Ultra Compact 1-Row) */}
                {(avatar || country || affiliation || wins !== null || usernameOrHandle) && (
                  <div className="px-2.5 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/15 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatarImage
                        src={avatar}
                        name={usernameOrHandle}
                        fallbackText={usernameOrHandle}
                        borderColor="border-cyan-500/25"
                        fallbackBg="bg-cyan-500/20 border-cyan-500/30"
                        fallbackTextColor="text-cyan-500"
                        sizeClass="size-7"
                      />
                      <div className="min-w-0">
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-extrabold text-foreground hover:text-cyan-400 truncate leading-tight flex items-center gap-1 transition-colors group/title"
                          title={`Open ${usernameOrHandle}'s AtCoder Profile`}
                        >
                          <span className="truncate">{usernameOrHandle}</span>
                          {countryFlag && (
                            <img src={countryFlag} alt={country || ""} className="h-3 w-auto inline rounded-xs shrink-0" />
                          )}
                          <ExternalLink className="size-2.5 opacity-60 group-hover/title:opacity-100 shrink-0" />
                        </a>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground font-medium leading-none mt-0.5">
                          {country && <span>{country}</span>}
                          {affiliation && (
                            <span className="flex items-center gap-0.5 truncate max-w-[90px]">
                              <Building2 className="size-2.5 text-cyan-500 shrink-0" />
                              <span className="truncate">{affiliation}</span>
                            </span>
                          )}
                          {birthYear && <span>Born: {birthYear}</span>}
                        </div>
                      </div>
                    </div>

                    {typeof wins === "number" && wins > 0 && (
                      <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                        <Trophy className="size-2.5 fill-amber-500" />
                        {wins} {wins === 1 ? "Win" : "Wins"}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Sub-Tab Navigation Bar (Algo, Heuristic, Contests) */}
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/40 rounded-xl border border-border/50 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => setAtcoderTab("algo")}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      atcoderTab === "algo"
                        ? "bg-cyan-500 text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold"
                    )}
                  >
                    <Code2 className="size-3 shrink-0" />
                    <span className="truncate">Algo ({rating})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAtcoderTab("heuristic")}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      atcoderTab === "heuristic"
                        ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold"
                    )}
                  >
                    <Trophy className="size-3 shrink-0" />
                    <span className="truncate">AHC ({heuristicRating > 0 ? heuristicRating : "Unrated"})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAtcoderTab("contests")}
                    disabled={totalContestsCount === 0}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px]",
                      atcoderTab === "contests"
                        ? "bg-cyan-500 text-slate-950 shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground font-semibold",
                      totalContestsCount === 0 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Flame className="size-3 shrink-0" />
                    <span className="truncate">Contests ({totalContestsCount})</span>
                  </button>
                </div>

                {/* Tab 1: Algorithm Mode */}
                {atcoderTab === "algo" && (
                  <div className="space-y-2.5">
                    {/* 4 Compact Key Metrics Tiles (2x2 Grid) */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Rating */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="size-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                              <Trophy className="size-2.5" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                              Rating
                            </span>
                          </div>
                          <Badge className={cn("text-[9px] px-1 py-0 rounded-md font-extrabold border-0 shrink-0", activeProps.badgeBg)}>
                            {activeProps.text}
                          </Badge>
                        </div>
                        <div>
                          <div className={cn("text-base sm:text-lg font-black font-mono tracking-tight leading-tight", activeProps.textColor)}>
                            {rating}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Highest: {maxRating > 0 ? maxRating : rating}
                          </div>
                        </div>
                      </div>

                      {/* Global Rank */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                            <Globe className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Global Rank
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {globalRank && globalRank > 0 ? `#${globalRank.toLocaleString()}` : (rating > 0 ? "Top Tier" : "Unranked")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Worldwide Standing
                          </div>
                        </div>
                      </div>

                      {/* Tasks Solved */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                            <CheckCircle2 className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Tasks Solved
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-cyan-400 tracking-tight leading-tight">
                            {totalSolved.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            {acceptedCountRank ? `Rank #${acceptedCountRank.toLocaleString()}` : "Accepted Tasks (AC)"}
                          </div>
                        </div>
                      </div>

                      {/* Rated Matches & Performance */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-cyan-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                            <Flame className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Matches
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {competitionsCount > 0 ? competitionsCount.toLocaleString() : "0"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            {highestPerformance ? `Perf: ${highestPerformance}` : (lastCompeted ? `Last: ${lastCompeted}` : "Attended & Rated")}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rated Point Sum Summary */}
                    {typeof ratedPointSum === "number" && ratedPointSum > 0 && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-card/60 border border-border/70 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                            Rated Point Sum
                          </span>
                          <span className="text-[9px] text-muted-foreground font-medium truncate">
                            {ratedPointSumRank ? `Rank #${ratedPointSumRank.toLocaleString()}` : "Contest Points"}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black font-mono text-cyan-400 block leading-tight">
                            {ratedPointSum.toLocaleString()} pts
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Quick Contests Preview Footer */}
                    {recentContests.length > 0 && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-card/40 border border-cyan-500/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 overflow-hidden text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                            Latest:
                          </span>
                          <span className="text-[11px] font-bold text-foreground truncate">
                            {recentContests[0]?.name || "Contest"} {recentContests[0]?.rank ? `(#${recentContests[0].rank})` : ""}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAtcoderTab("contests")}
                          className="text-[10px] font-extrabold text-cyan-400 hover:underline shrink-0 flex items-center gap-0.5"
                        >
                          <span>{recentContests.length} Contests</span>
                          <ArrowUpRight className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Heuristic Mode */}
                {atcoderTab === "heuristic" && (
                  <div className="space-y-2.5">
                    {/* 4 Compact Key Metrics Tiles (2x2 Grid) */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Heuristic Rating */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="size-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                              <Trophy className="size-2.5" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                              AHC Rating
                            </span>
                          </div>
                          <Badge className={cn("text-[9px] px-1 py-0 rounded-md font-extrabold border-0 shrink-0", activeProps.badgeBg)}>
                            {activeProps.text}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-amber-500 tracking-tight leading-tight">
                            {heuristicRating > 0 ? heuristicRating : "Unrated"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Highest: {heuristicMaxRating > 0 ? heuristicMaxRating : (heuristicRating > 0 ? heuristicRating : "Unrated")}
                          </div>
                        </div>
                      </div>

                      {/* Best AHC Standing */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                            <Globe className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Best Rank
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {heuristicBestRank ? `#${heuristicBestRank.toLocaleString()}` : (heuristicRating > 0 ? "Top Solver" : "Unranked")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Best AHC Finish
                          </div>
                        </div>
                      </div>

                      {/* Peak Heuristic Performance */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                            <Award className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Peak Perf
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-amber-500 tracking-tight leading-tight">
                            {heuristicHighestPerformance ? heuristicHighestPerformance.toLocaleString() : (heuristicRating > 0 ? heuristicRating : "N/A")}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            Highest AHC Performance
                          </div>
                        </div>
                      </div>

                      {/* Rated AHCs */}
                      <div className="p-2.5 rounded-xl bg-card/60 border border-border/70 hover:border-amber-500/40 transition-all duration-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className="size-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                            <Flame className="size-2.5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground truncate">
                            Rated AHCs
                          </span>
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-black font-mono text-foreground tracking-tight leading-tight">
                            {heuristicCompetitionsCount}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                            {heuristicTotalCompetitions > heuristicCompetitionsCount ? `${heuristicTotalCompetitions} Total Events` : "Rated Contests"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick AHC Contests Preview Footer */}
                    {heuristicRecentContests.length > 0 && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-card/40 border border-amber-500/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 overflow-hidden text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                            Latest AHC:
                          </span>
                          <span className="text-[11px] font-bold text-foreground truncate">
                            {heuristicRecentContests[0]?.name || "AHC Contest"} {heuristicRecentContests[0]?.rank ? `(#${heuristicRecentContests[0].rank})` : ""}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAtcoderTab("contests")}
                          className="text-[10px] font-extrabold text-amber-500 hover:underline shrink-0 flex items-center gap-0.5"
                        >
                          <span>{heuristicRecentContests.length} AHCs</span>
                          <ArrowUpRight className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Combined Contests Timeline */}
                {atcoderTab === "contests" && (
                  <div className="p-2.5 rounded-xl bg-card/40 border border-cyan-500/20 backdrop-blur-md space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground min-w-0 truncate">
                        <Trophy className="size-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Recent AtCoder Contests</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.2 rounded-md font-extrabold border-cyan-500/40 text-cyan-400 bg-cyan-500/10">
                        {totalContestsCount} Rated
                      </Badge>
                    </div>

                    <div className="max-h-[190px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                      {[...recentContests, ...heuristicRecentContests].slice(0, 8).map((c, idx) => {
                        const isAhc = heuristicRecentContests.includes(c) || (c.name || "").includes("AHC");
                        const accentColor = isAhc ? "text-amber-500" : "text-cyan-400";

                        return (
                          <div
                            key={idx}
                            className="p-1.5 rounded-lg bg-card/80 border border-border/60 flex items-center justify-between gap-2 text-xs hover:border-cyan-500/30 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <h5 className="font-extrabold text-foreground truncate text-[11px] leading-tight">
                                  {c.name || c.code}
                                </h5>
                                {isAhc && (
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 rounded font-black border-amber-500/40 text-amber-500 bg-amber-500/10 shrink-0">
                                    AHC
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[9px] text-muted-foreground font-medium">
                                {c.date || "Completed"} {c.rank ? `• Rank #${c.rank.toLocaleString()}` : ""} {c.performance ? `• Perf: ${c.performance}` : ""}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={cn("font-mono font-black text-xs block leading-tight", accentColor)}>
                                {c.rating}
                              </span>
                              <span className="text-[8px] text-muted-foreground font-medium">
                                Rating
                              </span>
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
        ) : null}
      </div>
    </div>
  );
}
