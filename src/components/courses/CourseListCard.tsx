import { Clock, Users, Calendar, BookOpen, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  code: string;
  instructor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  duration: string;
  students: number;
  category: string;
  status: "in-progress" | "completed" | "not-started";
  semester: string;
  credits: number;
  schedule: string;
}

interface CourseListCardProps {
  course: Course;
  userRole: "student" | "lecturer";
}

const statusColors = {
  "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "not-started": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const statusLabels = {
  "in-progress": "In Progress",
  completed: "Completed",
  "not-started": "Not Started",
};

export function CourseListCard({ course, userRole }: CourseListCardProps) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="bg-surface rounded-xl border border-border p-4 transition-all hover:shadow-md hover:border-primary/20 group flex flex-col sm:flex-row gap-4"
    >
      {/* Left: Course Icon */}
      <div className="size-16 sm:size-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <BookOpen className="size-8 sm:size-10 text-primary" />
      </div>

      {/* Middle: Course Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                {course.code}
              </span>
              <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColors[course.status])}>
                {statusLabels[course.status]}
              </span>
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mt-1 line-clamp-1">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {userRole === "student" ? course.instructor : `${course.semester} • ${course.credits} Credits`}
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 hidden sm:block" />
        </div>

        {/* Progress Bar (Students) */}
        {userRole === "student" && course.status !== "not-started" && (
          <div className="flex items-center gap-3">
            <Progress value={course.progress} className="h-1.5 flex-1 max-w-xs" />
            <span className="text-xs font-medium text-foreground whitespace-nowrap">
              {course.progress}% complete
            </span>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            <span>{course.totalLessons} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3.5" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="size-3.5" />
            <span>{course.students} students</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            <span>{course.schedule}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
