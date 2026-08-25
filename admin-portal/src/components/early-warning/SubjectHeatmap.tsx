import * as React from "react";
import { useState, useMemo } from "react";
import { SubjectPerformance } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubjectHeatmapProps {
  data: SubjectPerformance[];
  isLoading?: boolean;
}

export const SubjectHeatmap: React.FC<SubjectHeatmapProps> = ({ data, isLoading }) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"passRate" | "avgScore" | "submissionRate" | "students">("passRate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Critical classes count
  const criticalClasses = useMemo(() => {
    return data.filter((d) => d.isAtRisk || d.passRate < 50);
  }, [data]);

  // Filtered and sorted classes
  const filteredData = useMemo(() => {
    let list = data.filter((item) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        item.className.toLowerCase().includes(q) ||
        item.courseCode.toLowerCase().includes(q) ||
        (item.lecturerName && item.lecturerName.toLowerCase().includes(q))
      );
    });

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === "passRate") {
        valA = a.passRate;
        valB = b.passRate;
      } else if (sortBy === "avgScore") {
        valA = a.avgScore;
        valB = b.avgScore;
      } else if (sortBy === "submissionRate") {
        valA = a.submissionRate;
        valB = b.submissionRate;
      } else if (sortBy === "students") {
        valA = a.totalStudents;
        valB = b.totalStudents;
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [data, search, sortBy, sortOrder]);

  const getHeatmapColor = (passRate: number) => {
    if (passRate < 50) {
      return {
        bg: "bg-rose-500/10 dark:bg-rose-950/20",
        border: "border-rose-500/30 hover:border-rose-500/60",
        badge: "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
        accent: "text-rose-600 dark:text-rose-400",
        bar: "bg-rose-500",
        glow: "from-rose-500/10 to-transparent",
      };
    }
    if (passRate < 70) {
      return {
        bg: "bg-amber-500/10 dark:bg-amber-950/20",
        border: "border-amber-500/30 hover:border-amber-500/60",
        badge: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
        accent: "text-amber-600 dark:text-amber-400",
        bar: "bg-amber-500",
        glow: "from-amber-500/10 to-transparent",
      };
    }
    if (passRate < 85) {
      return {
        bg: "bg-blue-500/10 dark:bg-blue-950/20",
        border: "border-blue-500/30 hover:border-blue-500/60",
        badge: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
        accent: "text-blue-600 dark:text-blue-400",
        bar: "bg-blue-500",
        glow: "from-blue-500/10 to-transparent",
      };
    }
    return {
      bg: "bg-emerald-500/10 dark:bg-emerald-950/20",
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      badge: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      accent: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-500",
      glow: "from-emerald-500/10 to-transparent",
    };
  };

  const handleSortToggle = (col: "passRate" | "avgScore" | "submissionRate" | "students") => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
  };

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardHeader className="p-3.5 sm:p-5 pb-3 sm:pb-4 border-b border-border/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 sm:p-1.5 rounded-lg bg-primary/15 text-primary border border-primary/20 shrink-0">
                <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                Subject Performance Heatmap
              </CardTitle>
            </div>
            <CardDescription className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">
              Cross-course pass rate analytics, submission tracking, and curriculum bottleneck detection.
            </CardDescription>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px] sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter subjects..."
                className="h-8 pl-8 text-xs bg-background/60"
              />
            </div>

            <div className="flex items-center gap-1 bg-background/60 p-0.5 rounded-lg border border-border/80 text-xs">
              <button
                onClick={() => handleSortToggle("passRate")}
                className={cn(
                  "px-2 py-1 rounded text-[10px] sm:text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1",
                  sortBy === "passRate"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Pass Rate {sortBy === "passRate" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
              <button
                onClick={() => handleSortToggle("avgScore")}
                className={cn(
                  "px-2 py-1 rounded text-[10px] sm:text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1",
                  sortBy === "avgScore"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Score {sortBy === "avgScore" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            </div>
          </div>
        </div>

        {/* Bottleneck Warning Banner */}
        {criticalClasses.length > 0 && (
          <div className="mt-2.5 sm:mt-3 p-2.5 sm:p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="size-3.5 sm:size-4 text-rose-500 shrink-0 animate-pulse" />
              <p className="text-rose-700 dark:text-rose-300 font-medium truncate text-[11px] sm:text-xs">
                <span className="font-bold">{criticalClasses.length} course{criticalClasses.length > 1 ? "s" : ""}</span> below 50% pass threshold.
              </p>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
              Alert
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3.5 sm:p-5">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 sm:h-36 rounded-xl bg-card/40 border border-border/50 animate-pulse p-4" />
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-8 sm:py-12 text-center text-muted-foreground text-xs space-y-1.5">
            <BookOpen className="size-6 sm:size-8 mx-auto opacity-40 text-primary" />
            <p className="font-semibold text-xs sm:text-sm text-foreground">No course performance records.</p>
            <p className="text-[11px]">Enrolled courses will automatically appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
            {filteredData.map((item) => {
              const theme = getHeatmapColor(item.passRate);
              return (
                <div
                  key={item.classId}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all duration-200 hover:shadow-md group flex flex-col justify-between",
                    theme.bg,
                    theme.border
                  )}
                >
                  <div className="space-y-2 relative z-10">
                    {/* Header: Course Code & Pass Rate Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                          {item.courseCode || "GEN-101"}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-foreground truncate leading-snug">
                          {item.className}
                        </h4>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] sm:text-[10px] font-black tracking-wide shrink-0",
                          theme.badge
                        )}
                      >
                        {item.passRate}%
                      </Badge>
                    </div>

                    {/* Faculty Attribution */}
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
                      <GraduationCap className="size-3 sm:size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{item.lecturerName}</span>
                    </div>

                    {/* Pass Rate Progress Bar */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                        <span>Cohort Pass</span>
                        <span className={cn("font-bold", theme.accent)}>{item.passRate}%</span>
                      </div>
                      <div className="w-full bg-background/80 rounded-full h-1 sm:h-1.5 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", theme.bar)}
                          style={{ width: `${Math.max(5, item.passRate)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Metrics Grid */}
                  <div className="mt-3 pt-2 border-t border-border/50 grid grid-cols-3 gap-1.5 text-center relative z-10">
                    <div className="bg-background/40 p-1 sm:p-1.5 rounded-md border border-border/40">
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase block font-semibold">Avg</span>
                      <span className="text-[11px] sm:text-xs font-black text-foreground">{item.avgScore}%</span>
                    </div>
                    <div className="bg-background/40 p-1 sm:p-1.5 rounded-md border border-border/40">
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase block font-semibold">Submit</span>
                      <span className="text-[11px] sm:text-xs font-black text-foreground">{item.submissionRate}%</span>
                    </div>
                    <div className="bg-background/40 p-1 sm:p-1.5 rounded-md border border-border/40">
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase block font-semibold">Students</span>
                      <span className="text-[11px] sm:text-xs font-black text-foreground">{item.totalStudents}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
