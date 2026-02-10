import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  MousePointer2,
  PanelLeft,
  Table,
  User,
  Users,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLecturerStudents } from "@/hooks/useLecturerStudents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const studentNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Schedule", path: "/schedule" },
  { icon: FileText, label: "Assignments", path: "/student/assignments" },
  { icon: FileText, label: "Quizzes", path: "/student/quizzes" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
];

const lecturerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/lecturer-dashboard" },
  { icon: Users, label: "All Students", path: "/all-students" },
  { icon: Table, label: "Time Table", path: "/lecturer/timetable" }, // New Item
  { icon: Calendar, label: "Schedule", path: "/schedule" },
  { icon: FileText, label: "Assignments", path: "/lecturer/assignments" },
  { icon: FileText, label: "Quizzes", path: "/lecturer/quizzes" },
  { icon: Sparkles, label: "AI Quiz", path: "/lecturer/quizzes?mode=create-ai" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
];

const bottomNavItems = [
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  mode: 'expanded' | 'collapsed' | 'hover';
  setMode: (mode: 'expanded' | 'collapsed' | 'hover') => void;
  isCollapsed: boolean;
  onHoverChange: (isHovered: boolean) => void;
}

export function Sidebar({ mode, setMode, isCollapsed, onHoverChange }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, role } = useAuth();
  const [isStudentsExpanded, setIsStudentsExpanded] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Fetch students ONLY if user is a lecturer
  const { students } = useLecturerStudents();
  const isLecturer = role === "lecturer";

  const navItems = isLecturer ? lecturerNavItems : studentNavItems;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const dashboardPath = isLecturer ? "/lecturer-dashboard" : "/dashboard";

  return (
    <aside
      onMouseEnter={() => mode === 'hover' && onHoverChange(true)}
      onMouseLeave={() => mode === 'hover' && onHoverChange(false)}
      className={cn(
        "hidden lg:flex flex-col bg-surface border-r border-border h-screen fixed left-0 top-0 z-20 transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex flex-col h-full p-4 justify-between overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-8">
          {/* Logo/Brand */}
          <div className="flex items-center px-3">
            <Link to={dashboardPath} className="flex items-center gap-3">
              <div className="size-8 rounded-lg overflow-hidden shrink-0 border border-border">
                <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold tracking-tight">Eduspace</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              let isActive = false;

              if (item.path.includes('?')) {
                // For items with query params (like AI Quiz), require exact match including search
                isActive = (location.pathname + location.search) === item.path;
              } else {
                // For standard items, match pathname but exclude if we're in a specific mode that has its own item
                isActive = location.pathname === item.path;
                if (item.path === '/lecturer/quizzes' && location.search.includes('mode=create-ai')) {
                  isActive = false;
                }
              }
              return (
                <Link
                  key={item.path + item.label}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="size-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}

            {/* Dynamic Student List for Lecturers */}
            {isLecturer && !isCollapsed && students.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setIsStudentsExpanded(!isStudentsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  <span>My Students</span>
                  {isStudentsExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                </button>

                {isStudentsExpanded && (
                  <div className="flex flex-col gap-1 mt-1 pl-2">
                    {students.slice(0, 5).map((student) => (
                      <Link
                        key={student.student_id}
                        to={`/students/${student.student_id}`} // Future profile view
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                      >
                        <Avatar className="size-6">
                          <AvatarImage src={student.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">{student.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{student.full_name}</span>
                      </Link>
                    ))}
                    {students.length > 5 && (
                      <Link to="/all-students" className="px-3 py-1 text-xs text-primary hover:underline ml-2">
                        + {students.length - 5} more
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Navigation */}
        <div className="flex flex-col gap-1 mt-auto">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="size-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
          >
            <LogOut className="size-5 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>

          <div className="mt-2 border-t border-border pt-4">
            {isCollapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center p-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all w-full">
                    <PanelLeft className="size-5 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-2 rounded-xl" side="right" sideOffset={10}>
                  <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Sidebar Style</DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setMode('expanded')}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                        mode === 'expanded' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary text-muted-foreground"
                      )}
                    >
                      <Maximize2 className="size-4" />
                      <span>Expanded</span>
                    </button>
                    <button
                      onClick={() => setMode('collapsed')}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                        mode === 'collapsed' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary text-muted-foreground"
                      )}
                    >
                      <Minimize2 className="size-4" />
                      <span>Collapsed</span>
                    </button>
                    <button
                      onClick={() => setMode('hover')}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                        mode === 'hover' ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary text-muted-foreground"
                      )}
                    >
                      <MousePointer2 className="size-4" />
                      <span>Hover Mode</span>
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="px-1">
                <button
                  onClick={() => setShowControls(!showControls)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all w-full group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-background border border-border group-hover:border-primary/30 transition-colors">
                      <PanelLeft className="size-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold">Sidebar Style</span>
                  </div>
                  {showControls ? <ChevronDown className="size-4 opacity-50" /> : <ChevronRight className="size-4 opacity-50" />}
                </button>

                {showControls && (
                  <div className="mt-3 p-1.5 bg-secondary/20 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-3 gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setMode('expanded')}
                              className={cn(
                                "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all",
                                mode === 'expanded'
                                  ? "bg-background text-primary shadow-sm ring-1 ring-border/50"
                                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                              )}
                            >
                              <Maximize2 className="size-4" />
                              <span className="text-[10px] font-bold uppercase tracking-tight">Full</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p>Always expanded</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setMode('collapsed')}
                              className={cn(
                                "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all",
                                mode === 'collapsed'
                                  ? "bg-background text-primary shadow-sm ring-1 ring-border/50"
                                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                              )}
                            >
                              <Minimize2 className="size-4" />
                              <span className="text-[10px] font-bold uppercase tracking-tight">Slim</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p>Always collapsed</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setMode('hover')}
                              className={cn(
                                "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all",
                                mode === 'hover'
                                  ? "bg-background text-primary shadow-sm ring-1 ring-border/50"
                                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                              )}
                            >
                              <MousePointer2 className="size-4" />
                              <span className="text-[10px] font-bold uppercase tracking-tight">Hover</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p>Expand on hover</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
