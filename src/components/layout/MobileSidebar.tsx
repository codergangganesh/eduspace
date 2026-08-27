import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  LogOut,
  Settings,
  User,
  X,
  Users,
  Table,
  ClipboardList,
  FileCheck,
  Bot,
  Brain,
  Flame,
  Megaphone,
  Sparkles,
  Mic,
  ChevronDown,
  Shield,
  Gamepad2,
  Trophy,
  Globe,
  Check,
} from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { readCachedProfileIdentity } from "@/lib/imagePerformance";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const studentNavItems = [
  { id: "tour-nav-dashboard", icon: LayoutDashboard, imageUrl: "/dashboard-icon.png", label: "Dashboard", path: "/dashboard" },
  { id: "tour-nav-feed", icon: Megaphone, imageUrl: "/feed-icon.png", label: "Class Feed", path: "/class-feed" },
  { id: "tour-nav-contests", icon: Trophy, imageUrl: "/contest.png", label: "Coding Contests", path: "/contests" },
  { id: "tour-nav-schedule", icon: Calendar, imageUrl: "/schedule-icon.png", label: "Schedule", path: "/schedule" },
  { id: "tour-nav-assignments", icon: ClipboardList, imageUrl: "/assignment-icon.png", label: "Assignments", path: "/student/assignments" },
  { id: "tour-nav-quizzes", icon: FileCheck, imageUrl: "/quiz-icon.png", label: "Quizzes", path: "/student/quizzes" },
  { id: "tour-nav-ai", icon: Bot, imageUrl: "/ai-icon.png", label: "Eduspace AI", path: "/ai-chat" },
  { id: "tour-nav-voice", icon: Mic, imageUrl: "/ai-tutor.png", label: "AI Voice Tutor", path: "/student/voice-tutor" },
  { id: "tour-nav-streak", icon: Flame, imageUrl: "/streak-icon.png", label: "Academic Streak", path: "/streak" },
  { id: "tour-nav-puzzle", icon: Gamepad2, imageUrl: "/puzzle-icon.png", label: "Maths Playground", path: "/student/puzzle" },
  { id: "tour-nav-attendance", icon: ClipboardList, imageUrl: "/attendance-icon.png", label: "Attendance", path: "/student/attendance" },
  { id: "tour-nav-messages", icon: MessageSquare, imageUrl: "/messages-icon.png", label: "Messages", path: "/messages" },
];

const lecturerNavItems = [
  { id: "tour-nav-dashboard", icon: LayoutDashboard, imageUrl: "/dashboard-icon.png", label: "Dashboard", path: "/lecturer-dashboard" },
  { id: "tour-nav-feed", icon: Megaphone, imageUrl: "/feed-icon.png", label: "Class Feed", path: "/class-feed" },

  { id: "tour-nav-students", icon: Users, imageUrl: "/students-icon.png", label: "All Students", path: "/all-students" },
  { id: "tour-nav-timetable", icon: Table, imageUrl: "/timetable-icon.png", label: "Time Table", path: "/lecturer/timetable" },
  { id: "tour-nav-schedule", icon: Calendar, imageUrl: "/schedule-icon.png", label: "Schedule", path: "/schedule" },
  { id: "tour-nav-assignments", icon: ClipboardList, imageUrl: "/assignment-icon.png", label: "Assignments", path: "/lecturer/assignments" },
  { id: "tour-nav-quizzes", icon: FileCheck, imageUrl: "/quiz-icon.png", label: "Quizzes", path: "/lecturer/quizzes" },
  { id: "tour-nav-ai", icon: Bot, imageUrl: "/ai-icon.png", label: "Eduspace AI", path: "/ai-chat" },
  { id: "tour-nav-ai-gen", icon: Brain, imageUrl: "/ai-quiz-gen-icon.png", label: "AI Quiz Generator", path: "/lecturer/create-ai-quiz" },
  { id: "tour-nav-attendance", icon: ClipboardList, imageUrl: "/attendance-icon.png", label: "Attendance", path: "/lecturer/attendance" },
  { id: "tour-nav-messages", icon: MessageSquare, imageUrl: "/messages-icon.png", label: "Messages", path: "/messages" },
];

type NavItem = {
  id: string;
  icon: typeof LayoutDashboard;
  imageUrl?: string;
  label: string;
  path: string;
};

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { role, signOut, profile, user } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { isMobileSidebarCollapsed, tourActiveStepId } = useLayout();
  const [isMobileLangExpanded, setIsMobileLangExpanded] = useState(false);

  const cachedIdentity = useMemo(() => readCachedProfileIdentity(user?.id), [user?.id]);
  const displayName = profile?.full_name || cachedIdentity?.fullName || "User";
  const displayEmail = profile?.email || cachedIdentity?.email || "No email provided";
  const displayAvatar = profile?.avatar_url || cachedIdentity?.avatarUrl || "";
  const displayInitials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase() || "U";

  const navItems: NavItem[] = role === "lecturer" ? lecturerNavItems : studentNavItems;
  const roleLabel = role === "lecturer" ? t("lecturer.lecturer", "Lecturer") : role === "admin" ? t("admin.admin", "Admin") : t("common.student", "Student");

  const languages = [
    { code: "en", label: "English" },
    { code: "te", label: "తెలుగు (Telugu)" },
    { code: "hi", label: "हिन्दी (Hindi)" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
  ];

  const getNavLabel = (label: string) => {
    switch (label) {
      case "Dashboard": return t("common.dashboard", "Dashboard");
      case "Class Feed": return t("common.classFeed", "Class Feed");
      case "Assignments": return t("common.assignments", "Assignments");
      case "Quizzes": return t("common.quizzes", "Quizzes");
      case "Attendance": return t("common.attendance", "Attendance");
      case "Schedule": return t("common.schedule", "Schedule");
      case "Messages": return t("common.messages", "Messages");
      case "Coding Contests": return t("common.contests", "Coding Contests");
      case "Opportunities": return t("common.opportunities", "Opportunities");
      case "Knowledge Map": return t("common.knowledgeMap", "Knowledge Map");
      case "Eduspace AI": return t("common.aiAgent", "Eduspace AI");
      case "AI Voice Tutor": return t("common.voiceTutor", "AI Voice Tutor");
      case "Academic Streak": return t("common.streak", "Academic Streak");
      case "Maths Playground": return t("common.mathsPuzzle", "Maths Playground");
      case "Profile": return t("common.profile", "Profile");
      case "Settings": return t("common.settings", "Settings");
      case "All Students": return t("lecturer.students", "All Students");
      case "Time Table": return t("lecturer.timetable", "Time Table");
      case "AI Quiz Generator": return t("lecturer.createAIQuiz", "AI Quiz Generator");
      default: return label;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Hidden during tour to avoid double-darkening and spotlight interference */}
          {!document.body.getAttribute('data-tour-active') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] lg:hidden"
              onClick={onClose}
            />
          )}

          {/* Sidebar */}
          <motion.aside
            initial={document.body.getAttribute('data-tour-active') ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className={cn(
              "fixed left-0 top-0 bottom-0 bg-surface border-r border-border lg:hidden transition-[width] duration-300 pt-[var(--safe-top)] pb-[var(--safe-bottom)] flex flex-col",
              isMobileSidebarCollapsed ? "w-20" : "w-72",
              document.body.getAttribute('data-tour-active') ? "z-[9999]" : "z-[70]"
            )}
          >
            <div className="flex flex-col h-full p-4">
              {/* Header */}
              <div className={cn(
                "flex items-center mb-8 px-3",
                isMobileSidebarCollapsed ? "justify-center" : "justify-between"
              )}>
                <Link to={role === "lecturer" ? "/lecturer-dashboard" : "/dashboard"} className="flex items-center gap-3" onClick={onClose}>
                  <div className="size-8 rounded-lg overflow-hidden border border-border shrink-0">
                    <img
                      src="/favicon.png"
                      alt="Eduspace Logo"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="size-full object-cover"
                    />
                  </div>
                  {!isMobileSidebarCollapsed && <span className="text-xl font-bold tracking-tight text-foreground">{t("common.appName", "Eduspace")}</span>}
                </Link>
                {!isMobileSidebarCollapsed && (
                  <button
                    onClick={onClose}
                    className="size-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>

              {/* Navigation */}
              <nav className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {navItems.map((item) => {
                  let isActive = false;

                  if (item.path.includes('?')) {
                    isActive = (location.pathname + location.search) === item.path;
                  } else {
                    isActive = location.pathname === item.path;
                    if (item.path === '/lecturer/quizzes' && location.search.includes('mode=create-ai')) {
                      isActive = false;
                    }
                  }

                  if (tourActiveStepId && item.id === tourActiveStepId && document.body.getAttribute('data-tour-active') === 'true') {
                    isActive = true;
                  }

                  const translatedLabel = getNavLabel(item.label);

                  return (
                    <Link
                      key={item.path + item.label}
                      id={item.id}
                      to={item.path}
                      onClick={() => {
                        if (!tourActiveStepId) {
                          onClose();
                        }
                      }}
                      className={cn(
                        "flex items-center rounded-lg text-sm font-medium transition-all active:scale-[0.98] active:opacity-80",
                        isMobileSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      {item.imageUrl ? (
                        <div
                          className={cn("size-6 shrink-0 rounded-full overflow-hidden transition-transform duration-200", !isActive && "group-hover:scale-110")}
                          style={{ clipPath: 'circle(50%)', boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}
                        >
                          <img
                            src={item.imageUrl}
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                            className="size-full object-cover"
                            alt={translatedLabel}
                          />
                        </div>
                      ) : (
                        <item.icon className="size-5 shrink-0" />
                      )}
                      {!isMobileSidebarCollapsed && <span>{translatedLabel}</span>}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer Section with Profile Actions */}
              <div className="mt-auto pt-6 border-t border-border">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex w-full items-center mt-2 rounded-2xl border border-border/50 bg-secondary/30 p-2 text-left transition-all outline-none hover:bg-secondary/60",
                        isMobileSidebarCollapsed ? "justify-center" : "gap-3"
                      )}
                    >
                      <Avatar className="size-10 border border-border/50 shadow-sm">
                        <AvatarImage src={displayAvatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {displayInitials}
                        </AvatarFallback>
                      </Avatar>

                      {!isMobileSidebarCollapsed && (
                        <>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-black text-foreground">
                              {displayName}
                            </span>
                            <span className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {roleLabel}
                            </span>
                          </div>
                          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                        </>
                      )}
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    side="top"
                    align={isMobileSidebarCollapsed ? "start" : "end"}
                    sideOffset={12}
                    className="z-[10001] w-64 rounded-2xl border-border/50 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl"
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1 py-1">
                        <p className="text-sm font-semibold leading-none tracking-tight">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground font-medium opacity-80">{displayEmail}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" onClick={onClose} className="flex cursor-pointer items-center gap-2 rounded-lg py-2.5">
                        <User className="size-4" />
                        <span className="font-semibold">{t("common.profile", "Profile")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" onClick={onClose} className="flex cursor-pointer items-center gap-2 rounded-lg py-2.5">
                        <Settings className="size-4" />
                        <span className="font-semibold">{t("common.settings", "Settings")}</span>
                      </Link>
                    </DropdownMenuItem>

                    {/* Language Selector Submenu */}
                    <DropdownMenuItem
                      className="flex items-center justify-between cursor-pointer py-2 rounded-lg"
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsMobileLangExpanded(!isMobileLangExpanded);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="size-4 text-sky-500" />
                        <span className="font-semibold">{t("common.selectLanguage", "Language")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                          {languages.find((l) => l.code === (language || "en"))?.label.split(" ")[0] || "English"}
                        </span>
                        <ChevronDown className={cn("size-3 text-muted-foreground transition-transform duration-200", isMobileLangExpanded && "rotate-180")} />
                      </div>
                    </DropdownMenuItem>

                    {isMobileLangExpanded && (
                      <div className="my-1 p-1 bg-muted/40 rounded-xl border border-border/40 space-y-0.5 animate-in fade-in-0 zoom-in-95 duration-150 max-h-48 overflow-y-auto">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              changeLanguage(lang.code);
                              toast.success(`Language changed to ${lang.label}`);
                              setIsMobileLangExpanded(false);
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
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex cursor-pointer items-center gap-2 rounded-lg py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <LogOut className="size-4" />
                      <span className="font-black uppercase tracking-wider text-[11px]">{t("common.logout", "Sign Out")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
