import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Layers,
    RefreshCw,
    Flame,
    Trophy,
    Sparkles,
    CheckCircle2,
    ArrowUpRight,
    Code2,
    Activity,
    ExternalLink,
    Zap,
    Globe,
    Lock,
    BarChart2,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- BRAND SVG FALLBACK ICONS ---

const LeetCodeIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.102 17.93a4.522 4.522 0 0 1-1.396 2.372 4.47 4.47 0 0 1-2.991 1.139 4.468 4.468 0 0 1-3.21-1.332L3.109 14.71a4.52 4.52 0 0 1-.954-1.639 4.444 4.444 0 0 1-.035-2.88 4.502 4.502 0 0 1 1.002-1.584l5.378-5.378a4.498 4.498 0 0 1 3.197-1.334c1.201 0 2.331.47 3.178 1.321l.006.006.918.918a.747.747 0 0 1-1.056 1.056l-.918-.918a3.003 3.003 0 0 0-2.128-.885 3.002 3.002 0 0 0-2.134.891L4.21 9.77a3.002 3.002 0 0 0-.668 1.056 2.96 2.96 0 0 0 .023 1.92 3.013 3.013 0 0 0 .637 1.093l5.395 5.397a2.98 2.98 0 0 0 2.14.888 2.98 2.98 0 0 0 1.994-.76 3.015 3.015 0 0 0 .931-1.581.75.75 0 1 1 1.47.337zm2.493-4.577a.75.75 0 0 1-.53-.22L13.111 8.18a.75.75 0 1 1 1.06-1.06l4.954 4.953a.75.75 0 0 1-.53 1.28z" />
    </svg>
);

const CodeforcesIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 7.5a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 3 0V9A1.5 1.5 0 0 0 4.5 7.5zm7.5-4.5a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 3 0V4.5A1.5 1.5 0 0 0 12 3zm7.5 7.5a1.5 1.5 0 0 0-1.5 1.5v4.5a1.5 1.5 0 0 0 3 0V12a1.5 1.5 0 0 0-1.5-1.5z" />
    </svg>
);

const HackerRankIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L1.608 6v12L12 24l10.392-6V6L12 0zm5.127 16.03h-2.146v-3.791H9.019v3.791H6.873V7.97h2.146v3.79h5.962V7.97h2.146v8.06z" />
    </svg>
);

const CodeChefIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.2574.0039c-.37.0101-.7353.041-1.1003.095C9.6164.153 9.0766.4236 8.482.694c-.757.3244-1.5147.6486-2.2176.7027-1.1896.3785-1.568.919-1.8925 1.3516 0 .054-.054.1079-.054.1079-.4325.865-.4873 1.73-.325 2.5952.1621.5407.3786 1.0282.5408 1.5148.3785 1.0274.7578 2.0007.92 3.1362.1622.3244.3235.7571.4316 1.1897.2704.8651.542 1.8383 1.353 2.5952l.0057-.0028c.0175.0183.0301.0387.0482.0568.0072-.0036.0141-.0063.0213-.0099l-.0213-.5849c.6489-.9733 1.5673-1.6221 2.865-1.8925.5195-.1093 1.081-.1497 1.6625-.1278a8.7733 8.7733 0 0 1 1.7988.2357c1.4599.3785 2.595 1.1358 2.6492 1.7846.0273.3549.0398.6952.0326 1.0364-.001.064-.0046.1285-.007.193l.1362.0682c.075-.0375.1424-.107.2059-.1902.0008-.001.002-.002.0028-.0028.0018-.0023.0039-.0061.0057-.0085.0396-.0536.0747-.1236.1107-.1931.0188-.0377.0372-.0866.0554-.1292.2048-.4622.362-1.1536.538-1.9635.0541-.2703.1092-.4864.1633-.7027.4326-.9733 1.0266-1.8382 1.6213-2.6492.9733-1.3518 1.8928-2.5962 1.7846-4.0561-1.784-3.4608-4.2718-4.0017-5.5695-4.272-.2163-.0541-.3233-.0539-.4856-.108-1.3382-.2433-2.4945-.3953-3.6046-.3648zm5.0428 14.3788a9.8602 9.8602 0 0 0-.0326-.9824c-.0541-.703-1.1892-1.46-2.7032-1.8386-.588-.1336-1.1764-.2142-1.7448-.2356-.539-.0137-1.0657.0248-1.5546.1277-1.2436.2704-2.2162.9193-2.811 1.8925l.0511 1.431c.6672-.3558 1.7326-.8747 3.139-.9994.0662-.0059.1368-.0059.2044-.0099.1177-.013.2667-.044.4444-.044 1.6075 0 3.2682.5336 4.8767 1.6483.039-.2744.0611-.549.071-.8234l.044.0227c.0028-.0622.0143-.1268.0156-.1888z" />
    </svg>
);

const GitHubIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
);

const GeeksForGeeksIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
);

const CodewarsIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2L19.5 8 12 11.8 4.5 8 12 4.2zM4.5 9.8l6.75 3.4v6.6L4.5 16.4V9.8zm15 6.6l-6.75 3.4v-6.6l6.75-3.4v6.6z" />
    </svg>
);

const WakaTimeIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2A10 10 0 1 0 22 12 10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
);

const AtCoderIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L1 21h22L12 2zm0 4.5L18.5 18h-13L12 6.5z" />
    </svg>
);

const HuggingFaceIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-3 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-6.75 6.5a.75.75 0 0 1 1.06 0 4.25 4.25 0 0 0 5.38 0 .75.75 0 1 1 1.06 1.06 5.75 5.75 0 0 1-7.5 0 .75.75 0 0 1 0-1.06z" />
    </svg>
);

const ChessIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a3 3 0 0 0-3 3c0 .8.3 1.5.8 2.1C8.6 8.1 8 9.5 8 11c0 1.2.4 2.3 1.1 3.1C7.8 15.3 7 17 7 19h10c0-2-.8-3.7-2.1-4.9.7-.8 1.1-1.9 1.1-3.1 0-1.5-.6-2.9-1.8-3.9.5-.6.8-1.3.8-2.1a3 3 0 0 0-3-3zm-6 19v2h12v-2H6z" />
    </svg>
);

const HackerEarthIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm-1 14H8V8h3v8zm5 0h-3V8h3v8z" />
    </svg>
);

const CredlyIcon = ({ className = "size-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.8L19 8v8l-7 3.5L5 16V8l7-3.2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
);

// --- BRAND LOGO COMPONENT WITH HIGH-CONTRAST LIGHT CONTAINER & FALLBACK ---

interface PlatformLogoProps {
    logoUrl?: string;
    name: string;
    fallbackIcon: React.ComponentType<{ className?: string }>;
    className?: string;
    id?: string;
}

export function PlatformLogo({ logoUrl, name, fallbackIcon: FallbackIcon, className = "size-7", id }: PlatformLogoProps) {
    const [hasError, setHasError] = useState(false);

    if (!logoUrl || hasError) {
        return <FallbackIcon className={cn(className, "object-contain text-slate-900")} />;
    }

    return (
        <img
            src={logoUrl}
            alt={`${name} official logo`}
            onError={() => setHasError(true)}
            className={cn(
                className,
                "object-contain transition-transform duration-300 group-hover:scale-110"
            )}
            loading="lazy"
        />
    );
}

// --- PLATFORMS DATA MODEL ---

export interface PlatformItem {
    id: string;
    name: string;
    category: "Competitive Coding" | "Git" | "Skill Verification" | "AI & Speciality" | "Git & Time Analytics" | "Practice & Skill Verification";
    description: string;
    logoUrl: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    glowColor: string;
    badgeBg: string;
    badgeText: string;
    syncedMetrics: string[];
    sampleStatLabel: string;
    sampleStatValue: string;
    popularRatingTier?: string;
    featuredTag?: string;
}

const CONNECTED_PLATFORMS: PlatformItem[] = [
    {
        id: "leetcode",
        name: "LeetCode",
        category: "Competitive Coding",
        description: "Sync total solved (Easy/Medium/Hard), contest rating, global ranking, badges & active daily submission streak.",
        logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/leetcode/leetcode-original.svg",
        icon: LeetCodeIcon,
        accentColor: "from-amber-500/20 via-orange-500/30 to-slate-900",
        glowColor: "rgba(245, 158, 11, 0.45)",
        badgeBg: "bg-amber-500/10 border-amber-500/30",
        badgeText: "text-amber-400",
        syncedMetrics: ["Solved Breakdown", "Contest Rating & Rank", "Badges & Heatmap"],
        sampleStatLabel: "Problems Solved",
        sampleStatValue: "1,420+",
        popularRatingTier: "Guardian / Knight",

    },
    {
        id: "codeforces",
        name: "Codeforces",
        category: "Competitive Coding",
        description: "Import max Elo rating, current title rank, rating graphs, contest history, and solved submission counts.",
        logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codeforces/codeforces-original.svg",
        icon: CodeforcesIcon,
        accentColor: "from-blue-500/20 via-cyan-500/30 to-slate-900",
        glowColor: "rgba(59, 130, 246, 0.45)",
        badgeBg: "bg-blue-500/10 border-blue-500/30",
        badgeText: "text-blue-400",
        syncedMetrics: ["Max Elo & Rank Title", "Contest Rating Graph", "Submission Accuracy"],
        sampleStatLabel: "Max Contest Rating",
        sampleStatValue: "1984 (Master)",
        popularRatingTier: "Candidate Master",

    },
    {
        id: "github",
        name: "GitHub",
        category: "Git",
        description: "Aggregate overall repository contributions, stars, public pull requests, commits, and 365-day contribution heatmaps.",
        logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
        icon: GitHubIcon,
        accentColor: "from-purple-500/20 via-slate-700/40 to-slate-900",
        glowColor: "rgba(168, 85, 247, 0.45)",
        badgeBg: "bg-purple-500/10 border-purple-500/30",
        badgeText: "text-purple-300",
        syncedMetrics: ["365-Day Commit Heatmap", "Public Repos & Stars", "Merged PRs & Issues"],
        sampleStatLabel: "Total Contributions",
        sampleStatValue: "2,840 Commits",

    },
    {
        id: "codechef",
        name: "CodeChef",
        category: "Competitive Coding",
        description: "Display star level (1★ to 7★), global & country ranks, contest Division progress, and total problem count.",
        logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/codechef.svg",
        icon: CodeChefIcon,
        accentColor: "from-amber-700/20 via-yellow-600/30 to-slate-900",
        glowColor: "rgba(180, 83, 9, 0.45)",
        badgeBg: "bg-yellow-600/10 border-yellow-600/30",
        badgeText: "text-yellow-400",
        syncedMetrics: ["Star Rating Level", "Global & Country Rank", "Long/Star Contests"],
        sampleStatLabel: "Star Rating",
        sampleStatValue: "5★ (2140)",
        popularRatingTier: "5★ Division 1",
    },
    {
        id: "hackerrank",
        name: "HackerRank",
        category: "Skill Verification",
        description: "Showcase verified skill badges (Problem Solving, Python, SQL), star tiers, domain scores, and certificates.",
        logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/hackerrank/hackerrank-original.svg",
        icon: HackerRankIcon,
        accentColor: "from-emerald-500/20 via-green-600/30 to-slate-900",
        glowColor: "rgba(16, 185, 129, 0.45)",
        badgeBg: "bg-emerald-500/10 border-emerald-500/30",
        badgeText: "text-emerald-400",
        syncedMetrics: ["Verified Certificates", "Skill Badges (Gold/5★)", "Domain Scores"],
        sampleStatLabel: "Skill Badges",
        sampleStatValue: "6 Gold Stars",
    },

    {
        id: "wakatime",
        name: "WakaTime",
        category: "Git",
        description: "Automatically log real coding duration, active IDE languages breakdown, and weekly productive hours in background.",
        logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/wakatime.svg",
        icon: WakaTimeIcon,
        accentColor: "from-cyan-500/20 via-blue-600/30 to-slate-900",
        glowColor: "rgba(6, 182, 212, 0.45)",
        badgeBg: "bg-cyan-500/10 border-cyan-500/30",
        badgeText: "text-cyan-300",
        syncedMetrics: ["IDE Duration Sync", "Language Breakdown %", "Daily Productivity Graph"],
        sampleStatLabel: "Weekly Coding Time",
        sampleStatValue: "38h 45m",

    },
    {
        id: "atcoder",
        name: "AtCoder",
        category: "Competitive Coding",
        description: "Track official AtCoder ratings (Gray → Red), contest performances in ABC/ARC/AGC, and solved problem counts.",
        logoUrl: "https://img.atcoder.jp/assets/atcoder.png",
        icon: AtCoderIcon,
        accentColor: "from-sky-400/20 via-indigo-500/30 to-slate-900",
        glowColor: "rgba(56, 189, 248, 0.45)",
        badgeBg: "bg-sky-400/10 border-sky-400/30",
        badgeText: "text-sky-300",
        syncedMetrics: ["Rating Color Tiers", "ABC/ARC Performance", "Algorithm Solves"],
        sampleStatLabel: "AtCoder Rating",
        sampleStatValue: "1640 (Blue)",
    },
    {
        id: "codewars",
        name: "Codewars",
        category: "Skill Verification",
        description: "Sync Kyu/Dan belt rank progression (8 Kyu → 1 Dan), accumulated honor score, and leaderboard percentile.",
        logoUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codewars/codewars-original.svg",
        icon: CodewarsIcon,
        accentColor: "from-red-600/20 via-rose-500/30 to-slate-900",
        glowColor: "rgba(225, 29, 72, 0.45)",
        badgeBg: "bg-red-600/10 border-red-600/30",
        badgeText: "text-red-400",
        syncedMetrics: ["Kyu Belt Rank", "Honor Points Total", "Kata Solved Count"],
        sampleStatLabel: "Kyu Rank",
        sampleStatValue: "2 Kyu (Honor: 1,450)",
    },

    {
        id: "huggingface",
        name: "Hugging Face",
        category: "AI & Speciality",
        description: "Showcase open-source machine learning models, published datasets, community stars, and AI paper contributions.",
        logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/huggingface.svg",
        icon: HuggingFaceIcon,
        accentColor: "from-yellow-400/20 via-amber-500/30 to-slate-900",
        glowColor: "rgba(251, 191, 36, 0.45)",
        badgeBg: "bg-yellow-400/10 border-yellow-400/30",
        badgeText: "text-yellow-300",
        syncedMetrics: ["ML Models & Datasets", "Model Downloads & Likes", "Paper Contributions"],
        sampleStatLabel: "AI Artifacts",
        sampleStatValue: "12 Models",

    },
    {
        id: "credly",
        name: "Credly",
        category: "Skill Verification",
        description: "Import verified digital badges, professional IT certifications (AWS, Azure, Google Cloud, CompTIA), and skill credentials.",
        logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/credly.svg",
        icon: CredlyIcon,
        accentColor: "from-orange-600/20 via-amber-500/30 to-slate-900",
        glowColor: "rgba(249, 115, 22, 0.45)",
        badgeBg: "bg-orange-500/10 border-orange-500/30",
        badgeText: "text-orange-400",
        syncedMetrics: ["Verified IT Badges", "Cloud Certifications (AWS/Azure)", "Issuer Skill Metadata"],
        sampleStatLabel: "Verified Badges",
        sampleStatValue: "14 Badges",

    },
    {
        id: "chess",
        name: "Chess.com",
        category: "AI & Speciality",
        description: "Link strategic mindset metrics: Rapid, Blitz, and Bullet ELO ratings, tactical puzzle scores, and total win rates.",
        logoUrl: "https://images.chesscomfiles.com/uploads/v1/user/29371584.582ecb3d.50x50o.a1a0989f64bf.png",
        icon: ChessIcon,
        accentColor: "from-emerald-600/20 via-teal-500/30 to-slate-900",
        glowColor: "rgba(16, 185, 129, 0.45)",
        badgeBg: "bg-emerald-600/10 border-emerald-600/30",
        badgeText: "text-emerald-300",
        syncedMetrics: ["Blitz & Rapid Rating", "Tactics Puzzle Score", "Win / Loss Stats"],
        sampleStatLabel: "Blitz ELO Rating",
        sampleStatValue: "1850",
    },
];

// CATEGORIES FOR FILTERING
const CATEGORIES = [
    "All Platforms",
    "Competitive Coding",
    "Git",
    "Skill Verification",
    "AI & Speciality",
] as const;

// UNIFIED HEATMAP REFERENCE PREVIEW COMPONENT
function UnifiedHeatmapPreview() {
    const [hoveredCell, setHoveredCell] = useState<{ count: number; dayLabel: string } | null>(null);

    const weeks = 40;
    const days = 7;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className="mt-4 p-3.5 sm:p-5 rounded-2xl bg-slate-950/90 border border-white/10 flex flex-col gap-3 shadow-inner relative w-full max-w-full min-w-0 overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3 w-full min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
                        <Flame className="size-4 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-black text-white tracking-wide truncate">
                            Unified 365-Day Activity Heatmap
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">
                            Aggregated live across LeetCode, GitHub, Codeforces & CodeChef
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                        142 Day Streak
                    </span>
                    <span className="text-[10px] font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full">
                        1,842 Solves
                    </span>
                </div>
            </div>

            {/* Grid Area with Months & Days */}
            <div className="w-full max-w-full overflow-x-auto min-w-0 pb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x">
                <div className="w-max min-w-[500px]">
                    {/* Months Header */}
                    <div className="flex text-[10px] font-bold text-slate-500 mb-1.5 pl-6 justify-between pr-1">
                        {months.map((m, idx) => (
                            <span key={idx}>{m}</span>
                        ))}
                    </div>

                    {/* Heatmap Grid */}
                    <div className="flex gap-1.5">
                        {/* Day labels on left */}
                        <div className="flex flex-col justify-between text-[8px] font-bold text-slate-500 py-0.5 w-4 shrink-0">
                            <span>Mon</span>
                            <span>Wed</span>
                            <span>Fri</span>
                        </div>

                        {/* Weeks Columns */}
                        <div className="flex-1 grid grid-cols-[repeat(40,minmax(0,1fr))] gap-1">
                            {Array.from({ length: weeks }).map((_, wIdx) => (
                                <div key={wIdx} className="flex flex-col gap-1">
                                    {Array.from({ length: days }).map((_, dIdx) => {
                                        const seed = (wIdx * 7 + dIdx * 13 + 7) % 100;
                                        let level = 0;
                                        let count = 0;
                                        if (seed > 85) { level = 4; count = 12 + (seed % 6); }
                                        else if (seed > 65) { level = 3; count = 7 + (seed % 5); }
                                        else if (seed > 40) { level = 2; count = 3 + (seed % 4); }
                                        else if (seed > 20) { level = 1; count = 1 + (seed % 2); }

                                        const bgClass =
                                            level === 4 ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] border-emerald-300" :
                                                level === 3 ? "bg-emerald-500 border-emerald-400" :
                                                    level === 2 ? "bg-emerald-700/80 border-emerald-600/60" :
                                                        level === 1 ? "bg-emerald-950 border-emerald-800/40" :
                                                            "bg-slate-800/60 border-white/5";

                                        return (
                                            <div
                                                key={dIdx}
                                                onMouseEnter={() => setHoveredCell({ count, dayLabel: `Week ${wIdx + 1}` })}
                                                onMouseLeave={() => setHoveredCell(null)}
                                                className={cn(
                                                    "size-2.5 rounded-[2px] border transition-all cursor-pointer hover:scale-125 hover:z-10",
                                                    bgClass
                                                )}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Heatmap Footer Legend & Hover Tooltip */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-300">Activity Level:</span>
                    <span>Less</span>
                    <div className="flex items-center gap-1">
                        <div className="size-2 rounded-[2px] bg-slate-800/80 border border-white/5" />
                        <div className="size-2 rounded-[2px] bg-emerald-950 border border-emerald-800/40" />
                        <div className="size-2 rounded-[2px] bg-emerald-700/80 border border-emerald-600/60" />
                        <div className="size-2 rounded-[2px] bg-emerald-500 border border-emerald-400" />
                        <div className="size-2 rounded-[2px] bg-emerald-400 border border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    </div>
                    <span>More</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    {hoveredCell ? (
                        <span className="text-emerald-400 font-black">
                            {hoveredCell.count > 0 ? `${hoveredCell.count} synced submissions & commits` : "No activity recorded"}
                        </span>
                    ) : (
                        <span className="text-slate-400">Hover over any square for activity preview</span>
                    )}
                </div>
            </div>
        </div>
    );
}

interface ConnectedPlatformsSectionProps {
    onOpenRoleSelection?: () => void;
}

// 3D TILT CARD COMPONENT WITH MOUSE PERSPECTIVE
function Platform3DCard({
    platform,
    index,
    onConnect,
}: {
    platform: PlatformItem;
    index: number;
    onConnect?: () => void;
}) {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate rotation (-12 to 12 degrees)
        const rY = ((mouseX - width / 2) / (width / 2)) * 12;
        const rX = -((mouseY - height / 2) / (height / 2)) * 12;

        setRotateX(rX);
        setRotateY(rY);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
        setIsHovered(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (index % 6) * 0.08 }}
            className="perspective-1000 h-full"
        >
            <div
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                style={{
                    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.03 : 1}, ${isHovered ? 1.03 : 1}, 1)`,
                    transition: isHovered ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
                }}
                className={cn(
                    "relative h-full rounded-3xl p-6 lg:p-7 flex flex-col justify-between overflow-hidden",
                    "bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/98",
                    "border border-white/10 dark:border-white/10",
                    "backdrop-blur-xl shadow-2xl transition-all duration-300 group cursor-pointer"
                )}
            >
                {/* Background Ambient Glow on Hover */}
                <div
                    className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none -z-10"
                    style={{ background: platform.glowColor }}
                />

                {/* Top Highlight Lines */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="absolute left-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                {/* Card Content Top Header */}
                <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                        {/* High-Contrast White Badge Container for Crisp Logo Visibility */}
                        <div
                            style={{
                                transform: isHovered ? "translateZ(30px)" : "translateZ(0px)",
                                transition: "transform 0.25s ease-out",
                            }}
                            className={cn(
                                "size-14 rounded-2xl p-2.5 flex items-center justify-center relative shadow-xl",
                                "bg-white text-slate-900 border border-white/60",
                                "shadow-[0_8px_25px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:shadow-[0_8px_30px_rgba(59,130,246,0.6)] transition-all duration-300"
                            )}
                        >
                            <PlatformLogo
                                logoUrl={platform.logoUrl}
                                name={platform.name}
                                fallbackIcon={platform.icon}
                                className="size-8"
                                id={platform.id}
                            />

                            {/* Live Pulse Indicator */}
                            <div className="absolute -top-1 -right-1 size-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        </div>

                        {/* Top Badges */}
                        <div className="flex flex-col items-end gap-1.5">
                            {platform.featuredTag && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 border border-blue-400/40 text-blue-300 shadow-sm">
                                    <Sparkles className="size-2.5 text-blue-400" />
                                    {platform.featuredTag}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                                Auto Sync
                            </span>
                        </div>


                    </div>

                    {/* Platform Title */}
                    <div
                        style={{
                            transform: isHovered ? "translateZ(20px)" : "translateZ(0px)",
                            transition: "transform 0.25s ease-out",
                        }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-extrabold text-white group-hover:text-blue-300 transition-colors tracking-tight">
                                {platform.name}
                            </h3>
                            <CheckCircle2 className="size-4 text-blue-400 opacity-80" />
                        </div>

                        <p className="text-xs text-slate-300 dark:text-slate-400 line-clamp-3 leading-relaxed mb-5">
                            {platform.description}
                        </p>
                    </div>

                    {/* Feature Check List */}
                    <div className="space-y-1.5 mb-6">
                        {platform.syncedMetrics.map((metric, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px] font-medium text-slate-300/90">
                                <div className="size-1.5 rounded-full bg-blue-400 group-hover:bg-blue-300 transition-colors" />
                                <span>{metric}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card Bottom Sample Metric Preview */}
                <div
                    style={{
                        transform: isHovered ? "translateZ(25px)" : "translateZ(0px)",
                        transition: "transform 0.25s ease-out",
                    }}
                    className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto bg-slate-950/60 -mx-6 -mb-6 p-4 px-6 rounded-b-3xl"
                >
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {platform.sampleStatLabel}
                        </div>
                        <div className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                            {platform.sampleStatValue}
                        </div>
                    </div>

                    <div
                        onClick={onConnect}
                        className="flex items-center gap-1 text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors cursor-pointer"
                    >
                        <span>Connect</span>
                        <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// MAIN CONNECTED PLATFORMS SECTION
export function ConnectedPlatformsSection({ onOpenRoleSelection }: ConnectedPlatformsSectionProps) {
    const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>("All Platforms");
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const filteredPlatforms = selectedCategory === "All Platforms"
        ? CONNECTED_PLATFORMS
        : CONNECTED_PLATFORMS.filter(p => p.category === selectedCategory);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
        }
    }, [selectedCategory]);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -380, behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 380, behavior: "smooth" });
        }
    };

    return (
        <section id="platforms" className="py-24 lg:py-36 bg-slate-950/90 dark:bg-background relative overflow-hidden selection:bg-blue-500/30">
            {/* Background 3D Mesh Grids and Ambient Lights */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 -left-48 size-[500px] bg-blue-600/15 rounded-full blur-[140px]" />
                <div className="absolute bottom-1/4 -right-48 size-[500px] bg-purple-600/15 rounded-full blur-[140px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] bg-cyan-500/10 rounded-full blur-[160px]" />

                {/* Subtle Grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }}
                />
            </div>

            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">

                {/* Top Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                    >
                        <Layers className="size-4 text-blue-400 animate-pulse" />
                        Seamless Integrations
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6"
                    >
                        All Your Coding Platforms.{" "}
                        <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                            One Powerful Hub.
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg sm:text-xl text-slate-300 dark:text-slate-400 leading-relaxed font-normal"
                    >
                        EduSpace automatically aggregates ratings, solved problem metrics, active streaks, certificates, and daily heatmaps across <span className="text-white font-bold underline decoration-blue-500/50 decoration-2">10+ developer platforms</span> in real-time.
                    </motion.p>
                </div>

                {/* 3D LIVE AGGREGATION MOCKUP BANNER */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 relative rounded-3xl p-1 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-full min-w-0 overflow-hidden"
                >
                    <div className="rounded-[22px] bg-slate-900/95 backdrop-blur-2xl p-4 sm:p-6 lg:p-10 border border-white/10 w-full max-w-full min-w-0 overflow-hidden">
                        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full max-w-full min-w-0 overflow-hidden">

                            {/* Left Side Info */}
                            <div className="lg:col-span-5 space-y-4 sm:space-y-5 w-full max-w-full min-w-0 overflow-hidden">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold w-fit">
                                    Live Automated Synchronization
                                </div>

                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight break-words">
                                    Unified Developer Score & Heatmap
                                </h3>

                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words">
                                    Stop maintaining separate profiles across platforms. EduSpace merges your LeetCode, Codeforces, GitHub, and CodeChef stats into a single verified portfolio for peers, recruiters, and instructors.
                                </p>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 w-full min-w-0">
                                    <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 w-full min-w-0">
                                        <div className="text-xl sm:text-2xl font-black text-blue-400">10+</div>
                                        <div className="text-[10px] sm:text-xs text-slate-300 font-medium truncate">Platforms Connected</div>
                                    </div>
                                    <div className="p-3 sm:p-3.5 rounded-2xl bg-white/5 border border-white/10 w-full min-w-0">
                                        <div className="text-xl sm:text-2xl font-black text-emerald-400">365 Days</div>
                                        <div className="text-[10px] sm:text-xs text-slate-300 font-medium truncate">Merged Heatmap</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side 3D Interactive Stack Visual */}
                            <div className="lg:col-span-7 relative w-full max-w-full min-w-0 overflow-hidden">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full min-w-0">
                                    <div className="p-2.5 sm:p-4 rounded-2xl bg-slate-800/80 border border-amber-500/30 shadow-lg hover:border-amber-400 transition-all group w-full min-w-0 overflow-hidden">
                                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                            <div className="p-1 rounded-lg bg-white flex items-center justify-center size-6 sm:size-7 shadow-sm shrink-0">
                                                <PlatformLogo
                                                    logoUrl={CONNECTED_PLATFORMS[0].logoUrl}
                                                    name="LeetCode"
                                                    fallbackIcon={LeetCodeIcon}
                                                    className="size-4 sm:size-5"
                                                    id="leetcode"
                                                />
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Sync</span>
                                        </div>
                                        <div className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">LeetCode</div>
                                        <div className="text-xs sm:text-base font-bold text-white truncate">1,420 Solved</div>
                                    </div>

                                    <div className="p-2.5 sm:p-4 rounded-2xl bg-slate-800/80 border border-blue-500/30 shadow-lg hover:border-blue-400 transition-all group w-full min-w-0 overflow-hidden">
                                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                            <div className="p-1 rounded-lg bg-white flex items-center justify-center size-6 sm:size-7 shadow-sm shrink-0">
                                                <PlatformLogo
                                                    logoUrl={CONNECTED_PLATFORMS[1].logoUrl}
                                                    name="Codeforces"
                                                    fallbackIcon={CodeforcesIcon}
                                                    className="size-4 sm:size-5"
                                                    id="codeforces"
                                                />
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">Live</span>
                                        </div>
                                        <div className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Codeforces</div>
                                        <div className="text-xs sm:text-base font-bold text-white truncate">1984 Elo</div>
                                    </div>

                                    <div className="p-2.5 sm:p-4 rounded-2xl bg-slate-800/80 border border-purple-500/30 shadow-lg hover:border-purple-400 transition-all group w-full min-w-0 overflow-hidden">
                                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                            <div className="p-1 rounded-lg bg-white flex items-center justify-center size-6 sm:size-7 shadow-sm shrink-0">
                                                <PlatformLogo
                                                    logoUrl={CONNECTED_PLATFORMS[2].logoUrl}
                                                    name="GitHub"
                                                    fallbackIcon={GitHubIcon}
                                                    className="size-4 sm:size-5"
                                                    id="github"
                                                />
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-bold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">Daily</span>
                                        </div>
                                        <div className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">GitHub</div>
                                        <div className="text-xs sm:text-base font-bold text-white truncate">2.8k Commits</div>
                                    </div>

                                    <div className="p-2.5 sm:p-4 rounded-2xl bg-slate-800/80 border border-yellow-500/30 shadow-lg hover:border-yellow-400 transition-all group w-full min-w-0 overflow-hidden">
                                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                            <div className="p-1 rounded-lg bg-white flex items-center justify-center size-6 sm:size-7 shadow-sm shrink-0">
                                                <PlatformLogo
                                                    logoUrl={CONNECTED_PLATFORMS[3].logoUrl}
                                                    name="CodeChef"
                                                    fallbackIcon={CodeChefIcon}
                                                    className="size-4 sm:size-5"
                                                    id="codechef"
                                                />
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">Verified</span>
                                        </div>
                                        <div className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">CodeChef</div>
                                        <div className="text-xs sm:text-base font-bold text-white truncate">5★ Rating</div>
                                    </div>
                                </div>

                                {/* Interactive Unified Heatmap Preview */}
                                <UnifiedHeatmapPreview />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* CATEGORY FILTER TABS */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8 md:mb-12">
                    {CATEGORIES.map((category) => {
                        const isActive = selectedCategory === category;
                        return (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={cn(
                                    "px-5 py-2.5 rounded-full text-xs font-black transition-all duration-300 border relative",
                                    isActive
                                        ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105"
                                        : "bg-slate-900/80 text-slate-400 border-white/10 hover:text-white hover:border-white/20 hover:bg-slate-800/80"
                                )}
                            >
                                {category}
                                {isActive && (
                                    <motion.div
                                        layoutId="category-tab"
                                        className="absolute inset-0 rounded-full bg-blue-600 -z-10"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* CAROUSEL HEADER & NAVIGATION CONTROL ARROWS FOR DESKTOP & MOBILE */}
                <div className="flex items-center justify-between gap-4 mb-5 px-1">
                    <div className="text-xs font-black text-slate-300 tracking-wider flex items-center gap-2 uppercase">
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Connected Profiles ({filteredPlatforms.length})</span>
                    </div>

                    {/* Scroll Control Arrows */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={scrollLeft}
                            aria-label="Scroll left"
                            className="p-2.5 rounded-full bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={scrollRight}
                            aria-label="Scroll right"
                            className="p-2.5 rounded-full bg-slate-900/90 border border-white/20 text-slate-300 hover:text-white hover:bg-blue-600 hover:border-blue-500 shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>

                {/* HORIZONTAL PLATFORMS CAROUSEL (Desktop & Mobile) */}
                <AnimatePresence mode="wait">
                    <motion.div
                        ref={scrollContainerRef}
                        key={selectedCategory}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 lg:gap-8 pb-6 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x scroll-smooth w-full max-w-full"
                    >
                        {filteredPlatforms.map((platform, index) => (
                            <div key={platform.id} className="w-[82vw] sm:w-[320px] lg:w-[340px] shrink-0 snap-start h-full">
                                <Platform3DCard
                                    platform={platform}
                                    index={index}
                                    onConnect={onOpenRoleSelection}
                                />
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Mobile Swipe Hint Indicator */}
                <div className="flex md:hidden items-center justify-center gap-2 text-[11px] font-bold text-slate-400 mt-2 bg-white/5 py-1.5 px-4 rounded-full border border-white/10 w-fit mx-auto shadow-sm">
                    <span className="animate-pulse text-blue-400">←</span>
                    <span>Swipe to explore platforms</span>
                    <span className="animate-pulse text-blue-400">→</span>
                </div>



            </div>
        </section>
    );
}

export default ConnectedPlatformsSection;
