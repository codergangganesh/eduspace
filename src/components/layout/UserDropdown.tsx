import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Settings, LogOut, ChevronDown, Mail, GraduationCap, UserCheck, ShieldCheck, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { ContactSupportDialog } from "@/components/common/ContactSupportDialog";

export function UserDropdown() {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const displayName = profile?.full_name || "User";
  const displayRole = role === "lecturer" ? "Lecturer" : role === "admin" ? "Admin" : "Student";

  return (
    <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 pl-2 pr-1 h-10 rounded-xl border border-transparent hover:bg-muted/30 transition-all duration-300 group">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-black tracking-tight text-foreground/90 group-hover:text-foreground">{displayName}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{displayRole}</p>
            </div>
            <Avatar className="size-8 border border-border/50 shadow-sm">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="size-4 text-muted-foreground hidden sm:block group-hover:text-foreground transition-colors" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-2xl border-border/50 shadow-2xl backdrop-blur-xl bg-popover/95">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2 py-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold leading-none tracking-tight">{displayName}</p>
                <div className={cn(
                  "flex items-center gap-0.5 px-1 py-0 rounded-full text-[7px] font-bold uppercase tracking-widest border shadow-sm shrink-0",
                  role === "lecturer"
                    ? "bg-indigo-500/10 text-indigo-600 border-indigo-200/50 dark:bg-indigo-400/10 dark:text-indigo-400 dark:border-indigo-400/20"
                    : role === "admin"
                      ? "bg-amber-500/10 text-amber-600 border-amber-200/50 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-200/50 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20"
                )}>
                  {role === "lecturer" ? <UserCheck className="size-2" /> :
                    role === "admin" ? <ShieldCheck className="size-2" /> :
                      <GraduationCap className="size-2" />}
                  {displayRole}
                </div>
              </div>
              <p className="text-xs leading-none text-muted-foreground font-medium opacity-80">
                {profile?.email || "No email"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
              <User className="size-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="size-4" />
              Settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Mobile-only Theme Toggle */}
          <div className="sm:hidden">
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5 flex items-center gap-2">
              Appearance
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className={cn("flex items-center gap-2 cursor-pointer", theme === "light" && "bg-primary/5 text-primary")}
            >
              <Sun className="size-4" />
              Light
              {theme === "light" && <div className="ml-auto size-1.5 rounded-full bg-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className={cn("flex items-center gap-2 cursor-pointer", theme === "dark" && "bg-primary/5 text-primary")}
            >
              <Moon className="size-4" />
              Dark
              {theme === "dark" && <div className="ml-auto size-1.5 rounded-full bg-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className={cn("flex items-center gap-2 cursor-pointer", theme === "system" && "bg-primary/5 text-primary")}
            >
              <Monitor className="size-4" />
              System
              {theme === "system" && <div className="ml-auto size-1.5 rounded-full bg-primary" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </div>

          <DialogTrigger asChild>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <Mail className="size-4" />
              Contact Support
            </DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ContactSupportDialog open={isContactOpen} onOpenChange={setIsContactOpen} />
    </Dialog>
  );
}
