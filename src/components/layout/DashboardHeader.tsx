import { Menu, Sun, Moon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { UserDropdown } from "./UserDropdown";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";
import { StudentNotesDrawer } from "@/components/student/StudentNotesDrawer";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  actions?: ReactNode;
  onInviteClick?: () => void;
}

export function DashboardHeader({ onMenuClick, actions, onInviteClick }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();

  // "If notification icon should be enabled" logic
  // If the user disabled notifications, do we show the bell? 
  // User said: "if it was disabled quite opposite". 
  // Usually this means the FEATURE is disabled. So we hide the bell.
  // Profile might strictly not have the column yet if SQL wasn't run, 
  // so we default to true (show bell) to avoid confusion during dev.
  const showNotifications = profile?.notifications_enabled !== false;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-surface px-4 shadow-sm lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={onMenuClick}>
        <Menu className="size-5" />
      </Button>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {onInviteClick && (
          <Button
            variant="default"
            size="sm"
            onClick={onInviteClick}
            className="h-9 px-3 gap-2 shadow-sm shrink-0"
            title="Invite Student"
          >
            <UserPlus className="size-4" />
            <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Invite</span>
          </Button>
        )}
        {actions}

        <StudentNotesDrawer />

        {showNotifications && <NotificationsPopover />}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
        <UserDropdown />
      </div>
    </header>
  );
}
