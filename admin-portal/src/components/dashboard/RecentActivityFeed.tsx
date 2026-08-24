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
        detail: `${c.class_name || "Lecture Room"}${c.course_code ? ` • ${c.course_code}` : ""}`,
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
    (activity?.assignments || []).forEach((asg, i) => {
      rawEvents.push({
        id: `asg-${asg.id || i}`,
        type: "assignment",
        title: "Coursework Assignment Posted",
        detail: `${asg.title || "Assignment"}${asg.max_points ? ` (${asg.max_points} pts)` : ""}`,
        timestamp: asg.created_at || new Date().toISOString(),
        color: "blue",
      });
    });

    // 6. Process Submissions
    (activity?.submissions || []).forEach((sub, i) => {
      rawEvents.push({
        id: `sub-${sub.id || i}`,
        type: "submission",
        title: "Course Assignment Submitted",
        detail: `Submission ID: ${sub.id ? sub.id.slice(0, 8) : i}`,
        timestamp: sub.submitted_at || new Date().toISOString(),
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
      return [];
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
        return <UserPlus className="h-3.5 w-3.5 text-blue-500" />;
      case "submission":
        return <FileCheck className="h-3.5 w-3.5 text-emerald-500" />;
      case "quiz":
        return <Layers className="h-3.5 w-3.5 text-purple-500" />;
      case "class":
        return <FolderKanban className="h-3.5 w-3.5 text-amber-500" />;
      case "course":
        return <BookOpen className="h-3.5 w-3.5 text-purple-500" />;
      case "assignment":
        return <ClipboardList className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-primary" />;
    }
  };

  const getBadgeBg = (color: ActivityEvent["color"]) => {
    switch (color) {
      case "blue":
        return "bg-blue-500/10 border-blue-500/20";
      case "emerald":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "purple":
        return "bg-purple-500/10 border-purple-500/20";
      case "amber":
        return "bg-amber-500/10 border-amber-500/20";
      default:
        return "bg-primary/10 border-primary/20";
    }
  };

  return (
    <Card className="border-border bg-card flex flex-col justify-between overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Live Platform Events
            </CardTitle>
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              Sync
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 pt-2 mt-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "all", label: "All Activity" },
              { id: "users", label: "Users" },
              { id: "assessments", label: "Evaluations" },
              { id: "academics", label: "Courses & Classes" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id)}
              className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all shrink-0 ${
                filter === cat.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {filteredEvents.length > 0 ? (
          <div className="divide-y divide-border/50 overflow-y-auto max-h-[300px]">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 hover:bg-muted/40 transition-colors flex items-start space-x-3 group"
              >
                <div
                  className={`p-2 rounded-xl border mt-0.5 shrink-0 ${getBadgeBg(
                    evt.color
                  )}`}
                >
                  {getEventIcon(evt.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {evt.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 font-mono">
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
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center my-auto">
            <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No recent events recorded in this category.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
