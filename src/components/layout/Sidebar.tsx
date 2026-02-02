import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  User,
  Users,
  ChevronDown,
  ChevronRight,
  Table,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLecturerStudents } from "@/hooks/useLecturerStudents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  { icon: FileText, label: "Quizzes", path: "/lecturer/quizzes" }, // New Item
  { icon: MessageSquare, label: "Messages", path: "/messages" },
];

const bottomNavItems = [
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, role } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isStudentsExpanded, setIsStudentsExpanded] = useState(true);

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
      className={cn(
        "hidden lg:flex flex-col bg-surface border-r border-border h-screen fixed left-0 top-0 z-20 transition-all duration-300",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex flex-col h-full p-4 justify-between overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-8">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-3">
            <Link to={dashboardPath} className="flex items-center gap-3">
              <div className="size-8 rounded-lg overflow-hidden shrink-0 border border-border">
                <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold tracking-tight">Eduspace</span>
              )}
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "size-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all",
                isCollapsed && "rotate-180"
              )}
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
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
        </div>
      </div>
    </aside>
  );
}
