import { useEffect, useState } from "react";
import { PanelLeft, Sun, Moon, UserPlus, Search, ChevronLeft, ChevronRight, MoreVertical, NotebookPen, BookOpen, Flame, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { UserDropdown } from "./UserDropdown";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { useAuth } from "@/contexts/AuthContext";
import { useStreak } from "@/contexts/StreakContext";
import { ReactNode } from "react";
import { StudentNotesDrawer } from "../student/StudentNotesDrawer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  actions?: ReactNode;
}

export function DashboardHeader({ onMenuClick, actions }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile, role } = useAuth();
  const { streak } = useStreak();
  const [toolsExpanded, setToolsExpanded] = useState<boolean>(true);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const isLecturer = role === "lecturer";

  // Persistent header tools state
  const headerToolsExpanded = (profile as (typeof profile & { header_tools_expanded?: boolean }) | null)?.header_tools_expanded;

  // Track scroll for dynamic header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initialize and react to profile changes for persistent header tools state
  useEffect(() => {
    if (typeof headerToolsExpanded !== "undefined") {
      setToolsExpanded(headerToolsExpanded);
    } else {
      setToolsExpanded(true);
    }
  }, [headerToolsExpanded]);

  const handleToggleTools = async () => {
    const next = !toolsExpanded;
    setToolsExpanded(next);

    // Persist preference if profile/updateProfile are available
    if (!profile || !updateProfile) return;

    try {
      setIsSavingPreference(true);
      const headerPreferenceUpdate: Parameters<typeof updateProfile>[0] & { header_tools_expanded?: boolean } = {
        header_tools_expanded: next,
      };
      const result = await updateProfile(headerPreferenceUpdate);
      if (!result.success) {
        throw new Error(result.error || "Failed to save header preference");
      }
    } catch (error) {
      console.error("Error updating header tools preference:", error);
      setToolsExpanded(!next);
      toast.error("Could not save header preference");
    } finally {
      setIsSavingPreference(false);
    }
  };

  const toolButtons = (
    <>
      <Button
        id="tour-btn-invite"
        variant="outline"
        size="icon"
        className="size-9 rounded-full border-border bg-background hover:bg-muted active:scale-95 transition-all shadow-sm shrink-0 group"
        onClick={() => window.dispatchEvent(new CustomEvent("open-invite-dialog"))}
        title="Invite User"
      >
        <UserPlus className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors" />
      </Button>
      {actions}
      <Button
        id="tour-nav-notes"
        variant="outline"
        size="icon"
        className="size-9 rounded-full border-border bg-background hover:bg-muted active:scale-95 transition-all shadow-sm group"
        onClick={() => window.dispatchEvent(new CustomEvent("open-student-notes"))}
        title="My Notes"
      >
        <BookOpen className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="hidden lg:flex size-9 rounded-full border-border bg-background hover:bg-muted active:scale-90 transition-all shadow-sm"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? <Sun className="h-[18px] w-[18px] text-amber-500" /> : <Moon className="h-[18px] w-[18px] text-blue-400" />}
      </Button>
    </>
  );

  const streakBadge = (
    <div 
      className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-orange-50 dark:bg-slate-950 border border-orange-200/60 dark:border-slate-800 shadow-sm transition-all"
      title="Current Daily Streak"
    >
      <Flame className="size-4 text-orange-500 fill-orange-500/20 dark:drop-shadow-[0_0_2px_rgba(249,115,22,0.6)]" />
      <span className="text-[14px] font-bold text-orange-600 dark:text-orange-400 tracking-wide">{streak?.current_streak || 0}</span>
    </div>
  );

  const tourButton = (
    <Button
      variant="outline"
      size="icon"
      className="size-9 rounded-full border-border bg-background hover:bg-muted active:scale-95 transition-all shadow-sm group"
      onClick={() => window.dispatchEvent(new CustomEvent("open-app-guide"))}
      title="Start Application Tour"
    >
      <Play className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors fill-muted-foreground/10 group-hover:fill-primary/20" />
    </Button>
  );

  return (
    <header className={cn(
      "sticky top-0 z-[50] flex min-h-14 items-center px-3 lg:px-5 pt-[var(--safe-top)] transition-all duration-300",
      scrolled
        ? "bg-surface/80 backdrop-blur-xl border-b border-border/40 shadow-lg shadow-black/5"
        : "bg-surface/0 border-b border-transparent"
    )}>
      <StudentNotesDrawer showTrigger={false} />
      <div className="flex items-center transition-all duration-300">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden mr-3 h-8 w-8 rounded-xl border-border/40 bg-muted/30 hover:bg-muted/60 active:scale-90 transition-all shadow-sm"
          onClick={onMenuClick}
        >
          <PanelLeft className="size-[22px] text-primary stroke-[2.5px]" />
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <button 
           className="hidden lg:block text-[14px] leading-tight font-medium text-primary hover:text-primary/80 transition-colors mr-2"
           onClick={() => window.dispatchEvent(new CustomEvent("open-feedback"))}
        >
          Feedback
        </button>

        <Button
          variant="outline"
          className="hidden lg:flex h-8 w-[170px] justify-start text-muted-foreground font-normal bg-background border-border hover:bg-muted/50 transition-all rounded-full active:scale-[0.98] shadow-sm text-[12px] px-3 mr-2"
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        >
          <Search className="mr-1.5 h-3.5 w-3.5 text-muted-foreground/60" />
          <span>Search...</span>
          <span className="ml-auto pointer-events-none text-[11px] font-medium text-primary/70">
            Ctrl K
          </span>
        </Button>

        {/* Mobile Actions Group */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-full border-border bg-background hover:bg-muted active:scale-95 transition-all shadow-sm group"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent("open-command-palette"));
            }}
          >
            <Search className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors" />
          </Button>

          {!isLecturer ? streakBadge : tourButton}
          <NotificationsPopover />

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full border-border bg-background hover:bg-muted active:scale-95 transition-all shadow-sm group"
              >
                <MoreVertical className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 rounded-[20px] border-border/50 shadow-2xl backdrop-blur-xl bg-popover/95 z-[10002]">
              <div className="grid grid-cols-2 gap-2">
                <DropdownMenuItem
                  onSelect={() => {
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("open-invite-dialog"));
                    }, 150);
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl cursor-pointer hover:bg-primary/5 focus:bg-primary/5 transition-all text-center border border-transparent hover:border-primary/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserPlus className="size-4" />
                  </div>
                  <span className="text-[10px] font-bold text-foreground">Invite</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => {
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("open-student-notes"));
                    }, 150);
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl cursor-pointer hover:bg-primary/5 focus:bg-primary/5 transition-all text-center border border-transparent hover:border-primary/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <NotebookPen className="size-4" />
                  </div>
                  <span className="text-[10px] font-bold text-foreground">Notes</span>
                </DropdownMenuItem>
              </div>

              {actions && (
                <>
                  <DropdownMenuSeparator className="my-1.5 opacity-50" />
                  <div className="p-1 px-1.5">
                    {actions}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <UserDropdown />
        </div>

        <div className="hidden lg:flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-full border-border bg-background hover:bg-muted active:scale-95 transition-all shadow-sm group text-muted-foreground hover:text-primary"
            onClick={handleToggleTools}
            disabled={isSavingPreference}
            title={toolsExpanded ? "Hide header tools" : "Show header tools"}
          >
            {toolsExpanded ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          </Button>
          {toolsExpanded && (
            <div className="flex items-center gap-1 transition-all animate-in slide-in-from-right-4 duration-500">
              {toolButtons}
            </div>
          )}
          {!isLecturer ? streakBadge : tourButton}
          <NotificationsPopover />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
