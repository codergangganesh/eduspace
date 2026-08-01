import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCodingProfiles, extractUsername } from "@/services/codingProfileService";
import { CodingProfilesResponse } from "@/types/codingProfile";
import { CodingProfileCard, PlatformBrandLogo } from "./CodingProfileCard";
import { CodingProfilesSkeleton } from "./CodingProfilesSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Edit3,
  Code2,
  CheckCircle2,
  Code,
  GitBranch,
  Layers,
  Key,
  Eye,
  EyeOff,
  HelpCircle,
  ExternalLink,
  Flame,
  Zap,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const getInitialCache = (userId?: string): CodingProfilesResponse | null => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`eduspace_coding_profile_cache_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch { }
  return null;
};

interface CodingProfilesProps {
  className?: string;
}

export function CodingProfiles({ className }: CodingProfilesProps) {
  const { user, profile, updateProfile } = useAuth();

  const [data, setData] = useState<CodingProfilesResponse | null>(() => getInitialCache(user?.id));
  const [loading, setLoading] = useState<boolean>(() => !getInitialCache(user?.id));
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [savingUsernames, setSavingUsernames] = useState<boolean>(false);
  const [testingToken, setTestingToken] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"all" | "competitive" | "opensource">("all");

  const [leetcodeInput, setLeetcodeInput] = useState<string>("");
  const [codeforcesInput, setCodeforcesInput] = useState<string>("");
  const [githubInput, setGithubInput] = useState<string>("");
  const [codechefInput, setCodechefInput] = useState<string>("");
  const [codewarsInput, setCodewarsInput] = useState<string>("");
  const [geeksforgeeksInput, setGeeksforgeeksInput] = useState<string>("");
  const [atcoderInput, setAtcoderInput] = useState<string>("");
  const [githubTokenInput, setGithubTokenInput] = useState<string>("");
  const [showGithubToken, setShowGithubToken] = useState<boolean>(false);

  const lcUsername = profile?.leetcode_username || extractUsername(profile?.leetcode_url) || data?.leetcodeUsername || "";
  const cfHandle = profile?.codeforces_handle || extractUsername(profile?.codeforces_url) || data?.codeforcesHandle || "";
  const ghUsername = (profile?.github_url ? extractUsername(profile?.github_url) : "") || (profile as any)?.github_username || data?.githubUsername || "";
  const ccUsername = (profile as any)?.codechef_username || extractUsername((profile as any)?.codechef_url) || data?.codechefUsername || "";
  const cwUsername = (profile as any)?.codewars_username || extractUsername((profile as any)?.codewars_url) || data?.codewarsUsername || "";
  const gfgUsername = (profile as any)?.geeksforgeeks_username || extractUsername((profile as any)?.geeksforgeeks_url) || data?.geeksforgeeksUsername || "";
  const atcoderUsername = (profile as any)?.atcoder_username || extractUsername((profile as any)?.atcoder_url) || data?.atcoderUsername || "";
  const ghToken = (profile as any)?.github_token || data?.githubToken || "";

  useEffect(() => {
    if (profile) {
      setLeetcodeInput(profile.leetcode_username || extractUsername(profile.leetcode_url) || data?.leetcodeUsername || "");
      setCodeforcesInput(profile.codeforces_handle || extractUsername(profile.codeforces_url) || data?.codeforcesHandle || "");
      setGithubInput((profile.github_url ? extractUsername(profile.github_url) : "") || data?.githubUsername || "");
      setCodechefInput((profile as any)?.codechef_username || extractUsername((profile as any)?.codechef_url) || data?.codechefUsername || "");
      setCodewarsInput((profile as any)?.codewars_username || extractUsername((profile as any)?.codewars_url) || data?.codewarsUsername || "");
      setGeeksforgeeksInput((profile as any)?.geeksforgeeks_username || extractUsername((profile as any)?.geeksforgeeks_url) || data?.geeksforgeeksUsername || "");
      setAtcoderInput((profile as any)?.atcoder_username || extractUsername((profile as any)?.atcoder_url) || data?.atcoderUsername || "");
      setGithubTokenInput((profile as any)?.github_token || data?.githubToken || "");
    }
  }, [profile, data?.leetcodeUsername, data?.codeforcesHandle, data?.githubUsername, data?.codechefUsername, data?.codewarsUsername, data?.geeksforgeeksUsername, data?.atcoderUsername, data?.githubToken]);

  const fetchProfiles = useCallback(
    async (
      forceRefresh = false,
      overrides?: {
        lc?: string;
        cf?: string;
        gh?: string;
        token?: string;
        cc?: string;
        cw?: string;
        gfg?: string;
        atcoder?: string;
      }
    ) => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (forceRefresh) {
        setRefreshing(true);
      } else if (!data) {
        setLoading(true);
      }

      try {
        const res = await getCodingProfiles(
          user.id,
          overrides?.lc !== undefined ? overrides.lc : lcUsername,
          overrides?.cf !== undefined ? overrides.cf : cfHandle,
          overrides?.gh !== undefined ? overrides.gh : ghUsername,
          overrides?.token !== undefined ? overrides.token : ghToken,
          overrides?.cc !== undefined ? overrides.cc : ccUsername,
          overrides?.cw !== undefined ? overrides.cw : cwUsername,
          overrides?.gfg !== undefined ? overrides.gfg : gfgUsername,
          overrides?.atcoder !== undefined ? overrides.atcoder : atcoderUsername,
          forceRefresh
        );
        setData(res);
      } catch (err: any) {
        toast.error("Failed to load coding statistics: " + (err?.message || "Network error"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, lcUsername, cfHandle, ghUsername, ghToken, ccUsername, cwUsername, gfgUsername, atcoderUsername, data]
  );

  useEffect(() => {
    fetchProfiles(false);
  }, [fetchProfiles]);

  const handleManualRefresh = () => {
    if (refreshing) return;
    toast.promise(fetchProfiles(true), {
      loading: "Updating statistics...",
      success: "Statistics updated!",
      error: "Failed to refresh statistics.",
    });
  };

  const handleSaveUsernames = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanLc = leetcodeInput.trim();
    const cleanCf = codeforcesInput.trim();
    const cleanGh = githubInput.trim();
    const cleanCc = codechefInput.trim();
    const cleanCw = codewarsInput.trim();
    const cleanGfg = geeksforgeeksInput.trim();
    const cleanAtcoder = atcoderInput.trim();
    const cleanGhToken = githubTokenInput.trim();

    if (leetcodeInput.length > 0 && !cleanLc) {
      toast.error("LeetCode Username cannot be empty spaces.");
      return;
    }
    if (codeforcesInput.length > 0 && !cleanCf) {
      toast.error("Codeforces Handle cannot be empty spaces.");
      return;
    }
    if (geeksforgeeksInput.length > 0 && !cleanGfg) {
      toast.error("GeeksforGeeks Username cannot be empty spaces.");
      return;
    }
    if (atcoderInput.length > 0 && !cleanAtcoder) {
      toast.error("AtCoder Username cannot be empty spaces.");
      return;
    }

    setSavingUsernames(true);
    try {
      if (user?.id) {
        if (cleanGhToken) {
          localStorage.setItem(`eduspace_github_token_${user.id}`, cleanGhToken);
        } else {
          localStorage.removeItem(`eduspace_github_token_${user.id}`);
        }
      }

      const lcUrl = cleanLc ? `https://leetcode.com/u/${cleanLc}/` : "";
      const cfUrl = cleanCf ? `https://codeforces.com/profile/${cleanCf}` : "";
      const ghUrl = cleanGh ? `https://github.com/${cleanGh}` : "";
      const ccUrl = cleanCc ? `https://www.codechef.com/users/${cleanCc}` : "";
      const cwUrl = cleanCw ? `https://www.codewars.com/users/${cleanCw}` : "";
      const gfgUrl = cleanGfg ? `https://www.geeksforgeeks.org/user/${cleanGfg}/` : "";
      const atcoderUrl = cleanAtcoder ? `https://atcoder.jp/users/${cleanAtcoder}` : "";

      const res = await updateProfile({
        leetcode_username: cleanLc || null,
        codeforces_handle: cleanCf || null,
        leetcode_url: lcUrl || null,
        codeforces_url: cfUrl || null,
        github_url: ghUrl || null,
        codechef_username: cleanCc || null,
        codewars_username: cleanCw || null,
        geeksforgeeks_username: cleanGfg || null,
        atcoder_username: cleanAtcoder || null,
        codechef_url: ccUrl || null,
        codewars_url: cwUrl || null,
        geeksforgeeks_url: gfgUrl || null,
        atcoder_url: atcoderUrl || null,
      } as any);

      if (res.success) {
        toast.success("Usernames updated successfully!");
        setIsDialogOpen(false);
        fetchProfiles(true, {
          lc: cleanLc,
          cf: cleanCf,
          gh: cleanGh,
          token: cleanGhToken,
          cc: cleanCc,
          cw: cleanCw,
          gfg: cleanGfg,
          atcoder: cleanAtcoder,
        });
      } else {
        toast.error(res.error || "Failed to update profile settings.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setSavingUsernames(false);
    }
  };

  const handleTestToken = async () => {
    const token = githubTokenInput.trim();
    if (!token) {
      toast.error("Please enter a GitHub Access Token first.");
      return;
    }

    setTestingToken(true);
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        const remaining = res.headers.get("x-ratelimit-remaining") || "5000";
        toast.success(
          `✓ Token Verified! Linked as @${userData.login}. Rate Limit: ${remaining}/5000 req/hr remaining.`
        );
      } else if (res.status === 401) {
        toast.error("Invalid token. Check your token and try again.");
      } else {
        toast.error(`GitHub API returned status ${res.status}`);
      }
    } catch (err: any) {
      toast.error("Token test failed: " + (err?.message || "Network error"));
    } finally {
      setTestingToken(false);
    }
  };

  const handleOpenSourceClick = () => {
    setActiveTab("all");
    setTimeout(() => {
      const el = document.getElementById("github-profile-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  if (loading) {
    return <CodingProfilesSkeleton />;
  }

  const overallTotal = data?.overall?.totalSolved ?? 0;

  return (
    <div className={cn("space-y-6 w-full max-w-7xl mx-auto", className)}>
      {/* Clean Header Bar */}
      <div className="rounded-2xl border border-border/70 p-3.5 sm:p-5 bg-card/90 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">

          {/* Top Line on Mobile / Left Section on Desktop: Title */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <h2 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight whitespace-nowrap shrink-0">
              Coding Profiles
            </h2>

            {/* Icons on Mobile placed right beside title in the top line */}
            <div className="flex items-center gap-1.5 sm:hidden shrink-0">
              <div className="flex items-center gap-0.5 bg-muted/60 p-1 rounded-xl border border-border/40">
                <button
                  onClick={() => setActiveTab("all")}
                  title="All Platforms"
                  className={cn(
                    "p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                    activeTab === "all"
                      ? "bg-card text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Layers className="size-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab("competitive")}
                  title="Competitive Programming"
                  className={cn(
                    "p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                    activeTab === "competitive"
                      ? "bg-card text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Code className="size-3.5" />
                </button>
                <button
                  onClick={handleOpenSourceClick}
                  title="Open Source Projects (Scroll to GitHub)"
                  className={cn(
                    "p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitBranch className="size-3.5" />
                </button>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDialogOpen(true)}
                className="size-8 rounded-xl border-border/80 hover:bg-accent shadow-sm"
                title="Edit Handles"
              >
                <Edit3 className="size-3.5 text-foreground" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="size-8 rounded-xl border-border/80 hover:bg-accent shrink-0"
                title="Refresh Statistics"
              >
                <RefreshCw className={cn("size-3.5 text-muted-foreground hover:text-foreground", refreshing && "animate-spin text-primary")} />
              </Button>
            </div>
          </div>

          {/* Desktop Right Section: Category Tabs + Action Buttons + Total Solved */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
              <button
                onClick={() => setActiveTab("all")}
                title="All Platforms"
                className={cn(
                  "p-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                  activeTab === "all"
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="size-4" />
              </button>
              <button
                onClick={() => setActiveTab("competitive")}
                title="Competitive Programming"
                className={cn(
                  "p-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                  activeTab === "competitive"
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Code className="size-4" />
              </button>
              <button
                onClick={handleOpenSourceClick}
                title="Open Source Projects (Scroll to GitHub)"
                className={cn(
                  "p-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center text-muted-foreground hover:text-foreground"
                )}
              >
                <GitBranch className="size-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDialogOpen(true)}
                className="size-9 rounded-xl border-border/80 hover:bg-accent shadow-sm"
                title="Edit Handles"
              >
                <Edit3 className="size-4 text-foreground" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="size-9 rounded-xl border-border/80 hover:bg-accent shrink-0"
                title="Refresh Statistics"
              >
                <RefreshCw className={cn("size-4 text-muted-foreground hover:text-foreground", refreshing && "animate-spin text-primary")} />
              </Button>
            </div>

            {/* Total Solved Pill */}
            <div className="px-3.5 py-1.5 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Solved:</span>
              <span className="text-sm font-extrabold text-foreground font-mono">{overallTotal}</span>
            </div>
          </div>

        </div>

        {/* Mobile-Only Modern Total Solved Problems Banner below top line */}
        <div className="sm:hidden mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span className="text-xs font-bold text-foreground">Total Solved Problems</span>
          </div>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
            {overallTotal}
          </span>
        </div>
      </div>

      {/* Bento Cards Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(activeTab === "all" || activeTab === "competitive") && (
          <CodingProfileCard
            platform="leetcode"
            username={lcUsername}
            stats={data?.leetcode}
            error={data?.leetcodeError}
            onEdit={() => setIsDialogOpen(true)}
            className="col-span-1"
          />
        )}

        {(activeTab === "all" || activeTab === "competitive") && (
          <CodingProfileCard
            platform="codeforces"
            handle={cfHandle}
            stats={data?.codeforces}
            error={data?.codeforcesError}
            onEdit={() => setIsDialogOpen(true)}
            className="col-span-1"
          />
        )}

        {(activeTab === "all" || activeTab === "competitive") && (
          <CodingProfileCard
            platform="codechef"
            username={ccUsername}
            stats={data?.codechef}
            error={data?.codechefError}
            onEdit={() => setIsDialogOpen(true)}
            className="col-span-1"
          />
        )}

        {(activeTab === "all" || activeTab === "competitive") && (
          <CodingProfileCard
            platform="codewars"
            username={cwUsername}
            stats={data?.codewars}
            error={data?.codewarsError}
            onEdit={() => setIsDialogOpen(true)}
            className="col-span-1"
          />
        )}

        {(activeTab === "all" || activeTab === "competitive") && (
          <CodingProfileCard
            platform="atcoder"
            username={atcoderUsername}
            stats={data?.atcoder}
            error={data?.atcoderError}
            onEdit={() => setIsDialogOpen(true)}
            className="col-span-1"
          />
        )}


        <div id="github-profile-section" className="lg:col-span-2 scroll-mt-6">
          <CodingProfileCard
            platform="github"
            username={ghUsername}
            stats={data?.github}
            error={data?.githubError}
            onEdit={() => setIsDialogOpen(true)}
            githubToken={ghToken}
          />
        </div>
      </div>

      {/* Edit Usernames Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md w-[92vw] sm:w-full rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveUsernames}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Code2 className="size-5 text-primary" />
                Manage Platform Handles
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Enter your platform usernames or URLs to sync your statistics.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="leetcode_input" className="flex items-center gap-2 text-xs font-semibold">
                  <PlatformBrandLogo platform="leetcode" className="size-4" />
                  LeetCode Username / URL
                </Label>
                <Input
                  id="leetcode_input"
                  placeholder="e.g. john_doe or https://leetcode.com/u/john_doe"
                  value={leetcodeInput}
                  onChange={(e) => setLeetcodeInput(e.target.value)}
                  className="rounded-xl font-mono text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="codeforces_input" className="flex items-center gap-2 text-xs font-semibold">
                  <PlatformBrandLogo platform="codeforces" className="size-4" />
                  Codeforces Handle / URL
                </Label>
                <Input
                  id="codeforces_input"
                  placeholder="e.g. tourist or https://codeforces.com/profile/tourist"
                  value={codeforcesInput}
                  onChange={(e) => setCodeforcesInput(e.target.value)}
                  className="rounded-xl font-mono text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="codechef_input" className="flex items-center gap-2 text-xs font-semibold">
                  <PlatformBrandLogo platform="codechef" className="size-4" />
                  CodeChef Handle / URL
                </Label>
                <Input
                  id="codechef_input"
                  placeholder="e.g. tourist or https://www.codechef.com/users/tourist"
                  value={codechefInput}
                  onChange={(e) => setCodechefInput(e.target.value)}
                  className="rounded-xl font-mono text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="codewars_input" className="flex items-center gap-2 text-xs font-semibold">
                  <PlatformBrandLogo platform="codewars" className="size-4" />
                  Codewars Username / URL
                </Label>
                <Input
                  id="codewars_input"
                  placeholder="e.g. johndoe or https://www.codewars.com/users/johndoe"
                  value={codewarsInput}
                  onChange={(e) => setCodewarsInput(e.target.value)}
                  className="rounded-xl font-mono text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="geeksforgeeks_input" className="flex items-center gap-2 text-xs font-semibold">
                  <PlatformBrandLogo platform="geeksforgeeks" className="size-4" />
                  GeeksforGeeks Handle / URL
                </Label>
                <Input
                  id="geeksforgeeks_input"
                  placeholder="e.g. johndoe or https://www.geeksforgeeks.org/user/johndoe/"
                  value={geeksforgeeksInput}
                  onChange={(e) => setGeeksforgeeksInput(e.target.value)}
                  className="rounded-xl font-mono text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="atcoder_input" className="flex items-center gap-2 text-xs font-semibold">
                  <PlatformBrandLogo platform="atcoder" className="size-4" />
                  AtCoder Handle / URL
                </Label>
                <Input
                  id="atcoder_input"
                  placeholder="e.g. tourist or https://atcoder.jp/users/tourist"
                  value={atcoderInput}
                  onChange={(e) => setAtcoderInput(e.target.value)}
                  className="rounded-xl font-mono text-xs h-10"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="github_token_input" className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <PlatformBrandLogo platform="github" className="size-4" />
                    GitHub Access Token
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={testingToken || !githubTokenInput.trim()}
                    onClick={handleTestToken}
                    className="h-7 text-[11px] px-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 font-bold flex items-center gap-1"
                  >
                    {testingToken ? (
                      <>
                        <RefreshCw className="size-3 animate-spin" /> Testing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3" /> Test Token
                      </>
                    )}
                  </Button>
                </div>

                <div className="relative">
                  <Input
                    id="github_token_input"
                    type={showGithubToken ? "text" : "password"}
                    placeholder="ghp_..."
                    value={githubTokenInput}
                    onChange={(e) => setGithubTokenInput(e.target.value)}
                    className="rounded-xl font-mono text-xs h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGithubToken(!showGithubToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showGithubToken ? "Hide token" : "Show token"}
                  >
                    {showGithubToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Step-by-Step Instructions Card */}
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="size-3.5 text-blue-500" />
                      How to get your free 5,000 req/hr GitHub Token:
                    </span>
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 text-[10px] font-bold"
                    >
                      Open Settings <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground leading-relaxed">
                    <li>
                      Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">github.com/settings/tokens</a> $\rightarrow$ click <strong>Generate new token (classic)</strong>.
                    </li>
                    <li>
                      Type a Note (e.g. <code>EduSpace</code>) and <strong>leave all scope checkboxes blank</strong> (0 permissions needed!).
                    </li>
                    <li>
                      Click <strong>Generate token</strong> at the bottom, copy the code starting with <code>ghp_</code>, and paste above!
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingUsernames}
                className="rounded-xl text-xs font-semibold gap-1.5 px-5 shadow-sm"
              >
                {savingUsernames ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" /> Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
