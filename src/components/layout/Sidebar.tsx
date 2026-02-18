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
  Minimize2,
  MousePointer2,
  PanelLeft,
  Table,
  User,
  Users,
  Sparkles,
  Bot,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck,
  Wand2,
  Orbit,
  Brain,
  Flame,
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
  { icon: ClipboardList, label: "Assignments", path: "/student/assignments" },
  { icon: FileCheck, label: "Quizzes", path: "/student/quizzes" },
  { icon: Orbit, label: "EduMatrix", path: "/student/knowledge-map" },
  { icon: Bot, label: "Eduspace AI", path: "/ai-chat" },
  { icon: Flame, label: "Academic Streak", path: "/streak" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
];

const lecturerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/lecturer-dashboard" },
  { icon: Users, label: "All Students", path: "/all-students" },
  { icon: Table, label: "Time Table", path: "/lecturer/timetable" }, // New Item
  { icon: Calendar, label: "Schedule", path: "/schedule" },
  { icon: ClipboardList, label: "Assignments", path: "/lecturer/assignments" },
  { icon: FileCheck, label: "Quizzes", path: "/lecturer/quizzes" },
  { icon: Bot, label: "Eduspace AI", path: "/ai-chat" },
  { icon: Brain, label: "AI Quiz Generator", path: "/lecturer/create-ai-quiz" },
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

  const handleToggle = () => {
    if (mode === 'expanded') {
      setMode('collapsed');
    } else {
      setMode('expanded');
    }
  };

  const dashboardPath = isLecturer ? "/lecturer-dashboard" : "/dashboard";

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-surface border-r border-border h-[100dvh] fixed left-0 top-0 z-20 transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex flex-col h-full p-4 justify-between overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-8">
          {/* Logo/Brand */}
          <div className={cn(
            "relative flex transition-all duration-300 px-3 group/header",
            isCollapsed ? "justify-center" : "items-center justify-between"
          )}>
            <div className="relative group/logo">
              <Link to={dashboardPath} className="flex items-center gap-3">
                <div className="size-8 rounded-lg overflow-hidden shrink-0 border border-border shadow-sm transition-all duration-300 group-hover/logo:scale-95 group-hover/logo:opacity-40">
                  <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                </div>
                {!isCollapsed && (
                  <span className="text-xl font-bold tracking-tight">Eduspace</span>
                )}
              </Link>

              {isCollapsed && (
                <button
                  onClick={handleToggle}
                  className="absolute inset-0 flex items-center justify-center bg-primary opacity-0 group-hover/logo:opacity-100 pointer-events-none group-hover/logo:pointer-events-auto transition-all duration-200 rounded-lg z-10"
                  title="Expand Sidebar"
                >
                  <ChevronRight className="size-5 text-primary-foreground" />
                </button>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleToggle}
                className="p-1.5 rounded-lg border border-border bg-background/50 opacity-0 group-hover/header:opacity-100 hover:bg-secondary text-primary transition-all shadow-sm"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1.5">
            <TooltipProvider>
              {navItems.map((item) => {
                let isActive = false;

                if (item.path.includes('?')) {
                  isActive = (location.pathname + location.search) === item.path;
                } else {
                  isActive = location.pathname === item.path;
                  if (item.path === '/lecturer/quizzes' && location.search.includes('mode=create-ai')) {
                    isActive = false;
                  }
                }

                const content = (
                  <Link
                    key={item.path + item.label}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("size-5 shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.path + item.label} delayDuration={0}>
                      <TooltipTrigger asChild>
                        {content}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return content;
              })}
            </TooltipProvider>

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
        <div className="flex flex-col gap-1.5 mt-auto">
          <TooltipProvider>
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const content = (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("size-5 shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>
                      {content}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return content;
            })}

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-all w-full group shadow-md shadow-red-600/20 active:scale-[0.98]"
                >
                  <LogOut className="size-5 shrink-0 group-hover:scale-110 transition-transform duration-200" />
                  {!isCollapsed && <span>Sign Out</span>}
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  Sign Out
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>


        </div>
      </div>
    </aside>
  );
}
