import * as React from "react";
import { AtRiskStudent, RiskFactor } from "@/types";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileQuestion,
  FileX2,
  GraduationCap,
  TrendingDown,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskFactorBreakdownProps {
  student: AtRiskStudent;
  className?: string;
}

export const RiskFactorBreakdown: React.FC<RiskFactorBreakdownProps> = ({
  student,
  className = "",
}) => {
  const getFactorIcon = (type: string) => {
    switch (type) {
      case "missed_assignments":
        return FileX2;
      case "quiz_decline":
        return TrendingDown;
      case "inactivity":
        return Clock;
      case "failed_quizzes":
        return FileQuestion;
      default:
        return AlertCircle;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (score >= 30) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 60) return "bg-rose-500";
    if (score >= 30) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className={cn("p-3.5 sm:p-5 bg-background/60 rounded-xl border border-border/70 space-y-3.5 sm:space-y-5", className)}>
      {/* Student Meta Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs sm:text-sm shrink-0 border border-primary/20">
            {student.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{student.fullName}</h4>
              <span className="text-[10px] sm:text-[11px] font-mono text-muted-foreground">({student.studentId})</span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{student.email} · {student.department}</p>
          </div>
        </div>

        {/* Risk Score Pill */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Risk Score:</span>
          <div
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide border flex items-center gap-1 shadow-sm",
              student.riskLevel === "critical"
                ? "bg-red-500/20 text-red-500 border-red-500/30"
                : student.riskLevel === "high"
                ? "bg-rose-500/20 text-rose-500 border-rose-500/30"
                : student.riskLevel === "moderate"
                ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                : student.riskLevel === "low"
                ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                : "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
            )}
          >
            <span>{student.riskScore}/100</span>
            <span className="uppercase text-[9px] font-bold">({student.riskLevel})</span>
          </div>
        </div>
      </div>

      {/* 4 Algorithmic Factor Gauges */}
      <div>
        <h5 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3 flex items-center gap-1.5">
          <AlertCircle className="size-3 sm:size-3.5 text-primary" />
          Factor Contribution Breakdown
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
          {student.factors.map((factor, idx) => {
            const Icon = getFactorIcon(factor.type);
            const scoreColor = getScoreColor(factor.score);
            const barColor = getProgressBarColor(factor.score);
            const weightedImpact = Math.round(factor.score * factor.weight);

            return (
              <div
                key={idx}
                className="p-2.5 sm:p-3.5 rounded-lg bg-card/80 border border-border/60 hover:border-border transition-all space-y-1.5 sm:space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("p-1 sm:p-1.5 rounded-md border shrink-0", scoreColor)}>
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{factor.label}</p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                        Weight: {Math.round(factor.weight * 100)}% · Impact: +{weightedImpact} pts
                      </p>
                    </div>
                  </div>

                  <span className={cn("text-[11px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-md border shrink-0 font-mono", scoreColor)}>
                    {factor.score}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-secondary/80 rounded-full h-1 sm:h-1.5 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                    style={{ width: `${Math.max(4, factor.score)}%` }}
                  />
                </div>

                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                  {factor.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enrolled Classes & Lecturers Info */}
      {student.enrolledClasses.length > 0 && (
        <div className="pt-2.5 border-t border-border/60">
          <h5 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <BookOpen className="size-3 sm:size-3.5 text-primary" />
            Enrolled Classes & Faculty
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
            {student.enrolledClasses.map((cls, cIdx) => (
              <div
                key={cIdx}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-card/60 border border-border/50 text-[11px] sm:text-xs flex flex-col justify-between"
              >
                <div>
                  <span className="font-semibold text-foreground truncate block">{cls.name}</span>
                  {cls.courseCode && (
                    <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground uppercase">{cls.courseCode}</span>
                  )}
                </div>
                <div className="mt-1 pt-1 border-t border-border/40 flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground">
                  <GraduationCap className="size-3 shrink-0 text-primary" />
                  <span className="truncate">{cls.lecturerName || "Faculty"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
