import * as React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import {
  Search,
  Users,
  GraduationCap,
  FolderKanban,
  BookOpen,
  ClipboardList,
  FileCheck,
  Activity,
  MessageSquare,
  Megaphone,
  History,
  Settings,
  User,
  Sun,
  Moon,
  LayoutDashboard,
  CornerDownLeft,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "pages" | "students" | "lecturers" | "academics" | "actions";
  icon: React.ComponentType<{ className?: string }>;
  avatarUrl?: string | null;
  statusBadge?: string;
  onSelect: () => void;
}

const STATIC_PAGES = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, category: "pages" as const, subtitle: "Overview & Platform Analytics" },
  { title: "Students Directory", path: "/students", icon: Users, category: "pages" as const, subtitle: "Manage registered students" },
  { title: "Lecturers Directory", path: "/lecturers", icon: GraduationCap, category: "pages" as const, subtitle: "Manage faculty & lecturers" },
  { title: "Classes", path: "/classes", icon: FolderKanban, category: "pages" as const, subtitle: "Class cohorts & schedules" },
  { title: "Courses", path: "/courses", icon: BookOpen, category: "pages" as const, subtitle: "Course catalogue & curriculum" },
  { title: "Assignments", path: "/assignments", icon: ClipboardList, category: "pages" as const, subtitle: "Student assignments & submissions" },
  { title: "Quizzes", path: "/quizzes", icon: FileCheck, category: "pages" as const, subtitle: "Quiz & exam moderation" },
  { title: "Live Activity", path: "/activity", icon: Activity, category: "pages" as const, subtitle: "Real-time user event stream" },
  { title: "Messages Moderation", path: "/messages", icon: MessageSquare, category: "pages" as const, subtitle: "Platform communication oversight" },
  { title: "Broadcast Announcements", path: "/announcements", icon: Megaphone, category: "pages" as const, subtitle: "Dispatch institutional announcements" },
  { title: "Audit Logs", path: "/audit-logs", icon: History, category: "pages" as const, subtitle: "Immutable security & audit trail" },
  { title: "Platform Settings", path: "/settings", icon: Settings, category: "pages" as const, subtitle: "System config & admin management" },
  { title: "Admin Profile", path: "/profile", icon: User, category: "pages" as const, subtitle: "Personal settings, avatar & banner" },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "users" | "academics" | "pages">("all");

  // Dynamic DB search results
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [dbLecturers, setDbLecturers] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch initial/queried records from Supabase
  const loadDatabaseRecords = async (searchQuery = "") => {
    try {
      setIsSearchingDb(true);
      const clean = searchQuery.trim();

      let studentQuery = supabase
        .from("profiles")
        .select("id, user_id, full_name, email, avatar_url, student_id, status")
        .limit(6);

      let lecturerQuery = supabase
        .from("lecturer_profiles")
        .select("id, user_id, full_name, email, department, profile_image")
        .limit(6);

      let classQuery = supabase
        .from("classes")
        .select("id, name, course_code, lecturer_name, status")
        .limit(5);

      let courseQuery = supabase
        .from("courses")
        .select("id, title, code, department, status")
        .limit(5);

      if (clean) {
        studentQuery = studentQuery.or(
          `full_name.ilike.%${clean}%,email.ilike.%${clean}%,student_id.ilike.%${clean}%`
        );
        lecturerQuery = lecturerQuery.or(
          `full_name.ilike.%${clean}%,email.ilike.%${clean}%,department.ilike.%${clean}%`
        );
        classQuery = classQuery.or(`name.ilike.%${clean}%,course_code.ilike.%${clean}%`);
        courseQuery = courseQuery.or(`title.ilike.%${clean}%,code.ilike.%${clean}%`);
      }

      const [studentsRes, lecturersRes, classesRes, coursesRes] = await Promise.all([
        studentQuery,
        lecturerQuery,
        classQuery,
        courseQuery,
      ]);

      setDbStudents(studentsRes.data || []);
      setDbLecturers(lecturersRes.data || []);
      setDbClasses(classesRes.data || []);
      setDbCourses(coursesRes.data || []);
    } catch (err) {
      console.warn("[CommandPalette] Error querying database:", err);
    } finally {
      setIsSearchingDb(false);
    }
  };

  // Focus input and load initial records on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
      loadDatabaseRecords("");
    }
  }, [open]);

  // Debounced search on query change
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      loadDatabaseRecords(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Compile all search items
  const allItems: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [];
    const q = query.toLowerCase().trim();

    // 1. Static Pages
    STATIC_PAGES.forEach((page) => {
      if (
        !q ||
        page.title.toLowerCase().includes(q) ||
        page.subtitle.toLowerCase().includes(q) ||
        page.path.includes(q)
      ) {
        items.push({
          id: `page-${page.path}`,
          title: page.title,
          subtitle: page.subtitle,
          category: "pages",
          icon: page.icon,
          statusBadge: "Page",
          onSelect: () => {
            navigate(page.path);
            onClose();
          },
        });
      }
    });

    // 2. Dynamic Students
    dbStudents.forEach((st) => {
      items.push({
        id: `student-${st.user_id || st.id}`,
        title: st.full_name || "Student",
        subtitle: st.email || (st.student_id ? `ID: ${st.student_id}` : "Student"),
        category: "students",
        icon: Users,
        avatarUrl: st.avatar_url,
        statusBadge: st.status === "suspended" ? "Suspended" : "Student",
        onSelect: () => {
          navigate("/students");
          onClose();
        },
      });
    });

    // 3. Dynamic Lecturers
    dbLecturers.forEach((lec) => {
      items.push({
        id: `lecturer-${lec.user_id || lec.id}`,
        title: lec.full_name || "Faculty Member",
        subtitle: lec.email || lec.department || "Lecturer",
        category: "lecturers",
        icon: GraduationCap,
        avatarUrl: lec.profile_image,
        statusBadge: lec.department || "Faculty",
        onSelect: () => {
          navigate("/lecturers");
          onClose();
        },
      });
    });

    // 4. Dynamic Classes & Courses
    dbClasses.forEach((cls) => {
      items.push({
        id: `class-${cls.id}`,
        title: cls.name || "Class",
        subtitle: cls.course_code ? `Course: ${cls.course_code}` : cls.lecturer_name || "Class",
        category: "academics",
        icon: FolderKanban,
        statusBadge: "Class",
        onSelect: () => {
          navigate("/classes");
          onClose();
        },
      });
    });

    dbCourses.forEach((crs) => {
      items.push({
        id: `course-${crs.id}`,
        title: crs.title || "Course",
        subtitle: crs.code ? `Code: ${crs.code}` : crs.department || "Course",
        category: "academics",
        icon: BookOpen,
        statusBadge: "Course",
        onSelect: () => {
          navigate("/courses");
          onClose();
        },
      });
    });

    // 5. Quick Actions
    if (!q || "broadcast".includes(q) || "announcement".includes(q) || "message".includes(q)) {
      items.push({
        id: "action-broadcast",
        title: "Dispatch New Announcement",
        subtitle: "Send instant broadcast to students or lecturers",
        category: "actions",
        icon: Megaphone,
        statusBadge: "Action",
        onSelect: () => {
          navigate("/announcements");
          onClose();
        },
      });
    }

    if (!q || "theme".includes(q) || "dark".includes(q) || "light".includes(q)) {
      items.push({
        id: "action-theme",
        title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        subtitle: "Toggle display theme appearance",
        category: "actions",
        icon: theme === "dark" ? Sun : Moon,
        statusBadge: "Theme",
        onSelect: () => {
          setTheme(theme === "dark" ? "light" : "dark");
          onClose();
        },
      });
    }

    return items;
  }, [query, dbStudents, dbLecturers, dbClasses, dbCourses, theme, navigate, onClose]);

  // Filter items dynamically by active tab selection
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return allItems;
    if (activeFilter === "users") {
      return allItems.filter((it) => it.category === "students" || it.category === "lecturers");
    }
    if (activeFilter === "academics") {
      return allItems.filter((it) => it.category === "academics");
    }
    if (activeFilter === "pages") {
      return allItems.filter((it) => it.category === "pages" || it.category === "actions");
    }
    return allItems;
  }, [allItems, activeFilter]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border/80 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="p-3.5 sm:p-4 border-b border-border/70 flex items-center gap-3 bg-muted/20">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search students, lecturers, classes, courses, or jump to page..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium placeholder:text-muted-foreground outline-none text-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-muted border border-border rounded-md">
            ESC
          </kbd>
        </div>



        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[480px] divide-y divide-border/20"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <Search className="h-8 w-8 mx-auto text-muted-foreground/40 stroke-1" />
              <p className="font-semibold text-foreground">No matching records found</p>
              <p className="text-[11px]">Try switching filters or typing a different keyword.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.avatarUrl ? (
                      <Avatar className="h-8 w-8 border border-border shrink-0">
                        <AvatarImage src={item.avatarUrl} alt={item.title} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {getInitials(item.title)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0",
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs sm:text-sm font-bold truncate leading-tight">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p
                          className={cn(
                            "text-[11px] truncate leading-tight",
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.statusBadge && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold py-0.5 px-2",
                          isSelected
                            ? "border-primary-foreground/40 text-primary-foreground bg-primary-foreground/10"
                            : "text-muted-foreground border-border"
                        )}
                      >
                        {item.statusBadge}
                      </Badge>
                    )}

                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-primary-foreground opacity-80" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="p-2.5 sm:p-3 border-t border-border/60 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono">↵</kbd>
              Select
            </span>
          </div>

          <span className="hidden sm:inline font-mono text-[10px]">
            {filteredItems.length} items shown
          </span>
        </div>
      </div>
    </div>
  );
};
