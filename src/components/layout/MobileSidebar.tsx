import { Link, useLocation } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  X,
  Users,
  Sparkles,
  Table,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const studentNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Schedule", path: "/schedule" },
  { icon: FileText, label: "Assignments", path: "/student/assignments" },
  { icon: FileText, label: "Quizzes", path: "/student/quizzes" },
  { icon: Sparkles, label: "AI Chat", path: "/ai-chat" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
];

const lecturerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/lecturer-dashboard" },
  { icon: Users, label: "All Students", path: "/all-students" },
  { icon: Table, label: "Time Table", path: "/lecturer/timetable" },
  { icon: Calendar, label: "Schedule", path: "/schedule" },
  { icon: FileText, label: "Assignments", path: "/lecturer/assignments" },
  { icon: FileText, label: "Quizzes", path: "/lecturer/quizzes" },
  { icon: Sparkles, label: "AI Chat", path: "/ai-chat" },
  { icon: Sparkles, label: "AI Quiz Generator", path: "/lecturer/quizzes?mode=create-ai" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
];


interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const location = useLocation();
  const { role, signOut } = useAuth();

  const navItems = role === "lecturer" ? lecturerNavItems : studentNavItems;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-surface border-r border-border z-50 lg:hidden animate-slide-in-right">
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between px-3 mb-8">
            <Link to={role === "lecturer" ? "/lecturer-dashboard" : "/dashboard"} className="flex items-center gap-3" onClick={onClose}>
              <div className="size-8 rounded-lg overflow-hidden border border-border">
                <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
              </div>
              <span className="text-xl font-bold tracking-tight">Eduspace</span>
            </Link>
            <button
              onClick={onClose}
              className="size-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => {
              let isActive = false;

              if (item.path.includes('?')) {
                // For items with query params (like AI Quiz), require exact match including search
                isActive = (location.pathname + location.search) === item.path;
              } else {
                // For standard items, match pathname but exclude if we're in a specific mode that has its own item
                isActive = location.pathname === item.path;
                if (item.path === '/lecturer/quizzes' && location.search.includes('mode=create-ai')) {
                  isActive = false;
                }
              }

              return (
                <Link
                  key={item.path + item.label}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sign Out */}
          {/* Sign Out */}
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
          >
            <LogOut className="size-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
