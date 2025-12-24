import { Bell, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
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
        <button className="size-10 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell className="size-5" />
          <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full" />
        </button>

        {/* User Avatar */}
        <button className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-lg hover:bg-secondary transition-colors">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">Student</p>
          </div>
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            JD
          </div>
        </button>
      </div>
    </header>
  );
}
