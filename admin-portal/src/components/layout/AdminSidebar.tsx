import React, { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FolderKanban,
  ClipboardList,
  FileCheck,
  Activity,
  MessageSquare,
  Megaphone,
  History,
  Settings,
  User,
  Shield,
  ShieldCheck,
  Server,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { cn, getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "System Health", path: "/system-overview", icon: Server },
    ],
  },
  {
    title: "User Management",
    items: [
      { label: "Students", path: "/students", icon: Users },
      { label: "Lecturers", path: "/lecturers", icon: GraduationCap },
    ],
  },
  {
    title: "Academic Resources",
    items: [
      { label: "Courses", path: "/courses", icon: BookOpen },
      { label: "Classes", path: "/classes", icon: FolderKanban },
      { label: "Assignments", path: "/assignments", icon: ClipboardList },
      { label: "Quizzes", path: "/quizzes", icon: FileCheck },
    ],
  },
  {
    title: "Platform & Governance",
    items: [
      { label: "Live Activity", path: "/activity", icon: Activity },
      { label: "Messages", path: "/messages", icon: MessageSquare },
      { label: "Announcements", path: "/announcements", icon: Megaphone },
      { label: "Audit Logs", path: "/audit-logs", icon: History },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Settings", path: "/settings", icon: Settings },
      { label: "Admin Profile", path: "/profile", icon: User },
    ],
  },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
  onNavigate?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  className = "",
  onNavigate,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAdminAuth();

  const displayName = profile?.full_name || "Administrator";
  const displayEmail = user?.email || "";
  const displayAvatar = profile?.avatar_url || "";
  const displayInitials = getInitials(displayName);

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out of Admin Portal.");
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-surface border-r border-border h-screen transition-all duration-300 select-none",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      <div className="flex flex-col h-full p-4 justify-between overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Logo / Brand Header */}
          <div
            className={cn(
              "relative flex transition-all duration-300 px-2 group/header items-center",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <div className="relative group/logo">
              <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-3">
                <div className="size-9 rounded-xl overflow-hidden shrink-0 border border-border/80 shadow-md shadow-primary/10 transition-all duration-300 group-hover/logo:scale-95">
                  <img
                    src="/favicon.png"
                    alt="Eduspace Logo"
                    loading="eager"
                    decoding="async"
                    className="size-full object-cover"
                  />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-lg tracking-tight text-foreground">Eduspace</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded-md border border-primary/20">
                        Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">Management Console</p>
                  </div>
                )}
              </Link>

              {/* Hover Expand Trigger when Collapsed */}
              {isCollapsed && (
                <button
                  onClick={onToggleCollapse}
                  className="absolute inset-0 flex items-center justify-center bg-primary opacity-0 group-hover/logo:opacity-100 transition-all duration-200 rounded-xl z-10 text-primary-foreground shadow-lg"
                  title="Expand Sidebar"
                >
                  <ChevronRight className="size-5" />
                </button>
              )}
            </div>

            {/* Collapse Trigger Button when Expanded */}
            {!isCollapsed && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg border border-border bg-background/60 opacity-0 group-hover/header:opacity-100 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all shadow-sm"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-4">
            <TooltipProvider>
              {navSections.map((section, secIdx) => (
                <div key={secIdx} className="space-y-1">
                  {!isCollapsed && (
                    <h4 className="px-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                      {section.title}
                    </h4>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        location.pathname === item.path ||
                        (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

                      const linkContent = (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group active:scale-[0.98]",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                            isCollapsed && "justify-center px-0"
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-5 shrink-0 transition-transform duration-200",
                              !isActive && "group-hover:scale-110",
                              isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                          {!isCollapsed && item.badge && (
                            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );

                      if (isCollapsed) {
                        return (
                          <Tooltip key={item.path} delayDuration={0}>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side="right" className="font-medium text-xs">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return linkContent;
                    })}
                  </div>
                </div>
              ))}
            </TooltipProvider>
          </nav>
        </div>

        {/* Bottom Profile Section matching student/lecturer sidebar */}
        <div
          className={cn(
            "mt-auto pt-4 border-t border-border/60",
            isCollapsed ? "px-0" : "px-1"
          )}
        >
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center w-full gap-3 p-2 rounded-xl border border-transparent hover:bg-muted/60 transition-all duration-200 group outline-none text-left",
                  isCollapsed ? "justify-center px-0" : "px-3"
                )}
              >
                <Avatar
                  className={cn(
                    "border border-border/60 shadow-sm transition-transform duration-200 group-hover:scale-105",
                    isCollapsed ? "size-10" : "size-9"
                  )}
                >
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate leading-tight">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                      {displayEmail}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align={isCollapsed ? "center" : "end"} side="top" className="w-56 bg-card border-border">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-foreground">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate font-mono">
                    {displayEmail}
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Administrator
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-xs cursor-pointer">
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Admin Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-xs cursor-pointer">
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleLogout}
                onClick={handleLogout}
                className="text-xs cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
};
