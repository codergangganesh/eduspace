import React from "react";
import { useTheme } from "next-themes";
import { useAdminAuth } from "@/hooks/useAdminAuth";
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
  ExternalLink,
  Menu,
  Bell,
  Settings,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AdminHeaderProps {
  onToggleMobileSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobileSidebar }) => {
  const { user, profile, signOut } = useAdminAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out of Admin Portal.");
    navigate("/login", { replace: true });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
      {/* Left Mobile Menu Toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMobileSidebar}
          className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-foreground">Eduspace Administration</h1>
          <p className="text-[11px] text-muted-foreground">Platform oversight & governance</p>
        </div>
      </div>

      {/* Right Action Icons & User Dropdown */}
      <div className="flex items-center space-x-2.5">
        {/* Main App Link */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="hidden md:flex text-xs font-medium h-8 gap-1.5 border-border/80"
        >
          <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            Open Student App
          </a>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
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
            <Button variant="ghost" className="flex items-center gap-2.5 px-2 h-9 rounded-full hover:bg-muted/80">
              <UserAvatar
                name={profile?.full_name || user?.email}
                avatarUrl={profile?.avatar_url}
                size="sm"
              />
              <div className="hidden sm:block text-left text-xs">
                <p className="font-semibold text-foreground leading-tight">
                  {profile?.full_name || "Administrator"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {user?.email}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{profile?.full_name || "Admin"}</p>
                <p className="text-xs leading-none text-muted-foreground truncate font-mono">
                  {user?.email}
                </p>
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
