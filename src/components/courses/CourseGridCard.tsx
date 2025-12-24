import { Clock, Users, MoreVertical, Play, BookOpen } from "lucide-react";
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

interface CourseGridCardProps {
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

// Generate gradient based on category
const categoryGradients: Record<string, string> = {
  "Computer Science": "from-blue-500/20 to-blue-600/10",
  "Web Development": "from-purple-500/20 to-purple-600/10",
  Database: "from-green-500/20 to-green-600/10",
  "Artificial Intelligence": "from-orange-500/20 to-orange-600/10",
  "Software Engineering": "from-cyan-500/20 to-cyan-600/10",
  "Mobile Development": "from-pink-500/20 to-pink-600/10",
  Security: "from-red-500/20 to-red-600/10",
};

export function CourseGridCard({ course, userRole }: CourseGridCardProps) {
  const gradient = categoryGradients[course.category] || "from-primary/20 to-primary/5";

  return (
    <Link
      to={`/courses/${course.id}`}
      className="bg-surface rounded-xl border border-border overflow-hidden transition-all hover:shadow-md hover:border-primary/20 group block"
    >
      {/* Course Image/Header */}
      <div className={cn("h-28 bg-gradient-to-br relative overflow-hidden", gradient)}>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:20px_20px]" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={cn("px-2 py-1 rounded-md text-xs font-medium", statusColors[course.status])}>
            {statusLabels[course.status]}
          </span>
        </div>

        {/* Course Code */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-surface/90 text-foreground">
            {course.code}
          </span>
        </div>

        {/* Play/View Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-foreground/10">
          <div className="size-12 rounded-full bg-surface shadow-lg flex items-center justify-center text-primary">
            {course.status === "not-started" ? (
              <BookOpen className="size-5" />
            ) : (
              <Play className="size-5 ml-0.5" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === "student" ? course.instructor : `${course.students} students enrolled`}
          </p>
        </div>

        {/* Progress (for students) */}
        {userRole === "student" && course.status !== "not-started" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-1.5" />
            <span className="text-xs text-muted-foreground">
              {course.completedLessons} of {course.totalLessons} lessons
            </span>
          </div>
        )}

        {/* Lecturer Stats */}
        {userRole === "lecturer" && (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Total Lessons</span>
              <span className="font-medium text-foreground">{course.totalLessons}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Credits</span>
              <span className="font-medium text-foreground">{course.credits}</span>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-3.5" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="size-3.5" />
            <span>{course.students}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
