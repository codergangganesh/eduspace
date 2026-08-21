import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import {
  FileCheck,
  BookOpen,
  UserPlus,
  Clock,
  Layers,
  FolderKanban,
  ClipboardList,
  RefreshCw,
} from "lucide-react";

interface RecentActivityFeedProps {
  activity?: {
    submissions?: any[];
    quizzes?: any[];
    newUsers?: any[];
    classes?: any[];
    courses?: any[];
    assignments?: any[];
    announcements?: any[];
    auditLogs?: any[];
  };
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface ActivityEvent {
  id: string;
  type: "user" | "submission" | "quiz" | "class" | "course" | "assignment" | "announcement" | "audit";
  title: string;
  detail: string;
  timestamp: string;
  color: "blue" | "emerald" | "purple" | "amber";
}

const DEFAULT_EVENTS: ActivityEvent[] = [
  {
    id: "evt-1",
    type: "user",
    title: "Student Profile Registered",
    detail: "Mannam Ganeshbabu - B.Tech Computer Science",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    color: "blue",
  },
  {
    id: "evt-2",
    type: "submission",
    title: "Course Assignment Submitted",
    detail: "Data Structures & Algorithms - Lab Task 2",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    color: "emerald",
  },
  {
    id: "evt-3",
    type: "quiz",
    title: "Quiz Assessment Published",
    detail: "Operating Systems & Concurrency Quiz",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    color: "purple",
  },
  {
    id: "evt-4",
    type: "user",
    title: "Faculty Member Enrolled",
    detail: "Dr. Sarah Jenkins - Department of CS",
    timestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
    color: "emerald",
  },
  {
    id: "evt-5",
    type: "class",
    title: "Lecture Classroom Initialized",
    detail: "Distributed Systems & Cloud Room #302",
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    color: "amber",
  },
  {
    id: "evt-6",
    type: "course",
    title: "Course Curriculum Published",
    detail: "Full Stack Web Development & Microservices",
    timestamp: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    color: "purple",
  },
];

type EventCategoryFilter = "all" | "users" | "assessments" | "academics";

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activity,
  onRefresh,
  isRefreshing = false,
}) => {
  const [filter, setFilter] = useState<EventCategoryFilter>("all");

  const events: ActivityEvent[] = useMemo(() => {
    const rawEvents: ActivityEvent[] = [];

    // 1. Process New Users (Students, Lecturers, Profiles)
    (activity?.newUsers || []).forEach((u, i) => {
      const isLecturer = u.userType === "lecturer" || Boolean(u.department && !u.student_name);
      const roleLabel = isLecturer ? "Faculty Member" : "Student Profile";
      rawEvents.push({
        id: `user-${u.id || u.user_id || i}`,
        type: "user",
        title: `${roleLabel} Registered`,
        detail: `${u.full_name || u.student_name || u.email || "User Account"}${u.department ? ` (${u.department})` : ""}`,
        timestamp: u.created_at || new Date().toISOString(),
        color: isLecturer ? "emerald" : "blue",
      });
    });

    // 2. Process Courses
    (activity?.courses || []).forEach((c, i) => {
      rawEvents.push({
        id: `course-${c.id || i}`,
        type: "course",
        title: "Course Curriculum Published",
        detail: `${c.course_name || c.title || "Academic Course"}${c.code ? ` • Code: ${c.code}` : ""}`,
        timestamp: c.created_at || new Date().toISOString(),
        color: "purple",
      });
    });

    // 3. Process Classes
    (activity?.classes || []).forEach((c, i) => {
      rawEvents.push({
        id: `class-${c.id || i}`,
        type: "class",
        title: "Classroom Room Initialized",
        detail: `${c.class_name || "Lecture Room"}${c.class_code ? ` • ${c.class_code}` : ""}`,
        timestamp: c.created_at || new Date().toISOString(),
        color: "amber",
      });
    });

    // 4. Process Quizzes
    (activity?.quizzes || []).forEach((q, i) => {
      rawEvents.push({
        id: `quiz-${q.id || i}`,
        type: "quiz",
        title: "Quiz Evaluation Published",
        detail: q.title || "Academic Evaluation",
        timestamp: q.created_at || new Date().toISOString(),
        color: "purple",
      });
    });

    // 5. Process Assignments
    (activity?.assignments || []).forEach((a, i) => {
      rawEvents.push({
        id: `asg-${a.id || i}`,
        type: "assignment",
        title: "Coursework Task Assigned",
        detail: `${a.title || "Assignment Task"}${a.max_points ? ` • ${a.max_points} pts` : ""}`,
        timestamp: a.created_at || new Date().toISOString(),
        color: "blue",
      });
    });

    // 6. Process Submissions
    (activity?.submissions || []).forEach((s, i) => {
      rawEvents.push({
        id: `sub-${s.id || i}`,
        type: "submission",
        title: "Assignment Submitted",
        detail: `Submission ID: ${(s.id || "").slice(0, 8)}`,
        timestamp: s.submitted_at || new Date().toISOString(),
        color: "emerald",
      });
    });

    // 7. Process Announcements
    (activity?.announcements || []).forEach((an, i) => {
      rawEvents.push({
        id: `ann-${an.id || i}`,
        type: "announcement",
        title: "Campus Announcement Broadcast",
        detail: an.title || "System Notice",
        timestamp: an.created_at || new Date().toISOString(),
        color: "amber",
      });
    });

    // 8. Process Audit Logs
    (activity?.auditLogs || []).forEach((al, i) => {
      rawEvents.push({
        id: `audit-${al.id || i}`,
        type: "audit",
        title: "Admin System Action",
        detail: `${al.action || "System Event"}${al.target_email ? ` (${al.target_email})` : ""}`,
        timestamp: al.created_at || new Date().toISOString(),
        color: "emerald",
      });
    });

    if (rawEvents.length === 0) {
      return DEFAULT_EVENTS;
    }

    // Sort chronologically descending
    return rawEvents.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [activity]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "users") return events.filter((e) => e.type === "user");
    if (filter === "assessments") return events.filter((e) => e.type === "quiz" || e.type === "submission");
    if (filter === "academics") return events.filter((e) => e.type === "class" || e.type === "course" || e.type === "assignment" || e.type === "announcement");
    return events;
  }, [events, filter]);

  const getEventIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "user":
        return <UserPlus className="h-3.5 w-3.5" />;
      case "submission":
        return <FileCheck className="h-3.5 w-3.5" />;
      case "quiz":
        return <BookOpen className="h-3.5 w-3.5" />;
      case "class":
        return <FolderKanban className="h-3.5 w-3.5" />;
      case "course":
        return <BookOpen className="h-3.5 w-3.5" />;
      case "assignment":
        return <ClipboardList className="h-3.5 w-3.5" />;
      default:
        return <Layers className="h-3.5 w-3.5" />;
    }
  };

  const getBadgeColors = (color: ActivityEvent["color"]) => {
    switch (color) {
      case "blue":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "emerald":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "purple":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "amber":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <Card className="border-border/80 shadow-sm bg-card h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Recent Platform Events
              </CardTitle>
              <div className="flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Real-Time
              </div>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Live stream of student and faculty interactions with inline scroll
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-sm">
              {events.length} Live Events
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh live activity feed"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 pt-2 mt-1 border-t border-border/60">
          <button
            onClick={() => setFilter("all")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              filter === "all"
                ? "bg-primary/15 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter("users")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              filter === "users"
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setFilter("assessments")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              filter === "assessments"
                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Assessments
          </button>
          <button
            onClick={() => setFilter("academics")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              filter === "academics"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Academics
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 pt-0 pb-4">
        <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start space-x-3 text-xs p-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-all group"
            >
              <div className={`p-2 rounded-xl border ${getBadgeColors(evt.color)} mt-0.5 shrink-0 shadow-sm`}>
                {getEventIcon(evt.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-semibold text-foreground truncate">{evt.title}</p>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {formatRelativeTime(evt.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {evt.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

