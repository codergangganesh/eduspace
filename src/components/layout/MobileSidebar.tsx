import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  LogOut,
  X,
  Users,
  Table,
  ClipboardList,
  FileCheck,
  Bot,
  Brain,
  Orbit,
  Flame,
  Megaphone,
  Sparkles,
  Mic,
} from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

const studentNavItems = [
  { id: "tour-nav-dashboard", icon: LayoutDashboard, imageUrl: "/dashboard-icon.png", label: "Dashboard", path: "/dashboard" },
  { id: "tour-nav-feed", icon: Megaphone, imageUrl: "/feed-icon.png", label: "Class Feed", path: "/class-feed" },
  { id: "tour-nav-schedule", icon: Calendar, imageUrl: "/schedule-icon.png", label: "Schedule", path: "/schedule" },
  { id: "tour-nav-assignments", icon: ClipboardList, imageUrl: "/assignment-icon.png", label: "Assignments", path: "/student/assignments" },
  { id: "tour-nav-quizzes", icon: FileCheck, imageUrl: "/quiz-icon.png", label: "Quizzes", path: "/student/quizzes" },
  { id: "tour-nav-matrix", icon: Orbit, imageUrl: "/edumatrix-icon.png", label: "EduMatrix", path: "/student/knowledge-map" },
  { id: "tour-nav-ai", icon: Bot, imageUrl: "/ai-icon.png", label: "Eduspace AI", path: "/ai-chat" },
  { id: "tour-nav-voice", icon: Mic, imageUrl: "/ai-tutor.png", label: "AI Voice Tutor", path: "/student/voice-tutor" },
  { id: "tour-nav-streak", icon: Flame, imageUrl: "/streak-icon.png", label: "Academic Streak", path: "/streak" },
  { id: "tour-nav-messages", icon: MessageSquare, imageUrl: "/messages-icon.png", label: "Messages", path: "/messages" },
  { id: "tour-nav-attendance", icon: ClipboardList, imageUrl: "/attendance-icon.png", label: "Attendance", path: "/student/attendance" },
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
  { id: "tour-nav-messages", icon: MessageSquare, imageUrl: "/messages-icon.png", label: "Messages", path: "/messages" },
  { id: "tour-nav-attendance", icon: ClipboardList, imageUrl: "/attendance-icon.png", label: "Attendance", path: "/lecturer/attendance" },
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
  const location = useLocation();
  const { role, signOut, profile } = useAuth();
  const { isMobileSidebarCollapsed, tourActiveStepId } = useLayout();

  const navItems: NavItem[] = role === "lecturer" ? lecturerNavItems : studentNavItems;

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
                    <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                  </div>
                  {!isMobileSidebarCollapsed && <span className="text-xl font-bold tracking-tight text-foreground">Eduspace</span>}
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
                        <img
                          src={item.imageUrl}
                          className={cn("size-6 shrink-0 rounded-full object-cover", !isActive && "group-hover:scale-110")}
                          alt={item.label}
                        />
                      ) : (
                        <item.icon className="size-5 shrink-0" />
                      )}
                      {!isMobileSidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer Section with Integrated Sign Out */}
              <div className="mt-auto pt-6 border-t border-border">
                <div className={cn(
                  "flex items-center mt-2 bg-secondary/30 rounded-2xl border border-border/50 p-2",
                  isMobileSidebarCollapsed ? "justify-center" : "gap-3"
                )}>
                  <Avatar className={cn("border border-border/50 shadow-sm", isMobileSidebarCollapsed ? "size-10" : "size-10")}>
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {!isMobileSidebarCollapsed && (
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-black text-foreground truncate">
                        {profile?.full_name || 'User'}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                        {role}
                      </span>
                    </div>
                  )}

                  {!isMobileSidebarCollapsed && (
                    <button
                      onClick={() => {
                        signOut();
                        onClose();
                      }}
                      className="size-8 rounded-lg bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center"
                      title="Sign Out"
                    >
                      <LogOut className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
