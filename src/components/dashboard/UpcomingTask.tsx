import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingTaskProps {
  title: string;
  course: string;
  dueDate: string;
  dueTime: string;
  type: "assignment" | "quiz" | "exam" | "project" | "lecture" | "lab" | "tutorial";
  isUrgent?: boolean;
}

const typeStyles = {
  assignment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  quiz: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  exam: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  project: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  lecture: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  lab: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  tutorial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export function UpcomingTask({ title, course, dueDate, dueTime, type, isUrgent }: UpcomingTaskProps) {
  return (
    <div className={cn(
      "flex items-start gap-4 p-4 rounded-lg border",
      isUrgent ? "border-destructive/50 bg-destructive/5" : "border-border bg-surface"
    )}>
      <div className={cn("px-2.5 py-1 rounded-md text-xs font-medium capitalize", typeStyles[type])}>
        {type}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{title}</h4>
        <p className="text-sm text-muted-foreground">{course}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            <span>{dueDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3.5" />
            <span>{dueTime}</span>
          </div>
        </div>
      </div>
      {isUrgent && (
        <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-md">
          Due Soon
        </span>
      )}
    </div>
  );
}
