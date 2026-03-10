import { Menu, Sun, Moon, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { UserDropdown } from "./UserDropdown";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";
import { StudentNotesDrawer } from "../student/StudentNotesDrawer";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  actions?: ReactNode;
}

export function DashboardHeader({ onMenuClick, actions }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { profile, role } = useAuth();
  const isLecturer = role === "lecturer";

  // "If notification icon should be enabled" logic
  // If the user disabled notifications, do we show the bell? 
  // User said: "if it was disabled quite opposite". 
  // Usually this means the FEATURE is disabled. So we hide the bell.
  // Profile might strictly not have the column yet if SQL wasn't run, 
  // so we default to true (show bell) to avoid confusion during dev.
  const showNotifications = profile?.notifications_enabled !== false;

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center border-b bg-surface px-4 shadow-sm lg:px-6 pt-[var(--safe-top)]">
      <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={onMenuClick}>
        <Menu className="size-5" />
      </Button>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          className="hidden lg:flex h-9 w-64 justify-start text-muted-foreground font-normal bg-muted/40 border-border/40 hover:bg-muted/60 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Quick search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-[10px]">Alt</span>+K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        >
          <Search className="size-5" />
        </Button>
        <Button
          id="tour-btn-invite"
          variant="default"
          size="sm"
          onClick={() => window.dispatchEvent(new CustomEvent("open-invite-dialog"))}
          className="h-9 px-3 gap-2 shadow-sm shrink-0"
          title="Invite User"
        >
          <UserPlus className="size-4" />
          <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Invite</span>
        </Button>
        {actions}

        <StudentNotesDrawer />

        {showNotifications && <NotificationsPopover />}

        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
        <UserDropdown />
      </div>
    </header>
  );
}
