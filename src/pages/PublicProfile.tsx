import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Trophy, Mail, Calendar, CheckCircle, Copy, ChevronLeft, Loader2, User, Globe, Shield, Printer, Sparkles, Star, Medal, Award, Zap, Crown, Sword, Gem, GraduationCap, Infinity as InfinityIcon, Link as LinkIcon, ExternalLink, Linkedin, Github, Twitter } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeType, BADGE_DETAILS } from "@/services/streakService";
import { StreakBadgeDetailModal } from "@/components/streak/StreakBadgeDetailModal";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const LeetCodeIcon = ({ className = "size-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.102 17.93a4.522 4.522 0 0 1-1.396 2.372 4.47 4.47 0 0 1-2.991 1.139 4.468 4.468 0 0 1-3.21-1.332L3.109 14.71a4.52 4.52 0 0 1-.954-1.639 4.444 4.444 0 0 1-.035-2.88 4.502 4.502 0 0 1 1.002-1.584l5.378-5.378a4.498 4.498 0 0 1 3.197-1.334c1.201 0 2.331.47 3.178 1.321l.006.006.918.918a.747.747 0 0 1-1.056 1.056l-.918-.918a3.003 3.003 0 0 0-2.128-.885 3.002 3.002 0 0 0-2.134.891L4.21 9.77a3.002 3.002 0 0 0-.668 1.056 2.96 2.96 0 0 0 .023 1.92 3.013 3.013 0 0 0 .637 1.093l5.395 5.397a2.98 2.98 0 0 0 2.14.888 2.98 2.98 0 0 0 1.994-.76 3.015 3.015 0 0 0 .931-1.581.75.75 0 1 1 1.47.337zm2.493-4.577a.75.75 0 0 1-.53-.22L13.111 8.18a.75.75 0 1 1 1.06-1.06l4.954 4.953a.75.75 0 0 1-.53 1.28z" />
    </svg>
);

const CodeforcesIcon = ({ className = "size-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 7.5a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 3 0V9A1.5 1.5 0 0 0 4.5 7.5zm7.5-4.5a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 3 0V4.5A1.5 1.5 0 0 0 12 3zm7.5 7.5a1.5 1.5 0 0 0-1.5 1.5v4.5a1.5 1.5 0 0 0 3 0V12a1.5 1.5 0 0 0-1.5-1.5z" />
    </svg>
);

const HackerRankIcon = ({ className = "size-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L1.608 6v12L12 24l10.392-6V6L12 0zm5.127 16.03h-2.146v-3.791H9.019v3.791H6.873V7.97h2.146v3.79h5.962V7.97h2.146v8.06z" />
    </svg>
);

const CodeChefIcon = ({ className = "size-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.2574.0039c-.37.0101-.7353.041-1.1003.095C9.6164.153 9.0766.4236 8.482.694c-.757.3244-1.5147.6486-2.2176.7027-1.1896.3785-1.568.919-1.8925 1.3516 0 .054-.054.1079-.054.1079-.4325.865-.4873 1.73-.325 2.5952.1621.5407.3786 1.0282.5408 1.5148.3785 1.0274.7578 2.0007.92 3.1362.1622.3244.3235.7571.4316 1.1897.2704.8651.542 1.8383 1.353 2.5952l.0057-.0028c.0175.0183.0301.0387.0482.0568.0072-.0036.0141-.0063.0213-.0099l-.0213-.5849c.6489-.9733 1.5673-1.6221 2.865-1.8925.5195-.1093 1.081-.1497 1.6625-.1278a8.7733 8.7733 0 0 1 1.7988.2357c1.4599.3785 2.595 1.1358 2.6492 1.7846.0273.3549.0398.6952.0326 1.0364-.001.064-.0046.1285-.007.193l.1362.0682c.075-.0375.1424-.107.2059-.1902.0008-.001.002-.002.0028-.0028.0018-.0023.0039-.0061.0057-.0085.0396-.0536.0747-.1236.1107-.1931.0188-.0377.0372-.0866.0554-.1292.2048-.4622.362-1.1536.538-1.9635.0541-.2703.1092-.4864.1633-.7027.4326-.9733 1.0266-1.8382 1.6213-2.6492.9733-1.3518 1.8928-2.5962 1.7846-4.0561-1.784-3.4608-4.2718-4.0017-5.5695-4.272-.2163-.0541-.3233-.0539-.4856-.108-1.3382-.2433-2.4945-.3953-3.6046-.3648zm5.0428 14.3788a9.8602 9.8602 0 0 0-.0326-.9824c-.0541-.703-1.1892-1.46-2.7032-1.8386-.588-.1336-1.1764-.2142-1.7448-.2356-.539-.0137-1.0657.0248-1.5546.1277-1.2436.2704-2.2162.9193-2.811 1.8925l.0511 1.431c.6672-.3558 1.7326-.8747 3.139-.9994.0662-.0059.1368-.0059.2044-.0099.1177-.013.2667-.044.4444-.044 1.6075 0 3.2682.5336 4.8767 1.6483.039-.2744.0611-.549.071-.8234l.044.0227c.0028-.0622.0143-.1268.0156-.1888z" />
    </svg>
);

const KaggleIcon = ({ className = "size-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.825 23.859h-3.411l-5.341-7.228-2.658 2.658v4.57H4.517V.141h2.898v13.567l7.562-7.562h3.693l-6.31 6.31 6.465 11.403z" />
    </svg>
);

const CodolioIcon = ({ className = "size-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1 14.5a1.5 1.5 0 0 1-2.25 1.3l-4.5-3a1.5 1.5 0 0 1 0-2.6l4.5-3A1.5 1.5 0 0 1 13 10.5v6zm4-3a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 1 0-3h2z" />
    </svg>
);

const BRAND_ICON_URLS: Record<string, string> = {
    leetcode: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/leetcode/leetcode-original.svg",
    codeforces: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codeforces/codeforces-original.svg",
    hackerrank: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/hackerrank/hackerrank-original.svg",
    codechef: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/codechef.svg",
    codolio: "https://codolio.com/codolio_assets/codolio.svg",
    linkedin: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg",
    github: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
    kaggle: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kaggle/kaggle-original.svg",
    twitter: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/twitter/twitter-original.svg",
};

const RealBrandIcon = ({
    id,
    label,
    fallback: FallbackIcon,
    className = "size-4 object-contain"
}: {
    id: string;
    label: string;
    fallback: React.ComponentType<{ className?: string }>;
    className?: string;
}) => {
    const [hasError, setHasError] = useState(false);
    const src = BRAND_ICON_URLS[id];

    if (!src || hasError) {
        return <FallbackIcon className={className} />;
    }

    return (
        <img
            src={src}
            alt={label}
            className={cn(className, "transition-transform duration-200 object-contain")}
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
};

const DEFAULT_CORE_PLATFORMS = ['linkedin', 'github', 'leetcode', 'codeforces', 'hackerrank', 'codechef', 'kaggle', 'codolio', 'twitter', 'portfolio'];

interface SocialPlatformItem {
    id: string;
    label: string;
    url?: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    border: string;
    text: string;
    shadow: string;
}

const getHeaderProfileIcons = (data: Record<string, any>, isViewOnly = true): SocialPlatformItem[] => {
    const allPlatforms: SocialPlatformItem[] = [
        { id: 'linkedin', label: 'LinkedIn', url: data.linkedin_url, icon: Linkedin, bg: 'bg-[#0077b5]/10 hover:bg-[#0077b5]/20', border: 'border-[#0077b5]/30', text: 'text-[#0077b5]', shadow: 'hover:shadow-[0_0_12px_rgba(0,119,181,0.35)]' },
        { id: 'github', label: 'GitHub', url: data.github_url, icon: Github, bg: 'bg-slate-500/10 hover:bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-900 dark:text-white', shadow: 'hover:shadow-[0_0_12px_rgba(100,116,139,0.35)]' },
        { id: 'leetcode', label: 'LeetCode', url: data.leetcode_url, icon: LeetCodeIcon, bg: 'bg-[#FFA116]/10 hover:bg-[#FFA116]/20', border: 'border-[#FFA116]/30', text: 'text-[#FFA116]', shadow: 'hover:shadow-[0_0_12px_rgba(255,161,22,0.35)]' },
        { id: 'codeforces', label: 'Codeforces', url: data.codeforces_url, icon: CodeforcesIcon, bg: 'bg-[#1F8ACB]/10 hover:bg-[#1F8ACB]/20', border: 'border-[#1F8ACB]/30', text: 'text-[#1F8ACB]', shadow: 'hover:shadow-[0_0_12px_rgba(31,138,203,0.35)]' },
        { id: 'hackerrank', label: 'HackerRank', url: data.hackerrank_url, icon: HackerRankIcon, bg: 'bg-[#2EC4B6]/10 hover:bg-[#2EC4B6]/20', border: 'border-[#2EC4B6]/30', text: 'text-[#2EC4B6]', shadow: 'hover:shadow-[0_0_12px_rgba(46,196,182,0.35)]' },
        { id: 'codechef', label: 'CodeChef', url: data.codechef_url, icon: CodeChefIcon, bg: 'bg-[#5B4638]/15 hover:bg-[#5B4638]/30', border: 'border-[#5B4638]/40', text: 'text-[#d97706]', shadow: 'hover:shadow-[0_0_12px_rgba(217,119,6,0.35)]' },
        { id: 'kaggle', label: 'Kaggle', url: data.kaggle_url, icon: KaggleIcon, bg: 'bg-[#20BEFF]/10 hover:bg-[#20BEFF]/20', border: 'border-[#20BEFF]/30', text: 'text-[#20BEFF]', shadow: 'hover:shadow-[0_0_12px_rgba(32,190,255,0.35)]' },
        { id: 'codolio', label: 'Codolio', url: data.codolio_url, icon: CodolioIcon, bg: 'bg-[#FF5722]/10 hover:bg-[#FF5722]/20', border: 'border-[#FF5722]/30', text: 'text-[#FF5722]', shadow: 'hover:shadow-[0_0_12px_rgba(255,87,34,0.35)]' },
        { id: 'twitter', label: 'Twitter / X', url: data.twitter_url, icon: Twitter, bg: 'bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20', border: 'border-[#1DA1F2]/30', text: 'text-[#1DA1F2]', shadow: 'hover:shadow-[0_0_12px_rgba(29,161,242,0.35)]' },
        { id: 'portfolio', label: 'Portfolio', url: data.portfolio_url, icon: Globe, bg: 'bg-purple-500/10 hover:bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-500', shadow: 'hover:shadow-[0_0_12px_rgba(139,92,246,0.35)]' },
    ];

    const active = allPlatforms.filter(p => Boolean(p.url));

    if (isViewOnly) {
        return active.slice(0, 10);
    }

    if (active.length >= 10) {
        return active.slice(0, 10);
    }

    const activeIds = new Set(active.map(a => a.id));
    const remainingSlotsNeeded = 10 - active.length;
    const defaultsToInclude = allPlatforms
        .filter(p => DEFAULT_CORE_PLATFORMS.includes(p.id) && !activeIds.has(p.id))
        .slice(0, remainingSlotsNeeded);

    return [...active, ...defaultsToInclude];
};

const IconMap: Record<string, any> = {
    Trophy, Medal, Award, Zap, Crown, Sparkles, Shield, Sword, Gem, Infinity: InfinityIcon
};

interface ProfileData extends Record<string, any> {
    avatar_url?: string;
    full_name?: string;
    bio?: string;
    email?: string;
    updated_at?: string;
}

export default function PublicProfile() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const badgeType = searchParams.get("badge") as BadgeType | null;
    const badgeDetails = badgeType ? BADGE_DETAILS[badgeType] : null;
    const BadgeIcon = badgeDetails ? (IconMap[badgeDetails.icon] || Trophy) : null;
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showBadge, setShowBadge] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            if (!id) return;
            try {
                setLoading(true);
                const { data: publicData, error: publicError } = await supabase
                    .from("public_profiles")
                    .select("*")
                    .eq("user_id", id)
                    .single();

                let finalData: any = publicData;

                // If public profile missing or missing avatar, try getting from main profiles
                if (publicError || !publicData?.avatar_url) {
                    const { data: mainData, error: mainError } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("user_id", id)
                        .single();

                    if (!mainError && mainData) {
                        if (!finalData) {
                            finalData = mainData as any;
                        } else {
                            // Merge missing avatar from main profile
                            finalData = {
                                ...finalData,
                                avatar_url: finalData.avatar_url || (mainData as any).avatar_url,
                                full_name: finalData.full_name || (mainData as any).full_name,
                                bio: finalData.bio || (mainData as any).bio
                            };
                        }
                    }

                    // Explicit fallback: Check student_profiles for image if still missing
                    if (!finalData?.avatar_url) {
                        const { data: studentData } = await supabase
                            .from("student_profiles")
                            .select("profile_image")
                            .eq("user_id", id)
                            .maybeSingle();

                        if (studentData?.profile_image) {
                            if (!finalData) finalData = {}; // Initialize if null
                            finalData.avatar_url = studentData.profile_image;
                        }
                    }
                }

                setProfile(finalData);
            } catch (err: any) {
                console.error("Error fetching public profile:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [id]);

    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
    };



    const isBadgeView = window.location.pathname.includes('/badge/');

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#050b14]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <p className="text-slate-400 font-medium animate-pulse">
                        {isBadgeView ? 'Retrieving Achievement...' : 'Loading Profile...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#050b14] p-6 text-center text-white">
                <User className="size-16 text-slate-700 mb-6" />
                <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
                <Button onClick={() => navigate("/")} variant="outline" className="rounded-full mt-4 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                    Return to Portal
                </Button>
            </div>
        );
    }

    const initials = profile.full_name
        ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        : "U";

    return (
        <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#050b14] text-slate-900 dark:text-white font-sans selection:bg-blue-500/30 transition-colors duration-300 flex flex-col items-center">
            <SEO
                title={profile ? `${profile.full_name} | Academic Profile` : "Public Profile"}
                description={profile?.bio || "View this student's academic profile and achievements on Eduspace Academy."}
                ogImage={profile?.avatar_url || "/og-image.png"}
                keywords={["Student Profile", "Academic Portfolio", "Eduspace Profile", "Student Achievements"]}
                structuredData={profile ? {
                    "@context": "https://schema.org",
                    "@type": "Person",
                    "name": profile.full_name,
                    "description": profile.bio,
                    "image": profile.avatar_url,
                    "url": window.location.href
                } : undefined}
            />

            {/* Background spotlight for badge view */}
            {isBadgeView && (
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)]" />
                </div>
            )}

            {/* Main Content - Centered */}
            <main className="flex-1 w-full max-w-md px-6 relative z-10 overflow-y-auto nav-scroll flex flex-col justify-center">
                {/* The Full Streak Badge Modal for Live Sharing */}
                <StreakBadgeDetailModal
                    type={badgeType}
                    isOpen={showBadge && !!badgeType}
                    hideShare={isBadgeView}
                    hideClose={isBadgeView}
                    hideGenerate={isBadgeView}
                    externalProfile={profile}
                    onClose={() => {
                        setShowBadge(false);
                        // Clean up URL parameter after closing
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, '', newUrl);
                    }}
                />

                {/* Profile Card - Hidden in Badge View */}
                {!isBadgeView && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center text-center pb-24 pt-8 bg-slate-50 dark:bg-[#050b14] text-slate-900 dark:text-white"
                    >

                        {/* Academic Profile Header */}
                        <div className="mb-6 text-center">
                            <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase">
                                {badgeDetails ? 'Profile of Achiever' : 'Academic Profile'}
                            </h2>
                        </div>

                        {/* Avatar with Glow */}
                        <div className="relative mb-4 md:mb-6 group">
                            <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                            <div className="relative">
                                <Avatar className="size-24 md:size-32 border-4 border-white dark:border-[#050b14] shadow-2xl">
                                    <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                                    <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-3xl font-bold text-blue-500">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                {profile.verified && (
                                    <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-4 border-white dark:border-[#050b14]">
                                        <CheckCircle className="size-4" fill="currentColor" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name & 6 Profile Icons */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-2 md:mb-3">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {profile.full_name}
                            </h1>
                            {profile.role !== "lecturer" && (
                                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-center">
                                    <TooltipProvider delayDuration={100}>
                                        {getHeaderProfileIcons(profile, true).map((platform) => {
                                            const isFilled = Boolean(platform.url);
                                            return (
                                                <Tooltip key={platform.id}>
                                                    <TooltipTrigger asChild>
                                                        <a
                                                            href={platform.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={cn(
                                                                "size-6.5 rounded-full flex items-center justify-center border transition-all duration-300 hover:scale-110 backdrop-blur-md p-1",
                                                                platform.bg,
                                                                platform.border,
                                                                platform.text,
                                                                platform.shadow
                                                            )}
                                                        >
                                                            <RealBrandIcon id={platform.id} label={platform.label} fallback={platform.icon} className="size-3.5 object-contain" />
                                                        </a>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border shadow-sm">
                                                        <RealBrandIcon id={platform.id} label={platform.label} fallback={platform.icon} className="size-3.5 object-contain" />
                                                        <span>{platform.label}</span>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </TooltipProvider>
                                </div>
                            )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Academic Portal
                            </Badge>
                            {profile.verified && (
                                <Badge className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    Verified Identity
                                </Badge>
                            )}
                        </div>

                        {/* Info Row */}
                        <div className="flex flex-col items-center gap-1.5 md:gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8 md:mb-12 font-medium">
                            <div className="flex items-center gap-2">
                                <Mail className="size-4 text-blue-500" />
                                <span>{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="size-4 text-blue-500" />
                                <span>Updated {new Date(profile.updated_at || new Date()).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Personal Statement */}
                        {profile.bio && (
                            <div className="w-full text-left mb-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-1 w-6 bg-blue-600 rounded-full"></div>
                                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-500 uppercase">Personal Statement</h3>
                                </div>
                                <p className="text-lg text-slate-600 dark:text-slate-200 italic font-medium leading-relaxed">
                                    "{profile.bio}"
                                </p>
                            </div>
                        )}

                        {/* Connectivity */}
                        <div className="w-full text-left mb-12">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-1 w-6 bg-blue-600 rounded-full"></div>
                                <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-500 uppercase">Connectivity</h3>
                            </div>

                            <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-blue-500/20 transition-all cursor-pointer shadow-sm dark:shadow-none mb-3" onClick={copyLink}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <Globe className="size-5 text-slate-400 shrink-0" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate tracking-tight">
                                        eduspaceacademy.online/p/{profile.full_name?.toLowerCase().replace(/\s+/g, '')}
                                    </span>
                                </div>
                                <Copy className="size-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                            </div>

                            {profile.portfolio_url && (
                                <a
                                    href={profile.portfolio_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-blue-500/20 transition-all cursor-pointer shadow-sm dark:shadow-none mb-3"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <LinkIcon className="size-5 text-blue-500 shrink-0" />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate tracking-tight">
                                            {profile.portfolio_url.replace(/^https?:\/\/(www\.)?/, '')}
                                        </span>
                                    </div>
                                    <ExternalLink className="size-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                                </a>
                            )}

                            {/* Social Presence Links (Students Only) */}
                            {profile.role !== "lecturer" && (profile.linkedin_url || profile.github_url || profile.leetcode_url || profile.codeforces_url || profile.hackerrank_url || profile.codechef_url || profile.kaggle_url || profile.codolio_url || profile.twitter_url) && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {profile.linkedin_url && (
                                        <a
                                            href={profile.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                                        >
                                            <RealBrandIcon id="linkedin" label="LinkedIn" fallback={Linkedin} className="size-4 object-contain group-hover/social:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">LinkedIn</span>
                                        </a>
                                    )}
                                    {profile.github_url && (
                                        <a
                                            href={profile.github_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                                        >
                                            <RealBrandIcon id="github" label="GitHub" fallback={Github} className="size-4 object-contain group-hover/social:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">GitHub</span>
                                        </a>
                                    )}
                                    {profile.leetcode_url && (
                                        <a
                                            href={profile.leetcode_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                                        >
                                            <RealBrandIcon id="leetcode" label="LeetCode" fallback={LeetCodeIcon} className="size-4 object-contain group-hover/social:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">LeetCode</span>
                                        </a>
                                    )}
                                    {profile.codeforces_url && (
                                        <a
                                            href={profile.codeforces_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                                        >
                                            <RealBrandIcon id="codeforces" label="Codeforces" fallback={CodeforcesIcon} className="size-4 object-contain group-hover/social:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Codeforces</span>
                                        </a>
                                    )}
                                    {profile.hackerrank_url && (
                                        <a
                                            href={profile.hackerrank_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                                        >
                                            <RealBrandIcon id="hackerrank" label="HackerRank" fallback={HackerRankIcon} className="size-4 object-contain group-hover/social:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">HackerRank</span>
                                        </a>
                                    )}
                                    {profile.codechef_url && (
                                        <a
                                            href={profile.codechef_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                                        >
                                            <RealBrandIcon id="codechef" label="CodeChef" fallback={CodeChefIcon} className="size-4 object-contain group-hover/social:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">CodeChef</span>
                                        </a>
                                    )}
                                    {profile.kaggle_url && (
                                        <a
                                            href={profile.kaggle_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                                        >
                                            <RealBrandIcon id="kaggle" label="Kaggle" fallback={KaggleIcon} className="size-4 object-contain group-hover/social:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Kaggle</span>
                                        </a>
                                    )}
                                    {profile.codolio_url && (
                                        <a
                                            href={profile.codolio_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                                        >
                                            <RealBrandIcon id="codolio" label="Codolio" fallback={CodolioIcon} className="size-4 object-contain group-hover/social:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Codolio</span>
                                        </a>
                                    )}
                                    {profile.twitter_url && (
                                        <a
                                            href={profile.twitter_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                                        >
                                            <RealBrandIcon id="twitter" label="Twitter / X" fallback={Twitter} className="size-4 object-contain group-hover/social:scale-110 transition-transform" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">X</span>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>



                    </motion.div>
                )}

            </main>

            {/* Floating Action Buttons - Hidden in Badge View */}
            {!isBadgeView && (
                <div className="fixed bottom-6 z-20 w-full px-6 flex justify-center pointer-events-none">
                    <Button
                        className="w-full max-w-sm bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-full py-6 shadow-2xl shadow-slate-900/20 transition-all active:scale-[0.98] pointer-events-auto border border-white/10"
                        onClick={() => window.print()}
                    >
                        <Printer className="size-5 mr-3" />
                        <span className="font-bold tracking-wide text-sm uppercase">Print Profile</span>
                    </Button>
                </div>
            )}

            {/* Nav Back Button (Top Left) */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-20 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-full"
                onClick={() => navigate('/')}
            >
                <ChevronLeft className="size-5" />
            </Button>
        </div>
    );
}
