import { Clock, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CourseCardProps {
  title: string;
  instructor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  duration: string;
  students: number;
  image?: string;
}

export function CourseCard({
  title,
  instructor,
  progress,
  totalLessons,
  completedLessons,
  duration,
  students,
}: CourseCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden transition-all hover:shadow-md group cursor-pointer">
      {/* Course Image */}
      <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:20px_20px]" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{instructor}</p>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <span className="text-xs text-muted-foreground">
            {completedLessons} of {totalLessons} lessons completed
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-3.5" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="size-3.5" />
            <span>{students} students</span>
          </div>
        </div>
      </div>
    </div>
  );
}
