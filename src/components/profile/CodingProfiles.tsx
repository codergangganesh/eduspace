import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCodingProfiles,
  extractUsername,
  fetchLeetCodeStats,
  fetchCodeforcesStats,
  fetchCodeChefStats,
  fetchCodewarsStats,
  fetchGeeksForGeeksStats,
  fetchAtCoderStats,
  fetchGitHubStats,
  saveCodingProfilesCache,
} from "@/services/codingProfileService";
import { fetchHackerRankStats, fetchHackerEarthStats } from "@/services/additionalPlatformsService";
import { fetchHuggingFaceStats } from "@/services/huggingFaceService";
import { fetchChessStats } from "@/services/chessService";
import { fetchCredlyStats, extractCredlyUsername } from "@/services/credlyService";
import { fetchWakaTimeStats, extractWakaTimeUsername } from "@/services/wakatimeService";
import { readStoredJson } from "@/lib/storage";
import { CodingProfilesResponse } from "@/types/codingProfile";
import { CodingProfileCard } from "./CodingProfileCard";
import { HackerRankProfileCard } from "./HackerRankProfileCard";
import { HuggingFaceProfileCard } from "./HuggingFaceProfileCard";
import { ChessProfileCard } from "./ChessProfileCard";
import { CredlyProfileCard } from "./CredlyProfileCard";
import { WakaTimeProfileCard } from "./WakaTimeProfileCard";
import { VercelProfileCard, getVercelConnection, syncVercelProfile, VercelConnectionData, VercelConnectButton, connectVercelWithToken, disconnectVercel } from "@/features/vercel";
import { CodingProfilesSkeleton } from "./CodingProfilesSkeleton";
import { RatingTrajectoryGraph } from "./RatingTrajectoryGraph";
import { PlatformErrorBoundary } from "./PlatformErrorBoundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  RefreshCw,
  Edit3,
  Code2,
  CheckCircle2,
  Code,
  GitBranch,
  Layers,
  Eye,
  EyeOff,
  HelpCircle,
  ExternalLink,
  Search,
  X,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const getInitialCache = (userId?: string): CodingProfilesResponse | null => {
  if (!userId) return null;
  return readStoredJson<CodingProfilesResponse | null>(`eduspace_coding_profile_cache_${userId}`, null);
};

interface CodingProfilesProps {
  className?: string;
}

export function CodingProfiles({ className }: CodingProfilesProps) {
  const { user, profile, updateProfile } = useAuth();

  const [data, setData] = useState<CodingProfilesResponse | null>(() => getInitialCache(user?.id));
  const [loading, setLoading] = useState<boolean>(() => !getInitialCache(user?.id));
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [focusedPlatform, setFocusedPlatform] = useState<string | null>(null);
  const [savingUsernames, setSavingUsernames] = useState<boolean>(false);
  const [testingToken, setTestingToken] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"all" | "competitive" | "opensource" | "codewars" | "hackerrank">("all");

  const [leetcodeInput, setLeetcodeInput] = useState<string>("");
  const [codeforcesInput, setCodeforcesInput] = useState<string>("");
  const [githubInput, setGithubInput] = useState<string>("");
  const [codechefInput, setCodechefInput] = useState<string>("");
  const [codewarsInput, setCodewarsInput] = useState<string>("");
  const [geeksforgeeksInput, setGeeksforgeeksInput] = useState<string>("");
  const [atcoderInput, setAtcoderInput] = useState<string>("");
  const [hackerrankInput, setHackerrankInput] = useState<string>("");
  const [hackerearthInput, setHackerearthInput] = useState<string>("");
  const [huggingfaceInput, setHuggingfaceInput] = useState<string>("");
  const [chessInput, setChessInput] = useState<string>("");
  const [credlyInput, setCredlyInput] = useState<string>("");
  const [wakatimeInput, setWakatimeInput] = useState<string>("");
  const [wakatimeApiKeyInput, setWakatimeApiKeyInput] = useState<string>("");
  const [githubTokenInput, setGithubTokenInput] = useState<string>("");
  const [showGithubToken, setShowGithubToken] = useState<boolean>(false);
  const [vercelTokenInput, setVercelTokenInput] = useState<string>("");
  const [connectingVercelToken, setConnectingVercelToken] = useState<boolean>(false);
  const [showVercelToken, setShowVercelToken] = useState<boolean>(false);
  const [vercelData, setVercelData] = useState<VercelConnectionData | null>(null);

  const lcUsername = profile?.leetcode_username || extractUsername(profile?.leetcode_url) || data?.leetcodeUsername || "";
  const cfHandle = profile?.codeforces_handle || extractUsername(profile?.codeforces_url) || data?.codeforcesHandle || "";
  const ghUsername = (profile?.github_url ? extractUsername(profile?.github_url) : "") || (profile as any)?.github_username || data?.githubUsername || "";
  const ccUsername = (profile as any)?.codechef_username || extractUsername((profile as any)?.codechef_url) || data?.codechefUsername || "";
  const cwUsername = (profile as any)?.codewars_username || extractUsername((profile as any)?.codewars_url) || data?.codewarsUsername || "";
  const gfgUsername = (profile as any)?.geeksforgeeks_username || extractUsername((profile as any)?.geeksforgeeks_url) || data?.geeksforgeeksUsername || "";
  const atcoderUsername = (profile as any)?.atcoder_username || extractUsername((profile as any)?.atcoder_url) || data?.atcoderUsername || "";
  const hrUsername = (profile as any)?.hackerrank_username || extractUsername((profile as any)?.hackerrank_url) || data?.hackerrankUsername || "";
  const heUsername = (profile as any)?.hackerearth_username || extractUsername((profile as any)?.hackerearth_url) || data?.hackerearthUsername || "";
  const hfUsername = (profile as any)?.huggingface_username || extractUsername((profile as any)?.huggingface_url) || data?.huggingfaceUsername || "";
  const chessUsername = (profile as any)?.chess_username || extractUsername((profile as any)?.chess_url) || data?.chessUsername || "";
  const credlyUsername = (profile as any)?.credly_username || extractCredlyUsername((profile as any)?.credly_url) || data?.credlyUsername || (user?.id ? localStorage.getItem(`eduspace_credly_username_${user.id}`) : null) || "";
  const wakatimeUsername = (profile as any)?.wakatime_username || extractWakaTimeUsername((profile as any)?.wakatime_url) || data?.wakatimeUsername || (user?.id ? localStorage.getItem(`eduspace_wakatime_username_${user.id}`) : null) || "";
  const wakatimeApiKey = (profile as any)?.wakatime_api_key || data?.wakatimeApiKey || "";
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
      setHackerrankInput((profile as any)?.hackerrank_username || extractUsername((profile as any)?.hackerrank_url) || data?.hackerrankUsername || "");
      setHackerearthInput((profile as any)?.hackerearth_username || extractUsername((profile as any)?.hackerearth_url) || data?.hackerearthUsername || "");
      setHuggingfaceInput((profile as any)?.huggingface_username || extractUsername((profile as any)?.huggingface_url) || data?.huggingfaceUsername || "");
      setChessInput((profile as any)?.chess_username || extractUsername((profile as any)?.chess_url) || data?.chessUsername || "");
      setCredlyInput((profile as any)?.credly_username || extractCredlyUsername((profile as any)?.credly_url) || data?.credlyUsername || (user?.id ? localStorage.getItem(`eduspace_credly_username_${user.id}`) : null) || "");
      setWakatimeInput((profile as any)?.wakatime_username || extractWakaTimeUsername((profile as any)?.wakatime_url) || data?.wakatimeUsername || (user?.id ? localStorage.getItem(`eduspace_wakatime_username_${user.id}`) : null) || "");
      setWakatimeApiKeyInput("");
      setGithubTokenInput("");
    }
  }, [profile, data?.leetcodeUsername, data?.codeforcesHandle, data?.githubUsername, data?.codechefUsername, data?.codewarsUsername, data?.geeksforgeeksUsername, data?.atcoderUsername, data?.hackerrankUsername, data?.hackerearthUsername, data?.huggingfaceUsername, data?.chessUsername, data?.credlyUsername, data?.githubToken]);

  const fetchProfiles = useCallback(
    async (
      forceRefresh = false,
      overrides?: {
        lc?: string;
        cf?: string;
        gh?: string;
        linkedin?: string;
        token?: string;
        cc?: string;
        cw?: string;
        gfg?: string;
        atcoder?: string;
        hr?: string;
        he?: string;
        hf?: string;
        chess?: string;
        credly?: string;
        wakatime?: string;
        wakatimeApiKey?: string;
      }
    ) => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading((prev) => (data ? false : true));
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
          overrides?.hr !== undefined ? overrides.hr : hrUsername,
          overrides?.he !== undefined ? overrides.he : heUsername,
          overrides?.hf !== undefined ? overrides.hf : hfUsername,
          overrides?.chess !== undefined ? overrides.chess : chessUsername,
          overrides?.credly !== undefined ? overrides.credly : credlyUsername,
          overrides?.wakatime !== undefined ? overrides.wakatime : wakatimeUsername,
          overrides?.wakatimeApiKey !== undefined ? overrides.wakatimeApiKey : wakatimeApiKey,
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
    [user?.id, lcUsername, cfHandle, ghUsername, ghToken, ccUsername, cwUsername, gfgUsername, atcoderUsername, hrUsername, heUsername, hfUsername, chessUsername, credlyUsername, wakatimeUsername, wakatimeApiKey]
  );

  useEffect(() => {
    fetchProfiles(false);
  }, [fetchProfiles]);

  useEffect(() => {
    if (user?.id) {
      // Purge any legacy secret tokens from localStorage
      try {
        localStorage.removeItem(`eduspace_github_token_${user.id}`);
        localStorage.removeItem(`eduspace_wakatime_apikey_${user.id}`);
        localStorage.removeItem(`eduspace_vercel_token_${user.id}`);
      } catch { }

      getVercelConnection(user.id).then((res) => {
        if (res.success && res.data) {
          setVercelData(res.data);
        }
      });
    }
  }, [user?.id]);

  const handleOpenEdit = (platformKey?: string) => {
    setFocusedPlatform(platformKey || null);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (!isDialogOpen || !focusedPlatform) return;

    const platformInputMap: Record<string, string> = {
      leetcode: "leetcode_input",
      codeforces: "codeforces_input",
      codechef: "codechef_input",
      codewars: "codewars_input",
      hackerrank: "hackerrank_input",
      atcoder: "atcoder_input",
      huggingface: "huggingface_input",
      chess: "chess_input",
      credly: "credly_input",
      wakatime: "wakatime_input",
      github: "github_input",
      vercel: "vercel_token_input",
      geeksforgeeks: "geeksforgeeks_input",
      hackerearth: "hackerearth_input",
    };

    const targetId = platformInputMap[focusedPlatform.toLowerCase()] || `${focusedPlatform}_input`;

    const focusAndScroll = () => {
      const el = document.getElementById(targetId) as HTMLInputElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus({ preventScroll: true });
        return true;
      }
      return false;
    };

    const r0 = requestAnimationFrame(focusAndScroll);
    const t1 = setTimeout(focusAndScroll, 60);
    const t2 = setTimeout(focusAndScroll, 180);
    const t3 = setTimeout(focusAndScroll, 320);

    return () => {
      cancelAnimationFrame(r0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isDialogOpen, focusedPlatform]);

  const [cardRefreshing, setCardRefreshing] = useState<Record<string, boolean>>({});
  const [pinnedPlatforms, setPinnedPlatforms] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("eduspace_pinned_platforms");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const togglePin = (platformKey: string) => {
    setPinnedPlatforms((prev) => {
      const isAlreadyPinned = prev.includes(platformKey);
      const updated = isAlreadyPinned
        ? prev.filter((key) => key !== platformKey)
        : [...prev, platformKey];

      try {
        localStorage.setItem("eduspace_pinned_platforms", JSON.stringify(updated));
      } catch { }

      const platformLabel = platformKey.charAt(0).toUpperCase() + platformKey.slice(1);
      if (isAlreadyPinned) {
        toast.info(`${platformLabel} unpinned`);
      } else {
        toast.success(`📌 ${platformLabel} pinned to top!`);
      }
      return updated;
    });
  };

  const DEFAULT_PLATFORM_KEYS = [
    "leetcode",
    "codeforces",
    "codechef",
    "codewars",
    "atcoder",
    "hackerrank",
    "huggingface",
    "chess",
    "credly",
    "wakatime",
    "vercel",
    "github",
  ];

  const [customOrder, setCustomOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_PLATFORM_KEYS;
    try {
      const stored = localStorage.getItem("eduspace_card_order");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const missing = DEFAULT_PLATFORM_KEYS.filter((k) => !parsed.includes(k));
          return [...parsed, ...missing];
        }
      }
    } catch { }
    return DEFAULT_PLATFORM_KEYS;
  });

  const sortedPlatformKeys = useMemo(() => {
    return [...customOrder].sort((a, b) => {
      const aPinned = pinnedPlatforms.includes(a);
      const bPinned = pinnedPlatforms.includes(b);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return customOrder.indexOf(a) - customOrder.indexOf(b);
    });
  }, [customOrder, pinnedPlatforms]);

  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData("text/plain", key);
    e.dataTransfer.effectAllowed = "move";
    setDraggedKey(key);
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverKey !== key) {
      setDragOverKey(key);
    }
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    const sourceKey = draggedKey || e.dataTransfer.getData("text/plain");
    if (!sourceKey || sourceKey === targetKey) {
      setDraggedKey(null);
      setDragOverKey(null);
      return;
    }

    setCustomOrder((prev) => {
      const sourceIndex = prev.indexOf(sourceKey);
      const targetIndex = prev.indexOf(targetKey);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const newOrder = [...prev];
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, sourceKey);

      try {
        localStorage.setItem("eduspace_card_order", JSON.stringify(newOrder));
      } catch { }

      toast.success("📌 Dashboard card order saved!");
      return newOrder;
    });

    setDraggedKey(null);
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const handleSingleCardRefresh = async (platformKey: string) => {
    if (cardRefreshing[platformKey] || refreshing) return;

    setCardRefreshing((prev) => ({ ...prev, [platformKey]: true }));
    const platformLabel = platformKey.charAt(0).toUpperCase() + platformKey.slice(1);
    const loadingId = toast.loading(`Updating ${platformLabel} statistics...`);

    try {
      let updatePatch: Partial<CodingProfilesResponse> = {};

      if (platformKey === "leetcode") {
        const res = await fetchLeetCodeStats(lcUsername);
        updatePatch = { leetcode: res.data, leetcodeUsername: lcUsername || null, leetcodeError: res.error };
      } else if (platformKey === "codeforces") {
        const res = await fetchCodeforcesStats(cfHandle);
        updatePatch = { codeforces: res.data, codeforcesHandle: cfHandle || null, codeforcesError: res.error };
      } else if (platformKey === "codechef") {
        const res = await fetchCodeChefStats(ccUsername);
        updatePatch = { codechef: res.data, codechefUsername: ccUsername || null, codechefError: res.error };
      } else if (platformKey === "codewars") {
        const res = await fetchCodewarsStats(cwUsername);
        updatePatch = { codewars: res.data, codewarsUsername: cwUsername || null, codewarsError: res.error };
      } else if (platformKey === "geeksforgeeks") {
        const res = await fetchGeeksForGeeksStats(gfgUsername);
        updatePatch = { geeksforgeeks: res.data, geeksforgeeksUsername: gfgUsername || null, geeksforgeeksError: res.error };
      } else if (platformKey === "atcoder") {
        const res = await fetchAtCoderStats(atcoderUsername);
        updatePatch = { atcoder: res.data, atcoderUsername: atcoderUsername || null, atcoderError: res.error };
      } else if (platformKey === "github") {
        const res = await fetchGitHubStats(ghUsername, ghToken);
        updatePatch = { github: res.data, githubUsername: ghUsername || null, githubToken: ghToken || null, githubError: res.error };
      } else if (platformKey === "hackerrank") {
        const res = await fetchHackerRankStats(hrUsername);
        updatePatch = { hackerrank: res.data, hackerrankUsername: hrUsername || null, hackerrankError: res.error };
      } else if (platformKey === "hackerearth") {
        const res = await fetchHackerEarthStats(heUsername);
        updatePatch = { hackerearth: res.data, hackerearthUsername: heUsername || null, hackerearthError: res.error };
      } else if (platformKey === "huggingface") {
        const res = await fetchHuggingFaceStats(hfUsername);
        updatePatch = { huggingface: res.data, huggingfaceUsername: hfUsername || null, huggingfaceError: res.error };
      } else if (platformKey === "chess") {
        const res = await fetchChessStats(chessUsername);
        updatePatch = { chess: res.data, chessUsername: chessUsername || null, chessError: res.error };
      } else if (platformKey === "credly") {
        const res = await fetchCredlyStats(credlyUsername);
        updatePatch = { credly: res.data, credlyUsername: credlyUsername || null, credlyError: res.error };
      } else if (platformKey === "wakatime") {
        const res = await fetchWakaTimeStats(wakatimeUsername, wakatimeApiKey);
        updatePatch = { wakatime: res.data, wakatimeUsername: wakatimeUsername || null, wakatimeApiKey: wakatimeApiKey || null, wakatimeError: res.error };
      } else if (platformKey === "vercel") {
        const res = await syncVercelProfile();
        if (res.success && res.data) {
          setVercelData(res.data);
        }
      }

      setData((prev) => {
        if (!prev) return prev;
        const updated: CodingProfilesResponse = { ...prev, ...updatePatch };
        const totalSolved = (
          (updated.leetcode?.totalSolved || 0) +
          (updated.codeforces?.totalSolved || 0) +
          (updated.codechef?.totalSolved || 0) +
          (updated.codewars?.totalSolved || 0) +
          (updated.geeksforgeeks?.totalSolved || 0) +
          (updated.atcoder?.totalSolved || 0) +
          (updated.hackerrank?.totalSolved || 0) +
          (updated.hackerearth?.totalSolved || 0)
        );
        if (updated.overall) {
          updated.overall.totalSolved = totalSolved;
        } else {
          updated.overall = { totalSolved };
        }
        if (user?.id) {
          saveCodingProfilesCache(user.id, updated);
        }
        return updated;
      });

      toast.success(`${platformLabel} updated!`, { id: loadingId });
    } catch (err: any) {
      toast.error(`Failed to refresh ${platformLabel}`, { id: loadingId });
    } finally {
      setCardRefreshing((prev) => ({ ...prev, [platformKey]: false }));
    }
  };

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
    const cleanHr = hackerrankInput.trim();
    const cleanHe = hackerearthInput.trim();
    const cleanHf = huggingfaceInput.trim();
    const cleanChess = chessInput.trim();
    const cleanCredly = credlyInput.trim();
    const cleanWaka = wakatimeInput.trim();
    const cleanWakaKey = wakatimeApiKeyInput.trim();
    const cleanGhToken = githubTokenInput.trim() ? githubTokenInput.trim() : (ghToken || "");
    const cleanVercelToken = vercelTokenInput.trim();

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

    // Identify which platform handles have actually changed compared to current values
    const lcChanged = cleanLc !== (lcUsername || "");
    const cfChanged = cleanCf !== (cfHandle || "");
    const ghChanged = cleanGh !== (ghUsername || "") || (githubTokenInput.trim() !== "" && githubTokenInput.trim() !== (ghToken || ""));
    const ccChanged = cleanCc !== (ccUsername || "");
    const cwChanged = cleanCw !== (cwUsername || "");
    const gfgChanged = cleanGfg !== (gfgUsername || "");
    const atcoderChanged = cleanAtcoder !== (atcoderUsername || "");
    const hrChanged = cleanHr !== (hrUsername || "");
    const heChanged = cleanHe !== (heUsername || "");
    const hfChanged = cleanHf !== (hfUsername || "");
    const chessChanged = cleanChess !== (chessUsername || "");
    const credlyChanged = cleanCredly !== (credlyUsername || "");
    const wakaChanged = cleanWaka !== (wakatimeUsername || "") || (cleanWakaKey !== "" && cleanWakaKey !== (wakatimeApiKey || ""));
    const vercelChanged = Boolean(cleanVercelToken);

    if (
      !lcChanged &&
      !cfChanged &&
      !ghChanged &&
      !ccChanged &&
      !cwChanged &&
      !gfgChanged &&
      !atcoderChanged &&
      !hrChanged &&
      !heChanged &&
      !hfChanged &&
      !chessChanged &&
      !credlyChanged &&
      !wakaChanged &&
      !vercelChanged
    ) {
      toast.info("No username changes detected.");
      setIsDialogOpen(false);
      return;
    }

    setSavingUsernames(true);
    try {
      if (user?.id) {
        // Clean up any secret tokens from localStorage
        localStorage.removeItem(`eduspace_github_token_${user.id}`);
        localStorage.removeItem(`eduspace_wakatime_apikey_${user.id}`);
        localStorage.removeItem(`eduspace_vercel_token_${user.id}`);

        if (cleanCredly) {
          localStorage.setItem(`eduspace_credly_username_${user.id}`, cleanCredly);
        } else {
          localStorage.removeItem(`eduspace_credly_username_${user.id}`);
        }
        if (cleanWaka) {
          localStorage.setItem(`eduspace_wakatime_username_${user.id}`, cleanWaka);
        } else {
          localStorage.removeItem(`eduspace_wakatime_username_${user.id}`);
        }
      }

      // Persist handles to Supabase profile
      await updateProfile({
        leetcode_username: cleanLc || null,
        codeforces_handle: cleanCf || null,
        github_url: cleanGh ? `https://github.com/${cleanGh}` : null,
        codechef_username: cleanCc || null,
        codewars_username: cleanCw || null,
        geeksforgeeks_username: cleanGfg || null,
        atcoder_username: cleanAtcoder || null,
        hackerrank_username: cleanHr || null,
        hackerearth_username: cleanHe || null,
        huggingface_username: cleanHf || null,
        chess_username: cleanChess || null,
        credly_username: cleanCredly || null,
        wakatime_username: cleanWaka || null,
        wakatime_api_key: cleanWakaKey || null,
        github_token: cleanGhToken || null,
      } as any);

      if (cleanVercelToken) {
        try {
          const vRes = await connectVercelWithToken(cleanVercelToken);
          if (vRes.success && vRes.data) {
            setVercelData(vRes.data);
            setVercelTokenInput("");
          }
        } catch { }
      }

      // Close the dialog immediately
      setIsDialogOpen(false);

      // Build individual fetch tasks strictly for the changed platforms
      interface ChangedPlatformTask {
        key: string;
        name: string;
        isRemoval: boolean;
        fetcher: () => Promise<Partial<CodingProfilesResponse>>;
      }

      const changedTasks: ChangedPlatformTask[] = [];

      if (lcChanged) {
        changedTasks.push({
          key: "leetcode",
          name: "LeetCode",
          isRemoval: !cleanLc,
          fetcher: async () => {
            if (!cleanLc) return { leetcode: null, leetcodeUsername: null, leetcodeError: undefined };
            const res = await fetchLeetCodeStats(cleanLc);
            return { leetcode: res.data, leetcodeUsername: cleanLc, leetcodeError: res.error };
          },
        });
      }

      if (cfChanged) {
        changedTasks.push({
          key: "codeforces",
          name: "Codeforces",
          isRemoval: !cleanCf,
          fetcher: async () => {
            if (!cleanCf) return { codeforces: null, codeforcesHandle: null, codeforcesError: undefined };
            const res = await fetchCodeforcesStats(cleanCf);
            return { codeforces: res.data, codeforcesHandle: cleanCf, codeforcesError: res.error };
          },
        });
      }

      if (ccChanged) {
        changedTasks.push({
          key: "codechef",
          name: "CodeChef",
          isRemoval: !cleanCc,
          fetcher: async () => {
            if (!cleanCc) return { codechef: null, codechefUsername: null, codechefError: undefined };
            const res = await fetchCodeChefStats(cleanCc);
            return { codechef: res.data, codechefUsername: cleanCc, codechefError: res.error };
          },
        });
      }

      if (cwChanged) {
        changedTasks.push({
          key: "codewars",
          name: "Codewars",
          isRemoval: !cleanCw,
          fetcher: async () => {
            if (!cleanCw) return { codewars: null, codewarsUsername: null, codewarsError: undefined };
            const res = await fetchCodewarsStats(cleanCw);
            return { codewars: res.data, codewarsUsername: cleanCw, codewarsError: res.error };
          },
        });
      }

      if (gfgChanged) {
        changedTasks.push({
          key: "geeksforgeeks",
          name: "GeeksforGeeks",
          isRemoval: !cleanGfg,
          fetcher: async () => {
            if (!cleanGfg) return { geeksforgeeks: null, geeksforgeeksUsername: null, geeksforgeeksError: undefined };
            const res = await fetchGeeksForGeeksStats(cleanGfg);
            return { geeksforgeeks: res.data, geeksforgeeksUsername: cleanGfg, geeksforgeeksError: res.error };
          },
        });
      }

      if (atcoderChanged) {
        changedTasks.push({
          key: "atcoder",
          name: "AtCoder",
          isRemoval: !cleanAtcoder,
          fetcher: async () => {
            if (!cleanAtcoder) return { atcoder: null, atcoderUsername: null, atcoderError: undefined };
            const res = await fetchAtCoderStats(cleanAtcoder);
            return { atcoder: res.data, atcoderUsername: cleanAtcoder, atcoderError: res.error };
          },
        });
      }

      if (hrChanged) {
        changedTasks.push({
          key: "hackerrank",
          name: "HackerRank",
          isRemoval: !cleanHr,
          fetcher: async () => {
            if (!cleanHr) return { hackerrank: null, hackerrankUsername: null, hackerrankError: undefined };
            const res = await fetchHackerRankStats(cleanHr);
            return { hackerrank: res.data, hackerrankUsername: cleanHr, hackerrankError: res.error };
          },
        });
      }

      if (heChanged) {
        changedTasks.push({
          key: "hackerearth",
          name: "HackerEarth",
          isRemoval: !cleanHe,
          fetcher: async () => {
            if (!cleanHe) return { hackerearth: null, hackerearthUsername: null, hackerearthError: undefined };
            const res = await fetchHackerEarthStats(cleanHe);
            return { hackerearth: res.data, hackerearthUsername: cleanHe, hackerearthError: res.error };
          },
        });
      }

      if (hfChanged) {
        changedTasks.push({
          key: "huggingface",
          name: "Hugging Face",
          isRemoval: !cleanHf,
          fetcher: async () => {
            if (!cleanHf) return { huggingface: null, huggingfaceUsername: null, huggingfaceError: undefined };
            const res = await fetchHuggingFaceStats(cleanHf);
            return { huggingface: res.data, huggingfaceUsername: cleanHf, huggingfaceError: res.error };
          },
        });
      }

      if (chessChanged) {
        changedTasks.push({
          key: "chess",
          name: "Chess.com",
          isRemoval: !cleanChess,
          fetcher: async () => {
            if (!cleanChess) return { chess: null, chessUsername: null, chessError: undefined };
            const res = await fetchChessStats(cleanChess);
            return { chess: res.data, chessUsername: cleanChess, chessError: res.error };
          },
        });
      }

      if (credlyChanged) {
        changedTasks.push({
          key: "credly",
          name: "Credly",
          isRemoval: !cleanCredly,
          fetcher: async () => {
            if (!cleanCredly) return { credly: null, credlyUsername: null, credlyError: undefined };
            const res = await fetchCredlyStats(cleanCredly);
            return { credly: res.data, credlyUsername: cleanCredly, credlyError: res.error };
          },
        });
      }

      if (wakaChanged) {
        changedTasks.push({
          key: "wakatime",
          name: "WakaTime",
          isRemoval: !cleanWaka,
          fetcher: async () => {
            if (!cleanWaka) return { wakatime: null, wakatimeUsername: null, wakatimeApiKey: null, wakatimeError: undefined };
            const apiKey = cleanWakaKey || wakatimeApiKey || "";
            const res = await fetchWakaTimeStats(cleanWaka, apiKey);
            return { wakatime: res.data, wakatimeUsername: cleanWaka, wakatimeApiKey: apiKey || null, wakatimeError: res.error };
          },
        });
      }

      if (ghChanged) {
        changedTasks.push({
          key: "github",
          name: "GitHub",
          isRemoval: !cleanGh,
          fetcher: async () => {
            if (!cleanGh) return { github: null, githubUsername: null, githubToken: null, githubError: undefined };
            const res = await fetchGitHubStats(cleanGh, cleanGhToken);
            return { github: res.data, githubUsername: cleanGh, githubToken: cleanGhToken || null, githubError: res.error };
          },
        });
      }

      // Mark ONLY the changed platform cards as refreshing
      if (changedTasks.length > 0) {
        setCardRefreshing((prev) => {
          const next = { ...prev };
          for (const task of changedTasks) {
            next[task.key] = true;
          }
          return next;
        });

        if (changedTasks.length === 1) {
          toast.info(`Updating ${changedTasks[0].name} statistics...`);
        } else {
          toast.info(`Updating statistics for ${changedTasks.map((t) => t.name).join(", ")}...`);
        }

        // Execute granular fetches concurrently
        await Promise.allSettled(
          changedTasks.map(async (task) => {
            try {
              const patch = await task.fetcher();
              setData((prev) => {
                if (!prev) return prev;
                const updated: CodingProfilesResponse = { ...prev, ...patch };
                const totalSolved = (
                  (updated.leetcode?.totalSolved || 0) +
                  (updated.codeforces?.totalSolved || 0) +
                  (updated.codechef?.totalSolved || 0) +
                  (updated.codewars?.totalSolved || 0) +
                  (updated.geeksforgeeks?.totalSolved || 0) +
                  (updated.atcoder?.totalSolved || 0) +
                  (updated.hackerrank?.totalSolved || 0) +
                  (updated.hackerearth?.totalSolved || 0)
                );
                if (updated.overall) {
                  updated.overall.totalSolved = totalSolved;
                } else {
                  updated.overall = { totalSolved };
                }
                if (user?.id) {
                  saveCodingProfilesCache(user.id, updated);
                }
                return updated;
              });

              if (task.isRemoval) {
                toast.info(`${task.name} handle removed`);
              } else {
                toast.success(`${task.name} updated!`);
              }
            } catch (err: any) {
              toast.error(`Failed to update ${task.name}: ${err?.message || "Error"}`);
            } finally {
              setCardRefreshing((prev) => ({ ...prev, [task.key]: false }));
            }
          })
        );
      }
    } catch (error: any) {
      toast.error("Failed to update usernames: " + (error?.message || "Unknown error"));
    } finally {
      setSavingUsernames(false);
    }
  };

  const handleTestGithubToken = async () => {
    const token = githubTokenInput.trim();
    if (!token) {
      toast.error("Please enter a GitHub personal access token to test.");
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
        await updateProfile({
          github_token: token,
        } as any);
        toast.success("GitHub token verified and saved successfully!");
        setGithubTokenInput("");
        handleSingleCardRefresh("github");
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

  const handleRemoveGithubToken = async () => {
    try {
      if (user?.id) {
        localStorage.removeItem(`eduspace_github_token_${user.id}`);
      }
      await updateProfile({
        github_token: null,
      } as any);
      setGithubTokenInput("");
      toast.success("GitHub token removed.");
      handleSingleCardRefresh("github");
    } catch (err: any) {
      toast.error("Failed to remove token: " + (err?.message || "Unknown error"));
    }
  };

  const handleConnectVercelToken = async () => {
    const token = vercelTokenInput.trim();
    if (!token) {
      toast.error("Please enter a Vercel Personal Access Token.");
      return;
    }
    setConnectingVercelToken(true);
    try {
      const res = await connectVercelWithToken(token);
      if (res.success && res.data) {
        setVercelData(res.data);
        toast.success("Vercel account connected successfully!");
        setVercelTokenInput("");
      } else {
        toast.error(res.error || "Failed to connect Vercel with token.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Connection failed.");
    } finally {
      setConnectingVercelToken(false);
    }
  };

  const handleDisconnectVercel = async () => {
    try {
      const res = await disconnectVercel();
      if (res.success) {
        setVercelData({ connected: false });
        setVercelTokenInput("");
        toast.success("Vercel account disconnected.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to disconnect Vercel.");
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

  const matchesSearch = (platformKey: string, platformName: string, username?: string | null) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      platformKey.toLowerCase().includes(q) ||
      platformName.toLowerCase().includes(q) ||
      (username && username.toLowerCase().includes(q))
    );
  };

  const isLeetCodeMatch = (activeTab === "all" || activeTab === "competitive") && matchesSearch("leetcode", "LeetCode", lcUsername);
  const isCodeforcesMatch = (activeTab === "all" || activeTab === "competitive") && matchesSearch("codeforces", "Codeforces", cfHandle);
  const isCodeChefMatch = (activeTab === "all" || activeTab === "competitive") && matchesSearch("codechef", "CodeChef", ccUsername);
  const isCodewarsMatch = (activeTab === "all" || activeTab === "competitive" || activeTab === "codewars") && matchesSearch("codewars", "Codewars", cwUsername);
  const isAtCoderMatch = (activeTab === "all" || activeTab === "competitive") && matchesSearch("atcoder", "AtCoder", atcoderUsername);
  const isHackerRankMatch = (activeTab === "all" || activeTab === "competitive" || activeTab === "hackerrank") && matchesSearch("hackerrank", "HackerRank", hrUsername);
  const isHuggingFaceMatch = (activeTab === "all" || activeTab === "competitive" || activeTab === "opensource") && matchesSearch("huggingface", "Hugging Face", hfUsername);
  const isChessMatch = (activeTab === "all" || activeTab === "competitive") && matchesSearch("chess", "Chess.com", chessUsername);
  const isCredlyMatch = (activeTab === "all" || activeTab === "opensource") && matchesSearch("credly", "Credly", credlyUsername);
  const isWakaTimeMatch = (activeTab === "all" || activeTab === "opensource") && matchesSearch("wakatime", "WakaTime", wakatimeUsername);
  const isVercelMatch = (activeTab === "all" || activeTab === "opensource") && matchesSearch("vercel", "Vercel", vercelData?.vercelUsername);
  const isGitHubMatch = (activeTab === "all" || activeTab === "opensource") && matchesSearch("github", "GitHub", ghUsername);

  const hasAnyVisibleCard = Boolean(
    isLeetCodeMatch ||
    isCodeforcesMatch ||
    isCodeChefMatch ||
    isCodewarsMatch ||
    isAtCoderMatch ||
    isHackerRankMatch ||
    isHuggingFaceMatch ||
    isChessMatch ||
    isCredlyMatch ||
    isWakaTimeMatch ||
    isVercelMatch ||
    isGitHubMatch
  );

  const allPlatformKeys = [
    "leetcode",
    "codeforces",
    "codechef",
    "codewars",
    "atcoder",
    "hackerrank",
    "huggingface",
    "chess",
    "credly",
    "wakatime",
    "vercel",
    "github",
  ];



  const renderCardByKey = (key: string) => {
    const isPinned = pinnedPlatforms.includes(key);
    const onTogglePin = () => togglePin(key);

    let rawCard: React.ReactNode = null;

    if (key === "leetcode" && isLeetCodeMatch) {
      rawCard = (
        <PlatformErrorBoundary platformName="LeetCode" onRetry={() => handleSingleCardRefresh("leetcode")}>
          <CodingProfileCard
            platform="leetcode"
            username={lcUsername}
            stats={data?.leetcode}
            error={data?.leetcodeError}
            onEdit={() => handleOpenEdit("leetcode")}
            onRefresh={() => handleSingleCardRefresh("leetcode")}
            isRefreshing={Boolean(cardRefreshing.leetcode || refreshing)}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            className="col-span-1"
          />
        </PlatformErrorBoundary>
      );
    } else if (key === "codeforces" && isCodeforcesMatch) {
      rawCard = (
        <PlatformErrorBoundary platformName="Codeforces" onRetry={() => handleSingleCardRefresh("codeforces")}>
          <CodingProfileCard
            platform="codeforces"
            handle={cfHandle}
            stats={data?.codeforces}
            error={data?.codeforcesError}
            onEdit={() => handleOpenEdit("codeforces")}
            onRefresh={() => handleSingleCardRefresh("codeforces")}
            isRefreshing={Boolean(cardRefreshing.codeforces || refreshing)}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            className="col-span-1"
          />
        </PlatformErrorBoundary>
      );
    } else if (key === "codechef" && isCodeChefMatch) {
      rawCard = (
        <PlatformErrorBoundary platformName="CodeChef" onRetry={() => handleSingleCardRefresh("codechef")}>
          <CodingProfileCard
            platform="codechef"
            username={ccUsername}
            stats={data?.codechef}
            error={data?.codechefError}
            onEdit={() => handleOpenEdit("codechef")}
            onRefresh={() => handleSingleCardRefresh("codechef")}
            isRefreshing={Boolean(cardRefreshing.codechef || refreshing)}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            className="col-span-1"
          />
        </PlatformErrorBoundary>
      );
    } else if (key === "codewars" && isCodewarsMatch) {
      rawCard = (
        <PlatformErrorBoundary platformName="Codewars" onRetry={() => handleSingleCardRefresh("codewars")}>
          <CodingProfileCard
            platform="codewars"
            username={cwUsername}
            stats={data?.codewars}
            error={data?.codewarsError}
            onEdit={() => handleOpenEdit("codewars")}
            onRefresh={() => handleSingleCardRefresh("codewars")}
            isRefreshing={Boolean(cardRefreshing.codewars || refreshing)}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            className="col-span-1"
          />
        </PlatformErrorBoundary>
      );
    } else if (key === "atcoder" && isAtCoderMatch) {
      rawCard = (
        <PlatformErrorBoundary platformName="AtCoder" onRetry={() => handleSingleCardRefresh("atcoder")}>
          <CodingProfileCard
            platform="atcoder"
            username={atcoderUsername}
            stats={data?.atcoder}
            error={data?.atcoderError}
            onEdit={() => handleOpenEdit("atcoder")}
            onRefresh={() => handleSingleCardRefresh("atcoder")}
            isRefreshing={Boolean(cardRefreshing.atcoder || refreshing)}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            className="col-span-1"
          />
        </PlatformErrorBoundary>
      );
    } else if (key === "hackerrank" && isHackerRankMatch) {
      rawCard = (
        <PlatformErrorBoundary platformName="HackerRank" onRetry={() => handleSingleCardRefresh("hackerrank")}>
          <HackerRankProfileCard
            usernameOrHandle={hrUsername}
            stats={data?.hackerrank}
            error={data?.hackerrankError}
            onConnect={() => handleOpenEdit("hackerrank")}
            onEditHandle={() => handleOpenEdit("hackerrank")}
            onRefresh={() => handleSingleCardRefresh("hackerrank")}
            isRefreshing={Boolean(cardRefreshing.hackerrank || refreshing)}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
          />
        </PlatformErrorBoundary>
      );
    } else if (key === "huggingface" && isHuggingFaceMatch) {
      rawCard = (
        <PlatformErrorBoundary platformName="HuggingFace" onRetry={() => handleSingleCardRefresh("huggingface")}>
          <HuggingFaceProfileCard
            usernameOrHandle={hfUsername}
            stats={data?.huggingface}
            error={data?.huggingfaceError}
            onConnect={() => handleOpenEdit("huggingface")}
            onEditHandle={() => handleOpenEdit("huggingface")}
            onRefresh={() => handleSingleCardRefresh("huggingface")}
            isRefreshing={Boolean(cardRefreshing.huggingface || refreshing)}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
          />
        </PlatformErrorBoundary>
      );
    } else if (key === "chess" && isChessMatch) {
      rawCard = (
        <div id="chess-profile-section" className="col-span-1 scroll-mt-6">
          <PlatformErrorBoundary platformName="Chess.com" onRetry={() => handleSingleCardRefresh("chess")}>
            <ChessProfileCard
              usernameOrHandle={chessUsername}
              stats={data?.chess}
              error={data?.chessError}
              onConnect={() => handleOpenEdit("chess")}
              onEditHandle={() => handleOpenEdit("chess")}
              onRefresh={() => handleSingleCardRefresh("chess")}
              isRefreshing={Boolean(cardRefreshing.chess || refreshing)}
              isPinned={isPinned}
              onTogglePin={onTogglePin}
            />
          </PlatformErrorBoundary>
        </div>
      );
    } else if (key === "credly" && isCredlyMatch) {
      rawCard = (
        <div id="credly-profile-section" className="col-span-1 scroll-mt-6">
          <PlatformErrorBoundary platformName="Credly" onRetry={() => handleSingleCardRefresh("credly")}>
            <CredlyProfileCard
              usernameOrHandle={credlyUsername}
              stats={data?.credly}
              error={data?.credlyError}
              onConnect={() => handleOpenEdit("credly")}
              onEditHandle={() => handleOpenEdit("credly")}
              onRefresh={() => handleSingleCardRefresh("credly")}
              isRefreshing={Boolean(cardRefreshing.credly || refreshing)}
              isPinned={isPinned}
              onTogglePin={onTogglePin}
            />
          </PlatformErrorBoundary>
        </div>
      );
    } else if (key === "wakatime" && isWakaTimeMatch) {
      rawCard = (
        <div id="wakatime-profile-section" className="col-span-1 scroll-mt-6">
          <PlatformErrorBoundary platformName="WakaTime" onRetry={() => handleSingleCardRefresh("wakatime")}>
            <WakaTimeProfileCard
              usernameOrHandle={wakatimeUsername}
              stats={data?.wakatime}
              error={data?.wakatimeError}
              onConnect={() => handleOpenEdit("wakatime")}
              onEditHandle={() => handleOpenEdit("wakatime")}
              onRefresh={() => handleSingleCardRefresh("wakatime")}
              isRefreshing={Boolean(cardRefreshing.wakatime || refreshing)}
              isPinned={isPinned}
              onTogglePin={onTogglePin}
            />
          </PlatformErrorBoundary>
        </div>
      );
    } else if (key === "vercel" && isVercelMatch) {
      rawCard = (
        <div id="vercel-profile-section" className="col-span-1 scroll-mt-6">
          <PlatformErrorBoundary
            platformName="Vercel"
            onRetry={() => {
              if (user?.id) {
                getVercelConnection(user.id).then((r) => r.data && setVercelData(r.data));
              }
            }}
          >
            <VercelProfileCard
              usernameOrHandle={vercelData?.vercelUsername}
              connectionData={vercelData}
              onConnect={() => handleOpenEdit("vercel")}
              onEditHandle={() => handleOpenEdit("vercel")}
              onRefresh={() => handleSingleCardRefresh("vercel")}
              onRefreshSuccess={(newData) => setVercelData(newData)}
              onDisconnectSuccess={() => {
                setVercelData({ connected: false });
                setVercelTokenInput("");
                if (user?.id) {
                  try {
                    localStorage.removeItem(`eduspace_vercel_token_${user.id}`);
                  } catch { }
                }
              }}
              isRefreshing={Boolean(cardRefreshing.vercel || refreshing)}
              isPinned={isPinned}
              onTogglePin={onTogglePin}
            />
          </PlatformErrorBoundary>
        </div>
      );
    } else if (key === "github" && isGitHubMatch) {
      rawCard = (
        <div id="github-profile-section" className="col-span-1 lg:col-span-2 scroll-mt-6">
          <PlatformErrorBoundary platformName="GitHub" onRetry={() => handleSingleCardRefresh("github")}>
            <CodingProfileCard
              platform="github"
              username={ghUsername}
              stats={data?.github}
              error={data?.githubError}
              onEdit={() => handleOpenEdit("github")}
              onRefresh={() => handleSingleCardRefresh("github")}
              isRefreshing={Boolean(cardRefreshing.github || refreshing)}
              isPinned={isPinned}
              onTogglePin={onTogglePin}
              githubToken={ghToken}
            />
          </PlatformErrorBoundary>
        </div>
      );
    }

    if (!rawCard) return null;

    const isGithub = key === "github";

    return (
      <div
        key={key}
        draggable
        onDragStart={(e) => handleDragStart(e, key)}
        onDragOver={(e) => handleDragOver(e, key)}
        onDrop={(e) => handleDrop(e, key)}
        onDragEnd={handleDragEnd}
        className={cn(
          "transition-all duration-300 relative group/drag cursor-grab active:cursor-grabbing h-full flex flex-col",
          isGithub ? "lg:col-span-2" : "col-span-1",
          draggedKey === key && "opacity-40 scale-95 border-2 border-dashed border-primary rounded-3xl",
          dragOverKey === key && draggedKey !== key && "ring-2 ring-primary/60 scale-[1.01] rounded-3xl shadow-xl"
        )}
      >
        <div
          className="absolute top-4 left-4 z-20 opacity-0 group-hover/drag:opacity-100 transition-opacity p-1 rounded-lg bg-card/90 border border-border/60 shadow-xs text-muted-foreground hover:text-foreground pointer-events-none"
          title="Drag to reorder platform card"
        >
          <GripVertical className="size-3.5" />
        </div>
        {rawCard}
      </div>
    );
  };

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
                  title="Open Source Projects (GitHub)"
                  className={cn(
                    "p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center",
                    activeTab === "opensource"
                      ? "bg-card text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitBranch className="size-3.5" />
                </button>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handleOpenEdit()}
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

          {/* Desktop Right Section: Search Bar + Category Tabs + Action Buttons + Total Solved */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3 flex-wrap justify-end shrink-0">
            {/* Instant Platform Search Bar */}
            <div className="relative flex items-center shrink-0">
              <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search platform..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 pr-7 rounded-xl text-xs bg-muted/50 border-border/60 focus:bg-card focus:border-primary/50 w-36 focus:w-56 transition-all duration-300 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 p-0.5 text-muted-foreground hover:text-foreground rounded-full"
                  title="Clear search"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40 text-xs font-bold flex-wrap">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                  activeTab === "all"
                    ? "bg-card text-foreground shadow-sm border border-border/60 font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="size-3.5" />
              </button>

              <button
                onClick={() => setActiveTab("competitive")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                  activeTab === "competitive"
                    ? "bg-card text-foreground shadow-sm border border-border/60 font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Code className="size-3.5" />
              </button>

              <button
                onClick={handleOpenSourceClick}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-muted-foreground hover:text-foreground",
                  activeTab === "opensource" && "bg-card text-foreground shadow-sm border border-border/60 font-extrabold"
                )}
              >
                <GitBranch className="size-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleOpenEdit()}
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

        {/* Mobile-Only Instant Search Bar */}
        <div className="sm:hidden mt-2.5 pt-2.5 border-t border-border/40">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search platforms (e.g. chess, leetcode)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-8 rounded-xl text-xs bg-muted/50 border-border/60 focus:bg-card text-foreground w-full font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 p-0.5 text-muted-foreground hover:text-foreground rounded-full"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile-Only Modern Total Solved Problems Banner below search */}
        <div className="sm:hidden mt-2.5 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span className="text-xs font-bold text-foreground">Total Solved Problems</span>
          </div>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
            {overallTotal}
          </span>
        </div>
      </div>

      {/* Rating Trajectory Graph Filtered by Selected Tab */}
      <PlatformErrorBoundary platformName="Rating Trajectory Graph">
        <RatingTrajectoryGraph
          cfHandle={cfHandle}
          lcUsername={lcUsername}
          ccUsername={ccUsername}
          cwUsername={cwUsername}
          hrUsername={hrUsername}
          hrStats={data?.hackerrank}
          lcStats={data?.leetcode}
          ccStats={data?.codechef}
          ccContests={data?.codechef?.recentContests}
          selectedPlatformFilter={activeTab}
        />
      </PlatformErrorBoundary>

      {/* Bento Cards Grid Layout Sorted by Pin State & Filtered by Search Query */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedPlatformKeys.map((key) => renderCardByKey(key))}
      </div>

      {/* Empty State when Search Query finds no matching platforms */}
      {!hasAnyVisibleCard && (
        <div className="rounded-3xl border border-dashed border-border/80 p-8 sm:p-12 text-center bg-card/60 backdrop-blur-xl space-y-4">
          <div className="size-12 rounded-2xl bg-muted/60 border border-border/40 flex items-center justify-center mx-auto text-muted-foreground">
            <Search className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-foreground">No platform cards found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No platform matches your search filter <span className="font-bold text-foreground">"{searchQuery}"</span>. Try searching for LeetCode, Codeforces, Chess, WakaTime, or GitHub.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="rounded-xl border-border/80 text-xs font-semibold"
          >
            Clear Search Filter
          </Button>
        </div>
      )}

      {/* Edit Usernames Slide-Over Sheet */}
      <Sheet
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setFocusedPlatform(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200/50 dark:border-slate-800/50 p-0 overflow-hidden flex flex-col z-[70]"
          onOpenAutoFocus={(e) => {
            if (focusedPlatform) {
              e.preventDefault();
            }
          }}
        >
          <form onSubmit={handleSaveUsernames} className="flex flex-col h-full overflow-y-auto p-6 space-y-4">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                <Code2 className="size-5 text-primary" />
                Manage Platform Handles
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Enter your platform usernames or URLs to sync your statistics.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="leetcode_input" className="text-xs font-semibold">
                  LeetCode Username
                </Label>
                <Input
                  id="leetcode_input"
                  placeholder="e.g. tourist"
                  value={leetcodeInput}
                  onChange={(e) => setLeetcodeInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("leetcode")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "leetcode" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="codeforces_input" className="text-xs font-semibold">
                  Codeforces Handle
                </Label>
                <Input
                  id="codeforces_input"
                  placeholder="e.g. tourist"
                  value={codeforcesInput}
                  onChange={(e) => setCodeforcesInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("codeforces")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "codeforces" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="codechef_input" className="text-xs font-semibold">
                  CodeChef Username
                </Label>
                <Input
                  id="codechef_input"
                  placeholder="e.g. tourist"
                  value={codechefInput}
                  onChange={(e) => setCodechefInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("codechef")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "codechef" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="codewars_input" className="text-xs font-semibold">
                  Codewars Username
                </Label>
                <Input
                  id="codewars_input"
                  placeholder="e.g. ganesh"
                  value={codewarsInput}
                  onChange={(e) => setCodewarsInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("codewars")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "codewars" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hackerrank_input" className="text-xs font-semibold">
                  HackerRank Username
                </Label>
                <Input
                  id="hackerrank_input"
                  placeholder="e.g. ganesh"
                  value={hackerrankInput}
                  onChange={(e) => setHackerrankInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("hackerrank")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "hackerrank" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="atcoder_input" className="text-xs font-semibold">
                  AtCoder Handle
                </Label>
                <Input
                  id="atcoder_input"
                  placeholder="e.g. tourist"
                  value={atcoderInput}
                  onChange={(e) => setAtcoderInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("atcoder")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "atcoder" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="huggingface_input" className="text-xs font-semibold">
                  HuggingFace Username
                </Label>
                <Input
                  id="huggingface_input"
                  placeholder="e.g. ganesh"
                  value={huggingfaceInput}
                  onChange={(e) => setHuggingfaceInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("huggingface")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "huggingface" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chess_input" className="text-xs font-semibold">
                  Chess.com Username
                </Label>
                <Input
                  id="chess_input"
                  placeholder="e.g. magnuscarlsen"
                  value={chessInput}
                  onChange={(e) => setChessInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("chess")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "chess" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="credly_input" className="text-xs font-semibold">
                  Credly Username / Profile URL
                </Label>
                <Input
                  id="credly_input"
                  placeholder="e.g. ganesh or full credly URL"
                  value={credlyInput}
                  onChange={(e) => setCredlyInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("credly")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "credly" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wakatime_input" className="text-xs font-semibold">
                  WakaTime Username
                </Label>
                <Input
                  id="wakatime_input"
                  placeholder="e.g. ganesh"
                  value={wakatimeInput}
                  onChange={(e) => setWakatimeInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("wakatime")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "wakatime" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wakatime_api_key_input" className="text-xs font-semibold">
                  WakaTime Secret API Key (Optional)
                </Label>
                <Input
                  id="wakatime_api_key_input"
                  type="password"
                  placeholder="waka_sec_..."
                  value={wakatimeApiKeyInput}
                  onChange={(e) => setWakatimeApiKeyInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("wakatime")}
                  className="rounded-xl font-mono text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="github_input" className="text-xs font-semibold">
                  GitHub Username / URL
                </Label>
                <Input
                  id="github_input"
                  placeholder="e.g. torvalds"
                  value={githubInput}
                  onChange={(e) => setGithubInput(e.target.value)}
                  onFocus={() => setFocusedPlatform("github")}
                  className={cn(
                    "rounded-xl font-mono text-xs h-10 transition-all duration-300",
                    focusedPlatform === "github" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                  )}
                />
              </div>

              {/* GitHub Token Field */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between gap-1.5 w-full flex-nowrap min-w-0">
                  <Label htmlFor="github_token_input" className="text-xs font-bold text-foreground flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <span>
                      GitHub <span className="hidden sm:inline">Personal Access </span>Token
                    </span>
                  </Label>

                  <div className="flex items-center gap-1.5 shrink min-w-0 flex-nowrap">
                    {ghToken ? (
                      <div className="flex items-center gap-1.5 shrink min-w-0 flex-nowrap">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                          Configured
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveGithubToken}
                          className="h-5 text-[10px] font-semibold text-destructive hover:bg-destructive/10 px-1.5 rounded shrink-0 whitespace-nowrap"
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                        Optional
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="github_token_input"
                      type={showGithubToken ? "text" : "password"}
                      placeholder={
                        ghToken
                          ? "•••••••••••••••• (configured — paste new token to update)"
                          : "Paste GitHub Token (ghp_...)"
                      }
                      value={githubTokenInput}
                      onChange={(e) => setGithubTokenInput(e.target.value)}
                      onFocus={() => setFocusedPlatform("github")}
                      className="rounded-xl font-mono text-xs h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGithubToken(!showGithubToken)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showGithubToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    disabled={testingToken || !githubTokenInput.trim()}
                    onClick={handleTestGithubToken}
                    className="h-10 text-xs px-4 rounded-xl font-bold gap-1.5 shadow-sm shrink-0 bg-black hover:bg-neutral-900 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black"
                  >
                    {testingToken ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        <span>{ghToken ? "Update" : "Verify"}</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Step-by-Step Instructions Card */}
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="size-3.5 text-blue-500" />
                      How to get your free GitHub Token:
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
                      Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">github.com/settings/tokens</a> → click <strong>Generate new token (classic)</strong>.
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

              {/* Vercel Token Connection Section */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between gap-1.5 w-full flex-nowrap min-w-0">
                  <Label
                    htmlFor="vercel_token_input"
                    className="text-xs font-bold text-foreground flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                  >
                    <svg className="size-3.5 fill-current shrink-0" viewBox="0 0 116 100">
                      <polygon points="58 0, 116 100, 0 100" />
                    </svg>
                    <span>
                      Vercel <span className="hidden sm:inline">Personal Access </span>Token
                    </span>
                  </Label>

                  <div className="flex items-center gap-1.5 shrink min-w-0 flex-nowrap">
                    {vercelData?.connected ? (
                      <div className="flex items-center gap-1.5 shrink min-w-0 flex-nowrap">
                        <span
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 min-w-0 truncate max-w-[120px] sm:max-w-[190px]"
                          title={`@${vercelData.vercelUsername}`}
                        >
                          <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                          <span className="truncate">@{vercelData.vercelUsername}</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleDisconnectVercel}
                          className="h-5 text-[10px] font-semibold text-destructive hover:bg-destructive/10 px-1.5 rounded shrink-0 whitespace-nowrap"
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                        Optional
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="vercel_token_input"
                      type={showVercelToken ? "text" : "password"}
                      placeholder={
                        vercelData?.connected
                          ? "•••••••••••••••• (configured — paste new token to update)"
                          : "Paste Vercel Token (from vercel.com/account/tokens)"
                      }
                      value={vercelTokenInput}
                      onChange={(e) => setVercelTokenInput(e.target.value)}
                      onFocus={() => setFocusedPlatform("vercel")}
                      className={cn(
                        "rounded-xl font-mono text-xs h-10 pr-10 transition-all duration-300",
                        focusedPlatform === "vercel" && "ring-2 ring-primary/80 border-primary bg-primary/[0.03] shadow-sm"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowVercelToken(!showVercelToken)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showVercelToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    disabled={connectingVercelToken || !vercelTokenInput.trim()}
                    onClick={handleConnectVercelToken}
                    className="h-10 text-xs px-4 rounded-xl font-bold gap-1.5 shadow-sm shrink-0 bg-black hover:bg-neutral-900 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black"
                  >
                    {connectingVercelToken ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        <span>{vercelData?.connected ? "Update" : "Connect"}</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Step-by-Step Instructions Card */}
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="size-3.5 text-blue-500" />
                      How to get your free Vercel Token:
                    </span>
                    <a
                      href="https://vercel.com/account/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 text-[10px] font-bold"
                    >
                      Open Settings <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground leading-relaxed">
                    <li>
                      Go to <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline font-medium">vercel.com/account/tokens</a> → click <strong>Create Token</strong>.
                    </li>
                    <li>
                      Type a description (e.g. <code>EduSpace</code>) and choose expiration (e.g. <strong>No Expiration</strong>).
                    </li>
                    <li>
                      Click <strong>Create</strong>, copy the generated token, and paste it above!
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <SheetFooter className="gap-2 sm:gap-0 pt-2">
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
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
