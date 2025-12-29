import { Bell, Search, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { UserDropdown } from "./UserDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="h-16 border-b border-border bg-surface px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-10">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden size-10 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground"
      >
        <Menu className="size-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses, assignments..."
            className="pl-10 h-10 bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link
          to="/notifications"
          className="size-10 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Link>

        {/* User Dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
}
