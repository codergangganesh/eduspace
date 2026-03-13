import { useEffect, useState } from "react";
import { PanelLeft, Sun, Moon, UserPlus, Search, ChevronLeft, ChevronRight, MoreVertical, Bell, NotebookPen, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { UserDropdown } from "./UserDropdown";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";
import { StudentNotesDrawer } from "../student/StudentNotesDrawer";
import { useNavigate, Link } from "react-router-dom";
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
  const { profile, role, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [toolsExpanded, setToolsExpanded] = useState<boolean>(true);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isLecturer = role === "lecturer";

  // Track scroll for dynamic header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // "If notification icon should be enabled" logic
  const showNotifications = profile?.notifications_enabled !== false;

  // Initialize and react to profile changes for persistent header tools state
  useEffect(() => {
    if (profile && typeof (profile as any).header_tools_expanded !== "undefined") {
      setToolsExpanded((profile as any).header_tools_expanded);
    } else {
      setToolsExpanded(true);
    }
  }, [profile]);

  const handleToggleTools = async () => {
    const next = !toolsExpanded;
    setToolsExpanded(next);

    // Persist preference if profile/updateProfile are available
    if (!profile || !updateProfile) return;

    try {
      setIsSavingPreference(true);
      const result = await updateProfile({ header_tools_expanded: next } as any);
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
        variant="default"
        size="sm"
        onClick={() => window.dispatchEvent(new CustomEvent("open-invite-dialog"))}
        className="h-10 px-4 gap-2 shadow-md shadow-primary/20 shrink-0 rounded-xl active:scale-95 transition-all"
        title="Invite User"
      >
        <UserPlus className="size-4" />
        <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Invite</span>
      </Button>
      {actions}
      <Button 
          id="tour-nav-notes" 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-xl border-border/40 bg-muted/30 hover:bg-muted/60 active:scale-95 transition-all shadow-sm group" 
          onClick={() => window.dispatchEvent(new CustomEvent("open-student-notes"))}
          title="My Notes"
      >
          <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </Button>

      {showNotifications && <NotificationsPopover />}

      <Button
        variant="outline"
        size="icon"
        className="hidden lg:flex h-10 w-10 rounded-xl border-border/40 bg-muted/30 hover:bg-muted/60 active:scale-90 transition-all shadow-sm"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? <Sun className="size-[20px] text-amber-500" /> : <Moon className="size-[20px] text-blue-400" />}
      </Button>
    </>
  );

  return (
    <header className={cn(
      "sticky top-0 z-[50] flex min-h-16 items-center px-4 lg:px-6 pt-[var(--safe-top)] transition-all duration-300",
      scrolled 
        ? "bg-surface/80 backdrop-blur-xl border-b border-border/40 shadow-lg shadow-black/5" 
        : "bg-surface/0 border-b border-transparent"
    )}>
      <StudentNotesDrawer showTrigger={false} />
      <div className="flex items-center transition-all duration-300">
        <Button 
          variant="outline" 
          size="icon" 
          className="lg:hidden mr-3 h-10 w-10 rounded-xl border-border/40 bg-muted/30 hover:bg-muted/60 active:scale-90 transition-all shadow-sm"
          onClick={onMenuClick}
        >
          <PanelLeft className="size-[22px] text-primary stroke-[2.5px]" />
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          className="hidden lg:flex h-10 w-64 justify-start text-muted-foreground font-normal bg-muted/40 border-border/40 hover:bg-muted/60 transition-all rounded-xl active:scale-[0.98] shadow-sm"
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Quick search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-[10px]">Alt</span>+K
          </kbd>
        </Button>

        {/* Mobile Actions Group */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-border/40 bg-muted/30 hover:bg-muted/60 active:scale-95 transition-all shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent("open-command-palette"));
            }}
          >
            <Search className="size-5" />
          </Button>

          {showNotifications && <NotificationsPopover />}
          
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-xl border-border/40 bg-muted/30 hover:bg-muted/60 active:scale-95 transition-all shadow-sm"
              >
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl border-border/50 shadow-2xl backdrop-blur-xl bg-popover/95 z-[10002]">
              <DropdownMenuItem 
                onSelect={() => {
                  // Tiny delay ensures the dropdown closes before the new modal/drawer opens
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("open-invite-dialog"));
                  }, 150);
                }}
                className="rounded-xl p-2.5 font-bold cursor-pointer"
              >
                <UserPlus className="mr-2 size-4 text-primary" />
                <span>Invite User</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onSelect={() => {
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("open-student-notes"));
                  }, 150);
                }}
                className="rounded-xl p-2.5 font-bold cursor-pointer"
              >
                <NotebookPen className="mr-2 size-4 text-primary" />
                <span>Student Notes</span>
              </DropdownMenuItem>
              
              {actions && (
                <>
                  <DropdownMenuSeparator className="my-1.5" />
                  <div className="p-1">
                    {actions}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="transition-transform active:scale-90">
            <UserDropdown />
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-border/40 bg-muted/30 hover:bg-muted/60 active:scale-90 transition-all shadow-sm"
            onClick={handleToggleTools}
            disabled={isSavingPreference}
            title={toolsExpanded ? "Hide header tools" : "Show header tools"}
          >
            {toolsExpanded ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          </Button>
          {toolsExpanded && (
            <div className="flex items-center gap-2 transition-all animate-in slide-in-from-right-4 duration-500">
              {toolButtons}
            </div>
          )}
          <div className="transition-transform active:scale-90">
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
