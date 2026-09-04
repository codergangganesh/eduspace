import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth, Profile as ProfileType } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";
import { useTheme } from "@/contexts/ThemeContext"; // Added for theme management
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  User,
  GraduationCap,
  Shield,
  Bell,
  Settings,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Camera,
  Save,
  BookOpen,
  Award,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  Globe,
  Palette,
  Loader2,
  Upload,
  Trash2,
  Share2,
  Linkedin,
  Github,
  Twitter,
  Copy,
  Link as LinkIcon,
  ExternalLink,
  Download,
  Code2,
  Terminal,
  Cpu,
  AudioWaveform,
  MoreVertical,
  Fingerprint,
  Laptop,
  Key,
  KeyRound,
  Plus,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { ProfileNotificationSettings } from "@/components/ProfileNotificationSettings";
import { CodingProfiles } from "@/components/profile/CodingProfiles";
import { ProfileMobileMoreSheet } from "@/components/profile/ProfileMobileMoreSheet";
import SEO from "@/components/SEO";
import imageCompression from "browser-image-compression";
import DOMPurify from "dompurify";
import {
  passkeyService,
  PasskeyFactor,
  isPasskeySupported,
  getSuggestedPasskeyName,
} from "@/services/passkey.service";
import { MfaSecurityCard } from "@/components/auth/MfaSecurityCard";
import { AndroidIcon } from "@/components/auth/MfaEnrollDrawer";
import { PinSecurityCard } from "@/components/auth/PinSecurityCard";
import { ActiveDevicesCard } from "@/components/auth/ActiveDevicesCard";

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
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
  </svg>
);

const ChessIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a3 3 0 0 0-3 3c0 .8.3 1.5.8 2.1C8.6 8.1 8 9.5 8 11c0 1.2.4 2.3 1.1 3.1C7.8 15.3 7 17 7 19h10c0-2-.8-3.7-2.1-4.9.7-.8 1.1-1.9 1.1-3.1 0-1.5-.6-2.9-1.8-3.9.5-.6.8-1.3.8-2.1a3 3 0 0 0-3-3zm-6 19v2h12v-2H6z" />
  </svg>
);

const CodolioIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1 14.5a1.5 1.5 0 0 1-2.25 1.3l-4.5-3a1.5 1.5 0 0 1 0-2.6l4.5-3A1.5 1.5 0 0 1 13 10.5v6zm4-3a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 1 0-3h2z" />
  </svg>
);

const CodewarsIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2L19.5 8 12 11.8 4.5 8 12 4.2zM4.5 9.8l6.75 3.4v6.6L4.5 16.4V9.8zm15 6.6l-6.75 3.4v-6.6l6.75-3.4v6.6z" />
  </svg>
);

const GeeksForGeeksIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const VercelIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={cn("fill-current", className)} viewBox="0 0 116 100">
    <polygon points="58 0, 116 100, 0 100" />
  </svg>
);

const BRAND_ICON_URLS: Record<string, string> = {
  leetcode: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/leetcode/leetcode-original.svg",
  codeforces: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codeforces/codeforces-original.svg",
  hackerrank: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/hackerrank/hackerrank-original.svg",
  codechef: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/codechef.svg",
  codewars: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codewars/codewars-original.svg",
  geeksforgeeks: "https://media.geeksforgeeks.org/wp-content/cdn-uploads/gfg_200X200.png",
  codolio: "https://codolio.com/codolio_assets/codolio.svg",
  linkedin: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg",
  github: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
  chess: "https://images.chesscomfiles.com/uploads/v1/user/29371584.582ecb3d.50x50o.a1a0989f64bf.png",
  twitter: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/twitter/twitter-original.svg",
  vercel: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vercel/vercel-original.svg",
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

const DEFAULT_CORE_PLATFORMS = ['linkedin', 'github', 'leetcode', 'codeforces', 'hackerrank', 'codechef', 'codewars', 'geeksforgeeks', 'chess', 'vercel', 'codolio', 'twitter', 'portfolio'];

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

const getHeaderProfileIcons = (data: Record<string, any>, isViewOnly = false): SocialPlatformItem[] => {
  const allPlatforms: SocialPlatformItem[] = [
    { id: 'linkedin', label: 'LinkedIn', url: data.linkedin_url, icon: Linkedin, bg: 'bg-[#0077b5]/10 hover:bg-[#0077b5]/20', border: 'border-[#0077b5]/30', text: 'text-[#0077b5]', shadow: 'hover:shadow-[0_0_12px_rgba(0,119,181,0.35)]' },
    { id: 'github', label: 'GitHub', url: data.github_url, icon: Github, bg: 'bg-slate-500/10 hover:bg-slate-500/20', border: 'border-slate-500/30', text: 'text-foreground dark:text-white', shadow: 'hover:shadow-[0_0_12px_rgba(100,116,139,0.35)]' },
    { id: 'leetcode', label: 'LeetCode', url: data.leetcode_url, icon: LeetCodeIcon, bg: 'bg-[#FFA116]/10 hover:bg-[#FFA116]/20', border: 'border-[#FFA116]/30', text: 'text-[#FFA116]', shadow: 'hover:shadow-[0_0_12px_rgba(255,161,22,0.35)]' },
    { id: 'codeforces', label: 'Codeforces', url: data.codeforces_url, icon: CodeforcesIcon, bg: 'bg-[#1F8ACB]/10 hover:bg-[#1F8ACB]/20', border: 'border-[#1F8ACB]/30', text: 'text-[#1F8ACB]', shadow: 'hover:shadow-[0_0_12px_rgba(31,138,203,0.35)]' },
    { id: 'hackerrank', label: 'HackerRank', url: data.hackerrank_url, icon: HackerRankIcon, bg: 'bg-[#2EC4B6]/10 hover:bg-[#2EC4B6]/20', border: 'border-[#2EC4B6]/30', text: 'text-[#2EC4B6]', shadow: 'hover:shadow-[0_0_12px_rgba(46,196,182,0.35)]' },
    { id: 'codechef', label: 'CodeChef', url: data.codechef_url, icon: CodeChefIcon, bg: 'bg-[#5B4638]/15 hover:bg-[#5B4638]/30', border: 'border-[#5B4638]/40', text: 'text-[#d97706]', shadow: 'hover:shadow-[0_0_12px_rgba(217,119,6,0.35)]' },
    { id: 'codewars', label: 'Codewars', url: data.codewars_url, icon: CodewarsIcon, bg: 'bg-rose-500/10 hover:bg-rose-500/20', border: 'border-rose-500/30', text: 'text-rose-500', shadow: 'hover:shadow-[0_0_12px_rgba(244,63,94,0.35)]' },
    { id: 'geeksforgeeks', label: 'GeeksforGeeks', url: data.geeksforgeeks_url, icon: GeeksForGeeksIcon, bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-500', shadow: 'hover:shadow-[0_0_12px_rgba(16,185,129,0.35)]' },
    { id: 'chess', label: 'Chess.com', url: data.chess_url, icon: ChessIcon, bg: 'bg-[#81b64c]/10 hover:bg-[#81b64c]/20', border: 'border-[#81b64c]/30', text: 'text-[#81b64c]', shadow: 'hover:shadow-[0_0_12px_rgba(129,182,76,0.35)]' },
    { id: 'vercel', label: 'Vercel', url: data.vercel_url, icon: VercelIcon, bg: 'bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20', border: 'border-black/30 dark:border-white/30', text: 'text-foreground', shadow: 'hover:shadow-[0_0_12px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.35)]' },
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

export default function Profile() {
  const { t } = useTranslation();
  const { user, profile, isAuthenticated, isLoading: authLoading, updateProfile, role } = useAuth();
  const { globalHideDashboardHeader, setGlobalHideDashboardHeader } = useLayout();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [showMoreMobileSheet, setShowMoreMobileSheet] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isLecturer = role === "lecturer" || profile?.role === "lecturer";
  const isStudent = !isLecturer;

  const studentProfileTabs = [
    { id: "personal", label: t("profile.personalInfo", "Personal Info"), icon: User },
    { id: "academic", label: t("profile.academicDetails", "Academic Details"), icon: GraduationCap },
    { id: "coding", label: t("profile.codingProfiles", "Coding Profiles"), icon: Code2 },
    { id: "social", label: t("profile.socialLinks", "Social Links"), icon: Share2 },
    { id: "screen-lock", label: t("profile.screenLock", "PIN & Screen Lock"), icon: KeyRound },
    { id: "sessions", label: t("profile.activeSessions", "Active Sessions & Devices"), icon: Laptop },
    { id: "security", label: t("profile.security", "Security"), icon: Shield },
    { id: "notifications", label: t("common.notifications", "Notifications"), icon: Bell },
    { id: "preferences", label: t("common.settings", "Settings"), icon: Settings },
  ];

  const lecturerProfileTabs = [
    { id: "personal", label: t("profile.personalInfo", "Personal Info"), icon: User },
    { id: "academic", label: t("profile.academicDetails", "Academic Details"), icon: GraduationCap },
    { id: "screen-lock", label: t("profile.screenLock", "PIN & Screen Lock"), icon: KeyRound },
    { id: "sessions", label: t("profile.activeSessions", "Active Sessions & Devices"), icon: Laptop },
    { id: "security", label: t("profile.security", "Security"), icon: Shield },
    { id: "2fa", label: t("profile.twoFactorAuth", "Two-Factor Auth (2FA)"), icon: AndroidIcon },
    { id: "passkeys", label: t("profile.passkeys", "Passkeys & Biometrics"), icon: Fingerprint },
    { id: "password", label: t("profile.accountPassword", "Account Password"), icon: Lock },
    { id: "notifications", label: t("common.notifications", "Notifications"), icon: Bell },
    { id: "preferences", label: t("common.settings", "Settings"), icon: Settings },
  ];

  const visibleProfileTabs = isLecturer ? lecturerProfileTabs : studentProfileTabs;

  const primaryMobileTabs = isLecturer
    ? visibleProfileTabs.filter(
      (tab) => tab.id === "personal" || tab.id === "academic" || tab.id === "screen-lock" || tab.id === "security" || tab.id === "2fa"
    )
    : visibleProfileTabs.filter(
      (tab) => tab.id === "personal" || tab.id === "academic" || tab.id === "coding" || tab.id === "social"
    );
  const secondaryMobileTabs = visibleProfileTabs.filter(
    (tab) => !primaryMobileTabs.some((p) => p.id === tab.id)
  );
  const isMoreMobileActive = secondaryMobileTabs.some((tab) => tab.id === activeTab);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    bio: "",
    street: "",
    city: "",
    state: "",
    zip_code: "",
    country: "United States",
    // Academic
    student_id: "",
    program: "",
    year: "",
    department: "",
    gpa: "",
    credits_completed: "",
    credits_required: "",
    advisor: "",
    enrollment_date: "",
    expected_graduation: "",
    // Notifications
    notifications_enabled: true,
    // Preferences
    language: "en",
    timezone: "America/New_York",
    theme: "system",
    batch: "",
    hod_name: "",
    // Social & Coding
    linkedin_url: "",
    github_url: "",
    twitter_url: "",
    portfolio_url: "",
    leetcode_url: "",
    codeforces_url: "",
    hackerrank_url: "",
    codechef_url: "",
    codewars_url: "",
    geeksforgeeks_url: "",
    chess_url: "",
    codolio_url: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Passkeys state
  const [passkeys, setPasskeys] = useState<PasskeyFactor[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [isAddPasskeyOpen, setIsAddPasskeyOpen] = useState(false);
  const [deletingPasskey, setDeletingPasskey] = useState<PasskeyFactor | null>(null);
  const [isDeletingPasskey, setIsDeletingPasskey] = useState(false);

  useEffect(() => {
    if (activeTab === "security" || activeTab === "passkeys" || passkeys.length === 0) {
      fetchPasskeys();
    }
  }, [activeTab]);

  const fetchPasskeys = async () => {
    try {
      setIsLoadingPasskeys(true);
      const { data, error } = await passkeyService.listPasskeys();
      if (!error && data) {
        setPasskeys(data);
      }
    } catch (err) {
      console.error("Error fetching passkeys:", err);
    } finally {
      setIsLoadingPasskeys(false);
    }
  };

  const handleOpenAddPasskey = () => {
    setPasskeyName(getSuggestedPasskeyName());
    setIsAddPasskeyOpen(true);
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyName.trim()) {
      toast.error("Please enter a recognizable name for this passkey.");
      return;
    }

    try {
      setIsRegisteringPasskey(true);
      const { data, error } = await passkeyService.registerPasskey(passkeyName.trim());

      if (error) {
        toast.error(error || "Passkey registration failed.");
        return;
      }

      toast.success("Passkey registered successfully! You can now use it to sign in passwordlessly.");
      setIsAddPasskeyOpen(false);
      setPasskeyName("");
      await fetchPasskeys();
    } catch (err: any) {
      toast.error(err.message || "Failed to register passkey.");
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleConfirmDeletePasskey = async () => {
    if (!deletingPasskey) return;

    try {
      setIsDeletingPasskey(true);
      const { success, error } = await passkeyService.removePasskey(deletingPasskey.id);

      if (!success || error) {
        toast.error(error || "Could not delete passkey.");
        return;
      }

      toast.success(`Passkey "${deletingPasskey.friendly_name}" was successfully removed.`);
      setDeletingPasskey(null);
      await fetchPasskeys();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete passkey.");
    } finally {
      setIsDeletingPasskey(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        date_of_birth: profile.date_of_birth || "",
        bio: profile.bio || "",
        street: profile.street || "",
        city: profile.city || "",
        state: profile.state || "",
        zip_code: profile.zip_code || "",
        country: profile.country || "United States",
        student_id: profile.student_id || "",
        program: profile.program || "",
        year: profile.year || "",
        department: profile.department || "",
        gpa: profile.gpa?.toString() || "",
        credits_completed: profile.credits_completed?.toString() || "",
        credits_required: profile.credits_required?.toString() || "",
        advisor: profile.advisor || "",
        enrollment_date: profile.enrollment_date || "",
        expected_graduation: profile.expected_graduation || "",
        notifications_enabled: profile.notifications_enabled ?? true,
        language: profile.language || "en",
        timezone: profile.timezone || "America/New_York",
        theme: profile.theme || "system",
        batch: profile.batch || "",
        hod_name: profile.hod_name || "",
        linkedin_url: profile.linkedin_url || "",
        github_url: profile.github_url || "",
        twitter_url: profile.twitter_url || "",
        portfolio_url: profile.portfolio_url || "",
        leetcode_url: profile.leetcode_url || "",
        codeforces_url: profile.codeforces_url || "",
        hackerrank_url: profile.hackerrank_url || "",
        codechef_url: (profile as any).codechef_url || "",
        codewars_url: (profile as any).codewars_url || "",
        geeksforgeeks_url: (profile as any).geeksforgeeks_url || "",
        chess_url: (profile as any).chess_url || "",
        codolio_url: profile.codolio_url || "",
      });
    }
  }, [profile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 50MB) - Important for mobile users
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Image size should be less than 50MB');
      return;
    }

    // Set preview for instant visual feedback
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    const uploadToast = toast.loading('Uploading profile image...');
    setIsUploadingImage(true);

    try {
      // Compress image before upload for blazing fast uploads
      toast.loading('Compressing image...', { id: uploadToast });
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);

      // Upload to Cloudinary
      toast.loading('Finishing upload...', { id: uploadToast });
      const uploaded = await uploadToCloudinary(compressedFile);
      console.log('Image uploaded to Cloudinary:', uploaded.url);

      const result = await updateProfile({ avatar_url: uploaded.url } as Partial<ProfileType>);

      if (result.success) {
        toast.success('Profile image updated successfully!', { id: uploadToast });
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setAvatarPreview(null); // Revert preview on failure
      const errorMessage = error.message === "Failed to fetch"
        ? "Network error. Please check your internet connection."
        : error.message || 'Failed to upload image';
      toast.error(errorMessage, { id: uploadToast });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Banner size should be less than 50MB');
      return;
    }

    // Set preview for instant visual feedback
    const previewUrl = URL.createObjectURL(file);
    setBannerPreview(previewUrl);

    const uploadToast = toast.loading('Uploading cover photo...');
    setIsUploadingBanner(true);

    try {
      // Compress banner before upload for blazing fast uploads
      toast.loading('Compressing banner...', { id: uploadToast });
      const options = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);

      // Upload to Cloudinary
      toast.loading('Finishing upload...', { id: uploadToast });
      const uploaded = await uploadToCloudinary(compressedFile);
      console.log('Banner uploaded to Cloudinary:', uploaded.url);

      const result = await updateProfile({ cover_url: uploaded.url } as Partial<ProfileType>);

      if (result.success) {
        toast.success('Cover photo updated successfully!', { id: uploadToast });
      } else {
        throw new Error(result.error || 'Failed to update cover photo');
      }
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      setBannerPreview(null); // Revert preview on failure
      const errorMessage = error.message === "Failed to fetch"
        ? "Network error. Please check your internet connection."
        : error.message || 'Failed to upload banner';
      toast.error(errorMessage, { id: uploadToast });
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  const calculateProfileCompleteness = () => {
    if (!profile) return 0;

    const fieldsToTrack = [
      'full_name', 'email', 'phone', 'date_of_birth', 'bio',
      'street', 'city', 'state', 'zip_code', 'country',
      'avatar_url', 'cover_url', 'student_id', 'program',
      'linkedin_url', 'github_url', 'twitter_url', 'portfolio_url'
    ];

    const completedFields = fieldsToTrack.filter(field => {
      const value = (profile as any)[field];
      return value && value !== "" && value !== null;
    });

    return Math.round((completedFields.length / fieldsToTrack.length) * 100);
  };

  const completeness = calculateProfileCompleteness();

  // Show skeleton during initial auth load to prevent flickering
  // Once loaded, don't show loading state during tab changes or refreshes
  if (authLoading && !profile) {
    return (
      <DashboardLayout>
        <ProfileSkeleton />
      </DashboardLayout>
    );
  }

  // Only redirect if not authenticated and auth is fully loaded
  if (!isAuthenticated && !authLoading) {
    return null;
  }

  const handleInputChange = async (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-save notification preferences
    if (typeof value === 'boolean') {
      const result = await updateProfile({ [field]: value } as Partial<ProfileType>);
      if (result.success) {
        toast.success("Preference saved");
      } else {
        toast.error("Failed to save preference");
        // Revert on failure
        setFormData((prev) => ({ ...prev, [field]: !value }));
      }
    }
  };

  const handleSave = async () => {
    // Basic validation to prevent payload bloat before sanitization
    if (formData.full_name && formData.full_name.length > 100) {
      toast.error("Full name cannot exceed 100 characters");
      return;
    }
    if (formData.bio && formData.bio.length > 500) {
      toast.error("Bio cannot exceed 500 characters");
      return;
    }

    setIsSaving(true);

    // Sanitize all text inputs to prevent XSS payloads
    const result = await updateProfile({
      full_name: DOMPurify.sanitize(formData.full_name.trim()),
      email: formData.email,
      phone: DOMPurify.sanitize(formData.phone.trim()),
      date_of_birth: formData.date_of_birth || null,
      bio: DOMPurify.sanitize(formData.bio.trim()),
      street: DOMPurify.sanitize(formData.street.trim()),
      city: DOMPurify.sanitize(formData.city.trim()),
      state: DOMPurify.sanitize(formData.state.trim()),
      zip_code: DOMPurify.sanitize(formData.zip_code.trim()),
      country: DOMPurify.sanitize(formData.country.trim()),
      student_id: DOMPurify.sanitize(formData.student_id.trim()),
      program: DOMPurify.sanitize(formData.program.trim()),
      year: DOMPurify.sanitize(formData.year.trim()),
      department: DOMPurify.sanitize(formData.department.trim()),
      gpa: formData.gpa ? parseFloat(formData.gpa) : null,
      credits_completed: formData.credits_completed ? parseInt(formData.credits_completed) : null,
      credits_required: formData.credits_required ? parseInt(formData.credits_required) : null,
      advisor: DOMPurify.sanitize(formData.advisor.trim()),
      enrollment_date: formData.enrollment_date || null,
      expected_graduation: formData.expected_graduation || null,
      notifications_enabled: formData.notifications_enabled,
      language: formData.language,
      timezone: formData.timezone,
      theme: formData.theme,
      batch: DOMPurify.sanitize(formData.batch.trim()),
      hod_name: DOMPurify.sanitize(formData.hod_name.trim()),
      linkedin_url: DOMPurify.sanitize(formData.linkedin_url.trim()),
      github_url: DOMPurify.sanitize(formData.github_url.trim()),
      twitter_url: DOMPurify.sanitize(formData.twitter_url.trim()),
      portfolio_url: DOMPurify.sanitize(formData.portfolio_url.trim()),
      leetcode_url: DOMPurify.sanitize(formData.leetcode_url.trim()),
      codeforces_url: DOMPurify.sanitize(formData.codeforces_url.trim()),
      hackerrank_url: DOMPurify.sanitize(formData.hackerrank_url.trim()),
      codechef_url: DOMPurify.sanitize(formData.codechef_url.trim()),
      chess_url: DOMPurify.sanitize(formData.chess_url.trim()),
      codolio_url: DOMPurify.sanitize(formData.codolio_url.trim()),
    } as Partial<ProfileType>);

    if (result.success) {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } else {
      toast.error(result.error || "Failed to update profile");
    }
    setIsSaving(false);
  };

  const handleShare = async () => {
    if (!profile?.user_id) {
      toast.error("Profile ID not found. Please refresh and try again.");
      return;
    }
    const profileUrl = `https://eduspaceacademy.online/p/${profile.user_id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${formData.full_name}'s Profile | EduSpace`,
          text: `Check out my academic profile on EduSpace!`,
          url: profileUrl,
        });
        toast.success("Shared successfully");
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
          copyToClipboard(profileUrl);
        }
      }
    } else {
      copyToClipboard(profileUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Link copied to clipboard");
    }).catch((err) => {
      console.error('Could not copy text: ', err);
      toast.error("Failed to copy link");
    });
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (!/[A-Z]/.test(passwordData.newPassword) || !/[a-z]/.test(passwordData.newPassword) || !/[0-9]/.test(passwordData.newPassword)) {
      toast.error("Password must contain uppercase letters, lowercase letters, and at least one number");
      return;
    }

    setIsSaving(true);

    try {
      // If current password was provided, verify it first
      if (passwordData.currentPassword && user?.email) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: passwordData.currentPassword,
        });
        if (verifyErr) {
          toast.error("Current password is incorrect");
          setIsSaving(false);
          return;
        }
      }

      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        toast.error(error.message || "Failed to update password");
      } else {
        toast.success("Password updated successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const bioMaxLength = 250;
  const bioRemaining = bioMaxLength - (formData.bio?.length || 0);
  const initials = formData.full_name?.split(" ").map((n) => n[0]).join("") || "U";

  return (
    <DashboardLayout>
      <SEO
        title="Your Profile"
        description="Manage your academic and personal information, notification preferences, and account settings."
      />
      {profile?.status === "suspended" && (
        <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-5 py-3.5 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full shrink-0">
              <Shield className="size-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-tight leading-tight">
                Your account has been suspended
              </h4>
              <p className="text-xs text-white/90 leading-snug">
                An administrator has suspended your platform access. Please contact support or your institution administrator for assistance.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-contact-support"))}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-rose-700 hover:bg-white/90 transition-all shrink-0 shadow-sm"
          >
            Contact Support
          </button>
        </div>
      )}
      <div className="flex flex-col xl:flex-row gap-8 w-full animate-in fade-in duration-500 pb-24 xl:pb-0">
        {/* Left Sidebar - Profile Navigation (Desktop Only) */}
        <div className="hidden xl:block w-80 shrink-0">
          <div className="bg-surface border border-border rounded-xl p-4 sticky top-4">
            {/* User Quick Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
              <Avatar className="size-12">
                <AvatarImage src={avatarPreview || profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{formData.full_name || "User"}</h3>
                <p className="text-xs text-muted-foreground">
                  {role === "lecturer" ? `Lecturer ID: ${formData.student_id || "N/A"}` : `Student ID: ${formData.student_id || "N/A"}`}
                </p>
              </div>
            </div>

            {/* Verified Badge */}
            {profile?.verified && (
              <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                <CheckCircle className="size-4" />
                <span>Account Verified</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <nav className="flex flex-col gap-1">
              {visibleProfileTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <tab.icon className="size-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Profile Header Card */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Banner Section */}
            <div className="relative h-32 sm:h-48 w-full group">
              {bannerPreview || profile?.cover_url ? (
                <img
                  src={bannerPreview || profile?.cover_url}
                  alt="Profile Banner"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/10 to-surface" />
              )}

              {/* Banner Upload Button */}
              <div className="absolute top-4 right-4">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  className="bg-black/20 hover:bg-black/40 text-white border-white/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                >
                  {isUploadingBanner ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <Camera className="size-4 mr-2" />
                  )}
                  {profile?.cover_url ? "Change Cover" : "Add Cover"}
                </Button>
              </div>
            </div>

            <div className="p-4 sm:p-6 sm:pt-0 relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                {/* Avatar with Edit */}
                <div className="relative shrink-0 -mt-12 sm:-mt-16">
                  <Avatar className="size-24 sm:size-32 border-4 border-surface shadow-xl">
                    <AvatarImage src={avatarPreview || profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute bottom-2 right-2 size-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-surface"
                    title="Upload profile image"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                  </button>
                </div>

                {/* User Info & Actions */}
                <div className="flex-1 w-full pt-2 flex flex-col items-center sm:items-start min-w-0">
                  <div className="min-w-0 w-full mb-3 sm:mb-2 flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-2 sm:gap-4">
                    <div className="min-w-0 flex flex-col items-center sm:items-start">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 truncate">
                          {formData.full_name || "User"}
                          {profile?.verified && (
                            <CheckCircle className="size-5 text-primary fill-primary/10 shrink-0" />
                          )}
                        </h1>

                        {/* 10 Profile Icons Bar (Right Side of Profile Name - Students Only) */}
                        {isStudent && (
                          <div className="flex items-center gap-1 shrink-0 flex-wrap">
                            <div className="hidden sm:block h-4 w-[1px] bg-border/60 mx-1" />
                            <TooltipProvider delayDuration={100}>
                              {getHeaderProfileIcons(formData).map((platform) => {
                                const isFilled = Boolean(platform.url);
                                return (
                                  <Tooltip key={platform.id}>
                                    <TooltipTrigger asChild>
                                      {isFilled ? (
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
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveTab("social");
                                            setIsEditing(true);
                                          }}
                                          className="size-6.5 rounded-full flex items-center justify-center border border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground/50 hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:scale-105 p-1"
                                        >
                                          <RealBrandIcon id={platform.id} label={platform.label} fallback={platform.icon} className="size-3.5 object-contain opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
                                        </button>
                                      )}
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

                      <p className="text-muted-foreground truncate mt-1 sm:mt-0">
                        {formData.program || "No program set"} {formData.year && `• ${formData.year}`}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar & Actions Row */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
                    {/* Profile Completeness Tracker */}
                    <div className="space-y-1.5 w-full sm:max-w-md flex-1">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                        <span className="text-muted-foreground font-medium uppercase tracking-widest">{t("profile.completeness", "Completeness")}</span>
                        <span className="text-primary font-black">{completeness}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-border/30">
                        <div
                          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons (Right side of Progress Bar) */}
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar shrink-0 justify-center sm:justify-end pb-1 sm:pb-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPublicProfile(true)}
                        className="bg-surface/50 backdrop-blur-sm whitespace-nowrap shrink-0 border-border/50"
                      >
                        <Eye className="size-4 mr-2" />
                        {t("profile.publicProfile", "Public Profile")}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                        onClick={() => handleShare()}
                      >
                        <Share2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coding Profiles Section (Students Only) */}
          {isStudent && activeTab === "coding" && <CodingProfiles />}

          {/* Personal Information Section */}
          {activeTab === "personal" && (
            <>
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">{t("profile.personalInfo", "Personal Information")}</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {isEditing ? t("common.cancel", "Cancel") : t("common.edit", "Edit Info")}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        value={formData.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        value={formData.email}
                        disabled
                        className="pl-10 bg-muted/50"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium text-foreground">Bio</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value.slice(0, bioMaxLength))}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bioRemaining} characters left
                  </p>
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Address Details</h2>

                <div className="space-y-4">
                  {/* Street Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Street Address</label>
                    <Input
                      value={formData.street}
                      onChange={(e) => handleInputChange("street", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* City */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">City</label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* State */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">State / Province</label>
                      <Input
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Zip Code */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Zip Code</label>
                      <Input
                        value={formData.zip_code}
                        onChange={(e) => handleInputChange("zip_code", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Country</label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => handleInputChange("country", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="India">India</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}

          {/* Social Links Section (Students Only) */}
          {isStudent && activeTab === "social" && (
            <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Share2 className="size-5 text-primary" />
                  Social & Professional Links
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {isEditing ? "Cancel" : "Edit Info"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LinkedIn */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Linkedin className="size-4 text-[#0077b5]" />
                    LinkedIn Profile
                  </label>
                  <Input
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin_url}
                    onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                    disabled={!isEditing}
                    className="bg-surface/50 transition-all focus:ring-primary/20"
                  />
                </div>

                {/* GitHub */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Github className="size-4 text-[#333]" />
                    GitHub Profile
                  </label>
                  <Input
                    placeholder="https://github.com/username"
                    value={formData.github_url}
                    onChange={(e) => handleInputChange("github_url", e.target.value)}
                    disabled={!isEditing}
                    className="bg-surface/50 transition-all focus:ring-primary/20"
                  />
                </div>

                {/* LeetCode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <RealBrandIcon id="leetcode" label="LeetCode" fallback={LeetCodeIcon} className="size-4 object-contain" />
                    LeetCode Profile
                  </label>
                  <Input
                    placeholder="https://leetcode.com/u/username"
                    value={formData.leetcode_url}
                    onChange={(e) => handleInputChange("leetcode_url", e.target.value)}
                    disabled={!isEditing}
                    className="bg-surface/50 transition-all focus:ring-primary/20"
                  />
                </div>

                {/* Codeforces */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <RealBrandIcon id="codeforces" label="Codeforces" fallback={CodeforcesIcon} className="size-4 object-contain" />
                    Codeforces Profile
                  </label>
                  <Input
                    placeholder="https://codeforces.com/profile/handle"
                    value={formData.codeforces_url}
                    onChange={(e) => handleInputChange("codeforces_url", e.target.value)}
                    disabled={!isEditing}
                    className="bg-surface/50 transition-all focus:ring-primary/20"
                  />
                </div>

                {/* HackerRank */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <RealBrandIcon id="hackerrank" label="HackerRank" fallback={HackerRankIcon} className="size-4 object-contain" />
                    HackerRank Profile
                  </label>
                  <Input
                    placeholder="https://hackerrank.com/profile/username"
                    value={formData.hackerrank_url}
                    onChange={(e) => handleInputChange("hackerrank_url", e.target.value)}
                    disabled={!isEditing}
                    className="bg-surface/50 transition-all focus:ring-primary/20"
                  />
                </div>

                {/* CodeChef */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <RealBrandIcon id="codechef" label="CodeChef" fallback={CodeChefIcon} className="size-4 object-contain" />
                    CodeChef Profile
                  </label>
                  <Input
                    placeholder="https://codechef.com/users/username"
                    value={formData.codechef_url}
                    onChange={(e) => handleInputChange("codechef_url", e.target.value)}
                    disabled={!isEditing}
                    className="bg-surface/50 transition-all focus:ring-primary/20"
                  />
                </div>

                {/* Chess.com */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <RealBrandIcon id="chess" label="Chess.com" fallback={ChessIcon} className="size-4 object-contain" />
                    Chess.com Profile
                  </label>
                  <Input
                    placeholder="https://chess.com/member/username"
                    value={formData.chess_url}
                    onChange={(e) => handleInputChange("chess_url", e.target.value)}
                    disabled={!isEditing}
                    className="bg-surface/50 transition-all focus:ring-primary/20"
                  />
                </div>

                {/* Codolio */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <RealBrandIcon id="codolio" label="Codolio" fallback={CodolioIcon} className="size-4 object-contain" />
                    Codolio Profile
                  </label>
                  <Input
                    placeholder="https://codolio.com/profile/username"
                    value={formData.codolio_url}
                    onChange={(e) => handleInputChange("codolio_url", e.target.value)}
                    disabled={!isEditing}
                    className="bg-surface/50 transition-all focus:ring-primary/20"
                  />
                </div>

                {/* Twitter / X */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Twitter className="size-4 text-[#1DA1F2]" />
                    Twitter / X
                  </label>
                  <Input
                    placeholder="https://twitter.com/username"
                    value={formData.twitter_url}
                    onChange={(e) => handleInputChange("twitter_url", e.target.value)}
                    disabled={!isEditing}
                    className="bg-surface/50 transition-all focus:ring-primary/20"
                  />
                </div>

                {/* Portfolio */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Globe className="size-4 text-primary" />
                    Personal Portfolio
                  </label>
                  <Input
                    placeholder="https://yourportfolio.com"
                    value={formData.portfolio_url}
                    onChange={(e) => handleInputChange("portfolio_url", e.target.value)}
                    disabled={!isEditing}
                    className="bg-surface/50 transition-all focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Glassmorphism Social Preview (Only if not editing) */}
              {!isEditing && (
                <div className="mt-8 pt-6 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-4">Quick Connect</p>
                  <div className="flex flex-wrap gap-3">
                    {formData.linkedin_url && (
                      <a href={formData.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full bg-[#0077b5]/10 hover:bg-[#0077b5]/20 border border-[#0077b5]/20 transition-all text-sm font-medium text-[#0077b5] backdrop-blur-sm group" title="LinkedIn Profile">
                        <RealBrandIcon id="linkedin" label="LinkedIn" fallback={Linkedin} className="size-4 object-contain group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">LinkedIn</span>
                      </a>
                    )}
                    {formData.github_url && (
                      <a href={formData.github_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 transition-all text-sm font-medium text-foreground backdrop-blur-sm group" title="GitHub Profile">
                        <RealBrandIcon id="github" label="GitHub" fallback={Github} className="size-4 object-contain group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">GitHub</span>
                      </a>
                    )}
                    {formData.leetcode_url && (
                      <a href={formData.leetcode_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full bg-[#FFA116]/10 hover:bg-[#FFA116]/20 border border-[#FFA116]/20 transition-all text-sm font-medium text-[#FFA116] backdrop-blur-sm group" title="LeetCode Profile">
                        <RealBrandIcon id="leetcode" label="LeetCode" fallback={LeetCodeIcon} className="size-4 object-contain group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">LeetCode</span>
                      </a>
                    )}
                    {formData.codeforces_url && (
                      <a href={formData.codeforces_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full bg-[#1F8ACB]/10 hover:bg-[#1F8ACB]/20 border border-[#1F8ACB]/20 transition-all text-sm font-medium text-[#1F8ACB] backdrop-blur-sm group" title="Codeforces Profile">
                        <RealBrandIcon id="codeforces" label="Codeforces" fallback={CodeforcesIcon} className="size-4 object-contain group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Codeforces</span>
                      </a>
                    )}
                    {formData.hackerrank_url && (
                      <a href={formData.hackerrank_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full bg-[#2EC4B6]/10 hover:bg-[#2EC4B6]/20 border border-[#2EC4B6]/20 transition-all text-sm font-medium text-[#2EC4B6] backdrop-blur-sm group" title="HackerRank Profile">
                        <RealBrandIcon id="hackerrank" label="HackerRank" fallback={HackerRankIcon} className="size-4 object-contain group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">HackerRank</span>
                      </a>
                    )}
                    {formData.codechef_url && (
                      <a href={formData.codechef_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full bg-[#5B4638]/20 hover:bg-[#5B4638]/30 border border-[#5B4638]/30 transition-all text-sm font-medium text-[#d97706] backdrop-blur-sm group" title="CodeChef Profile">
                        <RealBrandIcon id="codechef" label="CodeChef" fallback={CodeChefIcon} className="size-4 object-contain group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">CodeChef</span>
                      </a>
                    )}
                    {formData.chess_url && (
                      <a href={formData.chess_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full bg-[#81b64c]/10 hover:bg-[#81b64c]/20 border border-[#81b64c]/20 transition-all text-sm font-medium text-[#81b64c] backdrop-blur-sm group" title="Chess.com Profile">
                        <RealBrandIcon id="chess" label="Chess.com" fallback={ChessIcon} className="size-4 object-contain group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Chess.com</span>
                      </a>
                    )}
                    {formData.codolio_url && (
                      <a href={formData.codolio_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full bg-[#FF5722]/10 hover:bg-[#FF5722]/20 border border-[#FF5722]/20 transition-all text-sm font-medium text-[#FF5722] backdrop-blur-sm group" title="Codolio Profile">
                        <RealBrandIcon id="codolio" label="Codolio" fallback={CodolioIcon} className="size-4 object-contain group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Codolio</span>
                      </a>
                    )}
                    {formData.twitter_url && (
                      <a href={formData.twitter_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 transition-all text-sm font-medium text-[#1DA1F2] backdrop-blur-sm group" title="Twitter / X Profile">
                        <RealBrandIcon id="twitter" label="Twitter / X" fallback={Twitter} className="size-4 object-contain group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Twitter / X</span>
                      </a>
                    )}
                    {formData.portfolio_url && (
                      <a href={formData.portfolio_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all text-sm font-medium text-primary backdrop-blur-sm group" title="Portfolio">
                        <Globe className="size-4 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Portfolio</span>
                      </a>
                    )}
                    {!formData.linkedin_url &&
                      !formData.github_url &&
                      !formData.leetcode_url &&
                      !formData.codeforces_url &&
                      !formData.hackerrank_url &&
                      !formData.codechef_url &&
                      !formData.chess_url &&
                      !formData.codolio_url &&
                      !formData.twitter_url &&
                      !formData.portfolio_url && (
                        <p className="text-xs text-muted-foreground italic">No social or coding links added yet.</p>
                      )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Academic Details Section */}
          {activeTab === "academic" && (
            <>
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Academic Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {isEditing ? "Cancel" : "Edit Info"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student/Lecturer ID - Moved outside to be top level first item maybe? Or keep in grid */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {role === "lecturer" ? "Lecturer ID" : "Student ID"}
                    </label>
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        value={formData.student_id}
                        onChange={(e) => handleInputChange("student_id", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Program */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Program</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        value={formData.program}
                        onChange={(e) => handleInputChange("program", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="e.g., B.Sc. Computer Science"
                      />
                    </div>
                  </div>

                  {/* Additional Lecturer Fields */}
                  {role === "lecturer" && (
                    <>
                      {/* Batch */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Batch</label>
                        <Select
                          value={formData.batch}
                          onValueChange={(value) => handleInputChange("batch", value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2022-2026">2022–2026</SelectItem>
                            <SelectItem value="2023-2027">2023–2027</SelectItem>
                            <SelectItem value="2024-2028">2024–2028</SelectItem>
                            <SelectItem value="2025-2029">2025–2029</SelectItem>
                            <SelectItem value="2026-2030">2026–2030</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* HOD Name */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">HOD Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                          <Input
                            value={formData.hod_name}
                            onChange={(e) => handleInputChange("hod_name", e.target.value)}
                            disabled={!isEditing}
                            className="pl-10"
                            placeholder="e.g., Dr. Head of Dept"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Student Specific Fields */}
                  {role !== "lecturer" && (
                    <>
                      {/* Year */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Year</label>
                        <Select
                          value={formData.year}
                          onValueChange={(value) => handleInputChange("year", value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1st Year">1st Year</SelectItem>
                            <SelectItem value="2nd Year">2nd Year</SelectItem>
                            <SelectItem value="3rd Year">3rd Year</SelectItem>
                            <SelectItem value="4th Year">4th Year</SelectItem>
                            <SelectItem value="Graduate">Graduate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* GPA */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">GPA</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          value={formData.gpa}
                          onChange={(e) => handleInputChange("gpa", e.target.value)}
                          disabled={!isEditing}
                          placeholder="e.g., 3.75"
                        />
                      </div>

                      {/* Advisor */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Academic Advisor</label>
                        <Input
                          value={formData.advisor}
                          onChange={(e) => handleInputChange("advisor", e.target.value)}
                          disabled={!isEditing}
                          placeholder="e.g., Dr. Smith"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Only show Important Dates for Students */}
              {role !== "lecturer" && (
                <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-6">Important Dates</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Enrollment Date</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                        <Input
                          type="date"
                          value={formData.enrollment_date}
                          onChange={(e) => handleInputChange("enrollment_date", e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Expected Graduation</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                        <Input
                          type="date"
                          value={formData.expected_graduation}
                          onChange={(e) => handleInputChange("expected_graduation", e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* DEDICATED TAB: PIN & Screen Lock (Desktop & Mobile) */}
          {activeTab === "screen-lock" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <PinSecurityCard />
            </div>
          )}

          {/* DEDICATED TAB: Active Sessions & Devices */}
          {activeTab === "sessions" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <ActiveDevicesCard />
            </div>
          )}

          {/* LECTURER TAB: 2FA (Two-Factor Authentication) */}
          {isLecturer && activeTab === "2fa" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <MfaSecurityCard />
            </div>
          )}

          {/* LECTURER TAB: Passkeys & Biometrics */}
          {isLecturer && activeTab === "passkeys" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                        <Fingerprint className="size-5 text-blue-600 shrink-0" />
                        <span>Passkeys & Biometrics</span>
                      </h2>
                      <Badge variant="outline" className="text-[10px] font-bold text-blue-500 border-blue-500/30 py-0.5 px-2 uppercase tracking-wider shrink-0 whitespace-nowrap">
                        FIDO2
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sign in faster and more securely using Windows Hello, Touch ID, Face ID, or Google Password Manager.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenAddPasskey}
                    className="text-xs font-semibold gap-1.5 h-9 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto shrink-0 shadow-sm cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    Add Passkey
                  </Button>
                </div>

                {/* Passkeys List */}
                {isLoadingPasskeys ? (
                  <div className="space-y-2 py-2">
                    <div className="h-16 bg-muted/40 animate-pulse rounded-xl" />
                  </div>
                ) : passkeys.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-border/70 bg-muted/10 space-y-3">
                    <div className="mx-auto size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <Key className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-foreground">No Passkeys Registered</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Add a passkey to sign in instantly with biometrics or Google Password Manager without typing your password.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenAddPasskey}
                      className="text-xs font-semibold gap-1.5 h-8 mt-1"
                    >
                      <Fingerprint className="size-3.5 text-blue-600" />
                      Register This Device
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {passkeys.map((factor) => {
                      const nameLower = factor.friendly_name.toLowerCase();
                      const isGoogle = nameLower.includes("google") || nameLower.includes("password manager") || nameLower.includes("chrome");
                      const isApple = nameLower.includes("apple") || nameLower.includes("mac") || nameLower.includes("iphone") || nameLower.includes("ipad");
                      const isWindows = nameLower.includes("windows");
                      const isMobile = nameLower.includes("phone") || nameLower.includes("android");

                      const DeviceIcon = isWindows ? Laptop : isMobile ? Smartphone : isApple ? Fingerprint : Key;

                      return (
                        <div
                          key={factor.id}
                          className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-card border border-border/80 hover:border-blue-500/40 transition-all shadow-xs gap-3"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={cn(
                              "size-9 sm:size-10 rounded-xl flex items-center justify-center shrink-0",
                              isGoogle
                                ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
                                : "bg-blue-500/10 text-blue-600"
                            )}>
                              {isGoogle ? (
                                <svg className="size-4.5 sm:size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                  />
                                  <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                  />
                                  <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    fill="#FBBC05"
                                  />
                                  <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    fill="#EA4335"
                                  />
                                </svg>
                              ) : (
                                <DeviceIcon className="size-4.5 sm:size-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                                  {factor.friendly_name}
                                </p>
                                <Badge variant="outline" className="text-[9px] sm:text-[10px] font-semibold text-emerald-500 border-emerald-500/30 py-0 px-1.5 shrink-0 whitespace-nowrap">
                                  Active
                                </Badge>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                                Added on {new Date(factor.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingPasskey(factor)}
                            className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 sm:px-2.5 shrink-0 gap-1"
                            title="Remove passkey"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="hidden sm:inline">Remove</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LECTURER TAB: Account Password */}
          {isLecturer && activeTab === "password" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Change Password</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                        className="pl-10 pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.current ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                        className="pl-10 pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        className="pl-10 pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <Button onClick={handlePasswordChange} disabled={isSaving} className="mt-2">
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY SECTION (Screen Lock + 2FA + Passkeys + Password + Active Devices) */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Card 0: 4-Digit In-App PIN & Biometric Screen Lock */}
              <PinSecurityCard />

              {/* Card 0.5: Active Sessions & Device Manager */}
              <ActiveDevicesCard />

              {/* Card 1: Two-Factor Authentication (TOTP / Google Authenticator) */}
              <MfaSecurityCard />

              {/* Passkeys & Biometrics Card */}
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                        <Fingerprint className="size-5 text-blue-600 shrink-0" />
                        <span>Passkeys & Biometrics</span>
                      </h2>
                      <Badge variant="outline" className="text-[10px] font-bold text-blue-500 border-blue-500/30 py-0.5 px-2 uppercase tracking-wider shrink-0 whitespace-nowrap">
                        FIDO2
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sign in faster and more securely using Windows Hello, Touch ID, Face ID, or Google Password Manager.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenAddPasskey}
                    className="text-xs font-semibold gap-1.5 h-9 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto shrink-0 shadow-sm cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    Add Passkey
                  </Button>
                </div>

                {/* Passkeys List */}
                {isLoadingPasskeys ? (
                  <div className="space-y-2 py-2">
                    <div className="h-16 bg-muted/40 animate-pulse rounded-xl" />
                  </div>
                ) : passkeys.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-border/70 bg-muted/10 space-y-3">
                    <div className="mx-auto size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <Key className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-foreground">No Passkeys Registered</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Add a passkey to sign in instantly with biometrics or Google Password Manager without typing your password.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenAddPasskey}
                      className="text-xs font-semibold gap-1.5 h-8 mt-1"
                    >
                      <Fingerprint className="size-3.5 text-blue-600" />
                      Register This Device
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {passkeys.map((factor) => {
                      const nameLower = factor.friendly_name.toLowerCase();
                      const isGoogle = nameLower.includes("google") || nameLower.includes("password manager") || nameLower.includes("chrome");
                      const isApple = nameLower.includes("apple") || nameLower.includes("mac") || nameLower.includes("iphone") || nameLower.includes("ipad");
                      const isWindows = nameLower.includes("windows");
                      const isMobile = nameLower.includes("phone") || nameLower.includes("android");

                      const DeviceIcon = isWindows ? Laptop : isMobile ? Smartphone : isApple ? Fingerprint : Key;

                      return (
                        <div
                          key={factor.id}
                          className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-card border border-border/80 hover:border-blue-500/40 transition-all shadow-xs gap-3"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={cn(
                              "size-9 sm:size-10 rounded-xl flex items-center justify-center shrink-0",
                              isGoogle
                                ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
                                : "bg-blue-500/10 text-blue-600"
                            )}>
                              {isGoogle ? (
                                <svg className="size-4.5 sm:size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                  />
                                  <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                  />
                                  <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    fill="#FBBC05"
                                  />
                                  <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    fill="#EA4335"
                                  />
                                </svg>
                              ) : (
                                <DeviceIcon className="size-4.5 sm:size-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                                  {factor.friendly_name}
                                </p>
                                <Badge variant="outline" className="text-[9px] sm:text-[10px] font-semibold text-emerald-500 border-emerald-500/30 py-0 px-1.5 shrink-0 whitespace-nowrap">
                                  Active
                                </Badge>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                                Added on {new Date(factor.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingPasskey(factor)}
                            className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 sm:px-2.5 shrink-0 gap-1"
                            title="Remove passkey"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="hidden sm:inline">Remove</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Change Password Card */}
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Change Password</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                        className="pl-10 pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.current ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                        className="pl-10 pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        className="pl-10 pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <Button onClick={handlePasswordChange} disabled={isSaving} className="mt-2">
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeTab === "notifications" && (
            <ProfileNotificationSettings />
          )}

          {/* Preferences Section */}
          {activeTab === "preferences" && (
            <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">{t("profile.preferences", "App Preferences")}</h2>

              <div className="space-y-6">
                {/* Interface Language */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Globe className="size-4 text-sky-500" />
                    {t("profile.language", "Language")}
                  </label>
                  <LanguageSelector className="w-full sm:w-64" />
                  <p className="text-xs text-muted-foreground">
                    {t("settings.interfaceLanguageDescription", "Choose between English, తెలుగు (Telugu), and हिन्दी (Hindi).")}
                  </p>

                </div>

                {/* Theme */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Palette className="size-4" />
                    {t("profile.theme", "Theme")}
                  </label>
                  <ThemeSelector />
                  <p className="text-xs text-muted-foreground">
                    {t("profile.themeDescription", "Choose your preferred theme. System will follow your device settings.")}
                  </p>
                </div>

                {/* Hide Dashboard Header */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      {t("settings.hideDashboardHeader", "Hide Dashboard Header")}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.hideDashboardHeaderDescription", "Remove the top navigation bar from your dashboard interface.")}
                    </p>
                  </div>
                  <Switch
                    checked={globalHideDashboardHeader}
                    onCheckedChange={(checked) => setGlobalHideDashboardHeader(checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons (hidden for Notifications tab) */}
          {(activeTab === "personal" || activeTab === "academic" || activeTab === "social" || activeTab === "preferences") && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Public Profile Modal */}
      <Dialog open={showPublicProfile} onOpenChange={setShowPublicProfile}>
        <DialogContent className="max-w-md sm:max-w-[460px] p-4 sm:p-5 overflow-hidden">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle>Public Profile View</DialogTitle>
            <DialogDescription className="sr-only">
              Preview of your public academic profile.
            </DialogDescription>
          </DialogHeader>

          {/* Academic Profile Preview */}
          <div className="bg-slate-50 dark:bg-[#050b14] text-slate-900 dark:text-white rounded-xl overflow-y-auto max-h-[80vh] shadow-2xl font-sans selection:bg-blue-500/30 transition-colors duration-300">

            {/* Top Header */}
            <div className="pt-8 pb-4 text-center">
              <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase">Academic Profile</h2>
            </div>

            <div className="max-w-md mx-auto px-6 pb-12 relative z-10">
              <div className="flex flex-col items-center text-center mt-4">
                {/* Avatar with Glow */}
                <div className="relative mb-6 group">
                  <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full opacity-75 blur"></div>
                  <div className="relative">
                    <Avatar className="size-24 border-4 border-white dark:border-[#050b14] shadow-2xl">
                      <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-2xl font-bold text-blue-500">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {profile?.verified && (
                      <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-4 border-white dark:border-[#050b14]">
                        <CheckCircle className="size-3" fill="currentColor" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & 6 Profile Icons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mb-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {formData.full_name || "User Name"}
                  </h1>
                  {isStudent && (
                    <div className="flex items-center gap-1 shrink-0">
                      <TooltipProvider delayDuration={100}>
                        {getHeaderProfileIcons(formData, true).map((platform) => {
                          const isFilled = Boolean(platform.url);
                          return (
                            <Tooltip key={platform.id}>
                              <TooltipTrigger asChild>
                                <a
                                  href={platform.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "size-6 rounded-full flex items-center justify-center border transition-all duration-300 hover:scale-110 backdrop-blur-md p-1",
                                    platform.bg,
                                    platform.border,
                                    platform.text,
                                    platform.shadow
                                  )}
                                >
                                  <RealBrandIcon id={platform.id} label={platform.label} fallback={platform.icon} className="size-3 object-contain" />
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
                <div className="flex flex-wrap justify-center gap-2 mb-6 items-center">
                  <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    Academic Portal
                  </Badge>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    {role === "lecturer" ? "Lecturer" : "Student"}
                  </Badge>
                  {profile?.verified && (
                    <Badge className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      Verified Identity
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 ml-1"
                    onClick={() => {
                      const url = `${window.location.origin}/p/${user?.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Public profile link copied!");
                    }}
                    title="Share Profile"
                  >
                    <Share2 className="size-3.5" />
                  </Button>
                </div>

                {/* Info Row */}
                <div className="flex flex-col items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-blue-500" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-blue-500" />
                    <span>Updated {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Personal Statement */}
                {formData.bio && (
                  <div className="w-full text-left mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1 w-6 bg-blue-600 rounded-full"></div>
                      <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-500 uppercase">Personal Statement</h3>
                    </div>
                    <p className="text-base text-slate-600 dark:text-slate-200 italic font-medium leading-relaxed">
                      "{formData.bio}"
                    </p>
                  </div>
                )}
                {/* Connectivity */}
                <div className="w-full text-left mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase">Connectivity</h3>
                  </div>

                  <div
                    className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-blue-500/20 transition-all cursor-pointer shadow-sm dark:shadow-none mb-3"
                    onClick={() => {
                      const url = `${window.location.origin}/p/${user?.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Profile link copied!");
                    }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Globe className="size-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate tracking-tight">
                        eduspaceacademy.online/p/{formData.full_name?.toLowerCase().replace(/\s+/g, '')}
                      </span>
                    </div>
                    <Copy className="size-3.5 text-slate-500" />
                  </div>

                  {formData.portfolio_url && (
                    <a
                      href={formData.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-blue-500/20 transition-all cursor-pointer shadow-sm dark:shadow-none mb-3"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <LinkIcon className="size-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate tracking-tight">
                          {formData.portfolio_url.replace(/^https?:\/\/(www\.)?/, '')}
                        </span>
                      </div>
                      <ExternalLink className="size-3.5 text-slate-500" />
                    </a>
                  )}

                  {/* Social Presence Links */}
                  {isStudent && (formData.linkedin_url || formData.github_url || formData.leetcode_url || formData.codeforces_url || formData.hackerrank_url || formData.codechef_url || formData.chess_url || formData.codolio_url || formData.twitter_url) && (
                    <div className="flex flex-wrap gap-2">
                      {formData.linkedin_url && (
                        <a
                          href={formData.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                        >
                          <RealBrandIcon id="linkedin" label="LinkedIn" fallback={Linkedin} className="size-3.5 object-contain group-hover/social:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">LinkedIn</span>
                        </a>
                      )}
                      {formData.github_url && (
                        <a
                          href={formData.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                        >
                          <RealBrandIcon id="github" label="GitHub" fallback={Github} className="size-3.5 object-contain group-hover/social:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">GitHub</span>
                        </a>
                      )}
                      {formData.leetcode_url && (
                        <a
                          href={formData.leetcode_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                        >
                          <RealBrandIcon id="leetcode" label="LeetCode" fallback={LeetCodeIcon} className="size-3.5 object-contain group-hover/social:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">LeetCode</span>
                        </a>
                      )}
                      {formData.codeforces_url && (
                        <a
                          href={formData.codeforces_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                        >
                          <RealBrandIcon id="codeforces" label="Codeforces" fallback={CodeforcesIcon} className="size-3.5 object-contain group-hover/social:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Codeforces</span>
                        </a>
                      )}
                      {formData.hackerrank_url && (
                        <a
                          href={formData.hackerrank_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                        >
                          <RealBrandIcon id="hackerrank" label="HackerRank" fallback={HackerRankIcon} className="size-3.5 object-contain group-hover/social:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">HackerRank</span>
                        </a>
                      )}
                      {formData.codechef_url && (
                        <a
                          href={formData.codechef_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                        >
                          <RealBrandIcon id="codechef" label="CodeChef" fallback={CodeChefIcon} className="size-3.5 object-contain group-hover/social:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">CodeChef</span>
                        </a>
                      )}
                      {formData.chess_url && (
                        <a
                          href={formData.chess_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                        >
                          <RealBrandIcon id="chess" label="Chess.com" fallback={ChessIcon} className="size-3.5 object-contain group-hover/social:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Chess.com</span>
                        </a>
                      )}
                      {formData.codolio_url && (
                        <a
                          href={formData.codolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                        >
                          <RealBrandIcon id="codolio" label="Codolio" fallback={CodolioIcon} className="size-3.5 object-contain group-hover/social:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Codolio</span>
                        </a>
                      )}
                      {formData.twitter_url && (
                        <a
                          href={formData.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all shadow-sm group/social"
                        >
                          <RealBrandIcon id="twitter" label="Twitter / X" fallback={Twitter} className="size-3.5 object-contain group-hover/social:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">X</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>



                <div className="mt-6 w-full pb-2 flex justify-center">
                  <Button
                    className="w-full max-w-sm bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-full py-6 shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] border border-white/10"
                    onClick={() => {
                      toast.info("This is a preview. Download functionality is available on the public profile page.");
                    }}
                  >
                    <Download className="size-4 mr-2" />
                    <span className="font-bold tracking-wide text-xs uppercase">Download Official PDF</span>
                  </Button>
                </div>

                {/* Visit Public Profile Link */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setShowPublicProfile(false);
                      setTimeout(() => {
                        navigate(`/p/${user?.id}`);
                      }, 100);
                    }}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors underline-offset-2 hover:underline"
                  >
                    Visit Public Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

        </DialogContent>
      </Dialog>


      {/* Mobile Bottom Navigation for Profile Tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border xl:hidden pb-safe">
        <nav className="flex items-center justify-around h-16 px-2 overflow-x-auto no-scrollbar">
          {primaryMobileTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full text-[10px] font-medium transition-colors my-1",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all",
                  activeTab === tab.id && "bg-primary/10"
                )}
              >
                <tab.icon
                  className={cn("size-5 transition-all", activeTab === tab.id ? "text-primary" : "text-muted-foreground")}
                  strokeWidth={activeTab === tab.id ? 2.5 : 2}
                />
              </div>
              <span className={cn("hidden xs:block scale-0 transition-all duration-200", activeTab === tab.id && "scale-100")}>
                {tab.label.split(" ")[0]}
              </span>
            </button>
          ))}

          {/* More (Three-dot) Button */}
          {secondaryMobileTabs.length > 0 && (
            <button
              onClick={() => setShowMoreMobileSheet(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full text-[10px] font-medium transition-colors my-1",
                isMoreMobileActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="More options"
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isMoreMobileActive && "bg-primary/10"
                )}
              >
                <MoreVertical
                  className={cn("size-5 transition-all", isMoreMobileActive ? "text-primary" : "text-muted-foreground")}
                  strokeWidth={isMoreMobileActive ? 2.5 : 2}
                />
              </div>
              <span className={cn("hidden xs:block scale-0 transition-all duration-200", isMoreMobileActive && "scale-100")}>
                More
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* Mobile More Options Bottom Sheet */}
      <ProfileMobileMoreSheet
        open={showMoreMobileSheet}
        onOpenChange={setShowMoreMobileSheet}
        tabs={secondaryMobileTabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Add Passkey Modal Dialog */}
      <Dialog open={isAddPasskeyOpen} onOpenChange={setIsAddPasskeyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Fingerprint className="size-5 text-blue-600" />
              Register New Passkey
            </DialogTitle>
            <DialogDescription className="text-xs">
              Give this device or key a name, then complete the biometric verification prompt.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterPasskey} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="passkey-label" className="text-xs font-semibold text-foreground">
                Device Label
              </label>
              <Input
                id="passkey-label"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                placeholder="e.g. My Phone / Windows Hello"
                className="h-10 text-sm"
                disabled={isRegisteringPasskey}
                autoFocus
                required
              />
              <p className="text-[11px] text-muted-foreground">
                This helps you recognize this authenticator in your account security settings.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-muted-foreground flex items-start gap-2.5">
              <Sparkles className="size-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                When you click Continue, your device will prompt you with Windows Hello, Touch ID, Face ID, or Google Password Manager.
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddPasskeyOpen(false)}
                disabled={isRegisteringPasskey}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isRegisteringPasskey || !passkeyName.trim()}
                className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isRegisteringPasskey ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Fingerprint className="size-3.5" />
                    Continue to Verify
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Passkey Confirmation Dialog */}
      <AlertDialog open={Boolean(deletingPasskey)} onOpenChange={(open) => !open && setDeletingPasskey(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              Remove Passkey?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Are you sure you want to remove <strong>"{deletingPasskey?.friendly_name}"</strong>? You will no longer be able to sign in using this biometric device until you re-register it.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
            <AlertDialogCancel
              disabled={isDeletingPasskey}
              onClick={() => setDeletingPasskey(null)}
              className="text-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDeletePasskey();
              }}
              disabled={isDeletingPasskey}
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingPasskey ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                  Removing...
                </>
              ) : (
                "Remove Passkey"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
