import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePinLock } from "@/hooks/usePinLock";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Mail,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  MessageSquare,
  Globe,
  Check,
  Lock,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { readCachedProfileIdentity } from "@/lib/imagePerformance";
import { toast } from "sonner";

export function UserDropdown() {
  const { t } = useTranslation();
  const { profile, role, signOut, user } = useAuth();
  const { isPinLockEnabled, lockScreen } = usePinLock();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [isLangExpanded, setIsLangExpanded] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const cachedIdentity = useMemo(() => readCachedProfileIdentity(user?.id), [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.full_name || cachedIdentity?.fullName || "User";
  const displayEmail = profile?.email || cachedIdentity?.email || "No email";
  const displayAvatar = profile?.avatar_url || cachedIdentity?.avatarUrl || "";
  const initials =
    displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";
  const displayRole = role === "lecturer" ? "Lecturer" : role === "admin" ? "Admin" : "Student";

  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी (Hindi)" },
    { code: "te", label: "తెలుగు (Telugu)" },
    { code: "es", label: "Español (Spanish)" },
    { code: "fr", label: "Français (French)" },
    { code: "de", label: "Deutsch (German)" },
    { code: "zh", label: "中文 (Chinese)" },
    { code: "ja", label: "日本語 (Japanese)" },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center size-9 rounded-full border border-transparent hover:bg-muted/30 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-primary/20">
          <Avatar className="size-9 shadow-sm">
            <AvatarImage src={displayAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-2xl border-border/50 shadow-2xl backdrop-blur-xl bg-popover/95">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2 py-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold leading-none tracking-tight">{displayName}</p>
              <div
                className={cn(
                  "flex items-center gap-0.5 px-1 py-0 rounded-full text-[7px] font-bold uppercase tracking-widest border shadow-sm shrink-0",
                  role === "lecturer"
                    ? "bg-indigo-500/10 text-indigo-600 border-indigo-200/50 dark:bg-indigo-400/10 dark:text-indigo-400 dark:border-indigo-400/20"
                    : role === "admin"
                    ? "bg-amber-500/10 text-amber-600 border-amber-200/50 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-200/50 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20"
                )}
              >
                {role === "lecturer" ? (
                  <UserCheck className="size-2" />
                ) : role === "admin" ? (
                  <ShieldCheck className="size-2" />
                ) : (
                  <GraduationCap className="size-2" />
                )}
                {displayRole}
              </div>
            </div>
            <p className="text-xs leading-none text-muted-foreground font-medium opacity-80">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="size-4" />
            {t("common.profile", "Profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="size-4" />
            {t("common.settings", "Settings")}
          </Link>
        </DropdownMenuItem>

        {isPinLockEnabled && (
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              lockScreen();
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-amber-500" />
              <span>{t("common.lockScreen", "Lock Screen")}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
              Alt+L
            </span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="flex items-center justify-between cursor-pointer"
          onSelect={(e) => {
            e.preventDefault();
            setIsLangExpanded(!isLangExpanded);
          }}
        >
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-sky-500" />
            <span>{t("common.selectLanguage", "Language")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
              {languages.find((l) => l.code === (language || "en"))?.label.split(" ")[0] || "English"}
            </span>
            <ChevronDown
              className={cn(
                "size-3 text-muted-foreground transition-transform duration-200",
                isLangExpanded && "rotate-180"
              )}
            />
          </div>
        </DropdownMenuItem>

        {isLangExpanded && (
          <div className="my-1 p-1 bg-muted/40 rounded-xl border border-border/40 space-y-0.5 animate-in fade-in-0 zoom-in-95 duration-150 max-h-48 overflow-y-auto">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  changeLanguage(lang.code);
                  toast.success(`Language changed to ${lang.label}`);
                  setOpen(false);
                  setIsLangExpanded(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all font-medium text-left",
                  language === lang.code
                    ? "bg-primary/15 text-primary font-bold shadow-xs"
                    : "hover:bg-muted text-foreground/80 hover:text-foreground"
                )}
              >
                <span>{lang.label}</span>
                {language === lang.code && <Check className="size-3.5 text-primary stroke-[3]" />}
              </button>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />

        {/* Mobile-only Theme Toggle */}
        <div className="sm:hidden">
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5 flex items-center gap-2">
            {t("profile.theme", "Appearance")}
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              theme === "light" && "bg-primary/5 text-primary"
            )}
          >
            <Sun className="size-4" />
            {t("profile.themeLight", "Light")}
            {theme === "light" && <div className="ml-auto size-1.5 rounded-full bg-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              theme === "dark" && "bg-primary/5 text-primary"
            )}
          >
            <Moon className="size-4" />
            {t("profile.themeDark", "Dark")}
            {theme === "dark" && <div className="ml-auto size-1.5 rounded-full bg-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              theme === "system" && "bg-primary/5 text-primary"
            )}
          >
            <Monitor className="size-4" />
            {t("profile.themeSystem", "System")}
            {theme === "system" && <div className="ml-auto size-1.5 rounded-full bg-primary" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </div>

        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer lg:hidden"
          onClick={() => window.dispatchEvent(new CustomEvent("open-feedback"))}
        >
          <MessageSquare className="size-4" />
          {t("common.feedback", "Give Feedback")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer"
          onSelect={() => {
            setOpen(false);
            window.dispatchEvent(new CustomEvent("open-contact-support"));
          }}
        >
          <Mail className="size-4" />
          {t("common.help", "Support")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="size-4" />
          {t("common.logout", "Sign Out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
