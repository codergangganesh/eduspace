import React from "react";
import { useTheme } from "next-themes";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminBadges } from "@/hooks/useAdminBadges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/users/UserAvatar";
import {
  Sun,
  Moon,
  LogOut,
  User,
  Menu,
  Settings,
  Search,
  Bell,
  MessageSquare,
  History,
  Lock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAdminPinLock } from "@/hooks/useAdminPinLock";

interface AdminHeaderProps {
  onToggleMobileSidebar?: () => void;
  onOpenCommandPalette?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleMobileSidebar,
  onOpenCommandPalette,
}) => {
  const { user, profile, signOut } = useAdminAuth();
  const { lockScreen, isPinLockEnabled } = useAdminPinLock();
  const { theme, setTheme } = useTheme();
  const { badges } = useAdminBadges();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out of Admin Portal.");
    navigate("/login", { replace: true });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const totalAlerts = badges.unreadMessagesCount + (badges.recentAuditLogsCount > 0 ? 1 : 0);

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-3.5 sm:px-6 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
      {/* Left: Mobile Menu Toggle & App Title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMobileSidebar}
          className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-sm sm:text-base lg:text-lg xl:text-xl font-extrabold tracking-tight text-foreground">
            Eduspace Administration
          </h1>
          <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground hidden sm:block">
            Platform governance & management
          </p>
        </div>
      </div>

      {/* Right Action Icons & User Dropdown */}
      <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
        {/* Desktop Spotlight Search Trigger Button (Ctrl + K) aligned near Student App */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs transition-all shadow-xs group cursor-pointer"
          title="Search users, courses, classes, or pages (Ctrl + K)"
        >
          <Search className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline text-xs font-medium">Search...</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-mono font-bold text-muted-foreground bg-card border border-border rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Mobile Search Icon Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenCommandPalette}
          className="sm:hidden h-9 w-9 text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
          title="Search (Spotlight)"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Student App Link with Glowing Aesthetic and No Arrow Mark */}
        <a
          href="https://www.eduspaceacademy.online/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center justify-center text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground border border-primary/40 px-3.5 py-1.5 rounded-full shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/40 transition-all duration-300 ring-1 ring-primary/20 hover:scale-105"
        >
          Student App
        </a>

        {/* Live Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full relative cursor-pointer"
              title="Live Platform Activity"
            >
              <Bell className="h-4 w-4" />
              {totalAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-card border-border p-2 space-y-1">
            <DropdownMenuLabel className="font-bold text-xs flex items-center justify-between py-1.5">
              <span>Live Notifications</span>
              {totalAlerts > 0 && (
                <Badge variant="default" className="text-[10px] bg-primary">
                  {totalAlerts} Active
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Messages Alert Item */}
            <DropdownMenuItem asChild className="text-xs p-2 rounded-lg cursor-pointer">
              <Link to="/messages" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Student Messages</p>
                    <p className="text-[10px] text-muted-foreground">Moderation & threads</p>
                  </div>
                </div>
                {badges.unreadMessagesCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {badges.unreadMessagesCount}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>

            {/* Audit Logs Alert Item */}
            <DropdownMenuItem asChild className="text-xs p-2 rounded-lg cursor-pointer">
              <Link to="/audit-logs" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Recent Audit Activity</p>
                    <p className="text-[10px] text-muted-foreground">Last 24 hours log entries</p>
                  </div>
                </div>
                {badges.recentAuditLogsCount > 0 && (
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-500 border-emerald-500/30">
                    {badges.recentAuditLogsCount}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
          title="Toggle light / dark mode"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </Button>

        {/* Admin Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex items-center justify-center p-0.5 rounded-full ring-2 ring-transparent hover:ring-primary/40 transition-all outline-none focus-visible:ring-primary focus-visible:ring-2 cursor-pointer"
              title="Admin Account Options"
            >
              <UserAvatar
                name={profile?.full_name || user?.email || "Admin"}
                avatarUrl={profile?.avatar_url}
                size="md"
                className="cursor-pointer shadow-sm hover:scale-105 transition-transform"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{profile?.full_name || "Administrator"}</p>
                <p className="text-xs leading-none text-muted-foreground truncate font-mono">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-xs cursor-pointer">
              <Link to="/profile">
                <User className="mr-2 h-4 w-4 text-primary" />
                Admin Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-xs cursor-pointer">
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4 text-primary" />
                System Settings
              </Link>
            </DropdownMenuItem>
            {isPinLockEnabled && (
              <DropdownMenuItem
                onClick={lockScreen}
                className="text-xs cursor-pointer text-foreground focus:bg-primary/10 focus:text-primary"
              >
                <Lock className="mr-2 h-4 w-4 text-primary" />
                Lock Screen Now
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleSignOut}
              onClick={handleSignOut}
              className="text-xs cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
