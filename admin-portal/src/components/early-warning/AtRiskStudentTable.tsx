import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { AtRiskStudent, BulkInterventionPayload, InterventionPayload, RiskLevel } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  BellRing,
  CheckSquare,
  ChevronRight,
  Filter,
  GraduationCap,
  Info,
  Mail,
  PanelRight,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Square,
  User,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiskFactorBreakdown } from "./RiskFactorBreakdown";
import { InterventionDialog } from "./InterventionDialog";
import { BulkInterventionDialog } from "./BulkInterventionDialog";
import { AlertLecturerDialog } from "./AlertLecturerDialog";
import { BulkAlertLecturersDialog } from "./BulkAlertLecturersDialog";
import { cn, getInitials } from "@/lib/utils";

interface AtRiskStudentTableProps {
  students: AtRiskStudent[];
  isLoading?: boolean;
  onSendNudge: (payload: InterventionPayload) => Promise<{ success: boolean; error?: string }>;
  onSendBulkNudge?: (payload: BulkInterventionPayload) => Promise<{ success: boolean; deliveredCount?: number }>;
  onAlertLecturer: (params: {
    student: AtRiskStudent;
    customNote?: string;
    sendEmail?: boolean;
    targetLecturerIds?: string[];
  }) => Promise<{
    success: boolean;
    alertedLecturersCount?: number;
    error?: string;
  }>;
  onBulkAlertLecturers?: (params: {
    students: AtRiskStudent[];
    customNote?: string;
    sendEmail?: boolean;
  }) => Promise<{
    success: boolean;
    alertedLecturersCount?: number;
    affectedStudentsCount?: number;
    error?: string;
  }>;
  isIntervening?: boolean;
}

export const AtRiskStudentTable: React.FC<AtRiskStudentTableProps> = ({
  students,
  isLoading,
  onSendNudge,
  onSendBulkNudge,
  onAlertLecturer,
  onBulkAlertLecturers,
  isIntervening = false,
}) => {
  const [search, setSearch] = useState("");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all_at_risk");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [drawerStudent, setDrawerStudent] = useState<AtRiskStudent | null>(null);
  const [dialogStudent, setDialogStudent] = useState<AtRiskStudent | null>(null);
  const [alertStudent, setAlertStudent] = useState<AtRiskStudent | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkAlertOpen, setIsBulkAlertOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Window width detector for mobile vs desktop drawer orientation
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [students]);

  // Filtered dataset
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Risk tier filter
      if (selectedRiskLevel === "all_at_risk") {
        if (student.riskLevel === "safe") return false;
      } else if (selectedRiskLevel !== "all") {
        if (student.riskLevel !== selectedRiskLevel) return false;
      }

      // Department filter
      if (selectedDepartment !== "all" && student.department !== selectedDepartment) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = student.fullName.toLowerCase().includes(q);
        const matchesEmail = student.email.toLowerCase().includes(q);
        const matchesId = student.studentId.toLowerCase().includes(q);
        const matchesDept = student.department.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesId || matchesDept;
      }

      return true;
    });
  }, [students, selectedRiskLevel, selectedDepartment, search]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page, pageSize]);

  // Multi-select helpers
  const isAllPaginatedSelected = useMemo(() => {
    if (paginatedStudents.length === 0) return false;
    return paginatedStudents.every((s) => selectedStudentIds.has(s.id));
  }, [paginatedStudents, selectedStudentIds]);

  const toggleSelectAllPaginated = () => {
    const next = new Set(selectedStudentIds);
    if (isAllPaginatedSelected) {
      paginatedStudents.forEach((s) => next.delete(s.id));
    } else {
      paginatedStudents.forEach((s) => next.add(s.id));
    }
    setSelectedStudentIds(next);
  };

  const toggleSelectStudent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  const selectAllCritical = () => {
    const next = new Set(selectedStudentIds);
    filteredStudents.filter((s) => s.riskLevel === "critical").forEach((s) => next.add(s.id));
    setSelectedStudentIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedStudentIds);
    filteredStudents.forEach((s) => next.add(s.id));
    setSelectedStudentIds(next);
  };

  const clearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  const selectedStudentsList = useMemo(() => {
    return students.filter((s) => selectedStudentIds.has(s.id));
  }, [students, selectedStudentIds]);

  const handleStudentClick = (student: AtRiskStudent) => {
    setDrawerStudent(student);
  };

  const getRiskBadge = (level: RiskLevel, score: number) => {
    switch (level) {
      case "critical":
        return (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2">
              Critical ({score})
            </Badge>
          </div>
        );
      case "high":
        return (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <Badge className="bg-rose-500/20 text-rose-500 border-rose-500/30 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2">
              High ({score})
            </Badge>
          </div>
        );
      case "moderate":
        return (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2">
              Moderate ({score})
            </Badge>
          </div>
        );
      case "low":
        return (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2">
              Low ({score})
            </Badge>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2">
              Safe ({score})
            </Badge>
          </div>
        );
    }
  };

  const renderDesktopStatusTier = (student: AtRiskStudent) => {
    const level = student.riskLevel;

    switch (level) {
      case "critical":
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap flex-nowrap leading-none bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              Critical Tier
            </span>
          </div>
        );
      case "high":
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap flex-nowrap leading-none bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              High Risk
            </span>
          </div>
        );
      case "moderate":
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap flex-nowrap leading-none bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              Moderate Risk
            </span>
          </div>
        );
      case "low":
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap flex-nowrap leading-none bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              Low Risk
            </span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap flex-nowrap leading-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              Safe Cohort
            </span>
          </div>
        );
    }
  };

  const getScoreProgressBar = (score: number) => {
    let barColor = "bg-emerald-500";
    if (score >= 75) barColor = "bg-red-500";
    else if (score >= 60) barColor = "bg-rose-500";
    else if (score >= 40) barColor = "bg-amber-500";
    else if (score >= 20) barColor = "bg-blue-500";

    return (
      <div className="w-full sm:w-24 bg-muted rounded-full h-1 sm:h-1.5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${Math.max(5, score)}%` }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 bg-card/60 p-2.5 sm:p-4 rounded-xl border border-border/80 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[150px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search student..."
              className="h-8 pl-8 text-xs bg-background/60"
            />
          </div>

          {/* Risk Level Filter */}
          <Select
            value={selectedRiskLevel}
            onValueChange={(val) => {
              setSelectedRiskLevel(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 sm:w-38 text-xs bg-background/60">
              <SelectValue placeholder="Risk Tier" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all_at_risk">All At-Risk</SelectItem>
              <SelectItem value="critical">Critical (75-100)</SelectItem>
              <SelectItem value="high">High (60-74)</SelectItem>
              <SelectItem value="moderate">Moderate (40-59)</SelectItem>
              <SelectItem value="low">Low (20-39)</SelectItem>
              <SelectItem value="safe">Safe (0-19)</SelectItem>
              <SelectItem value="all">All Students</SelectItem>
            </SelectContent>
          </Select>

          {/* Department Filter */}
          {departments.length > 0 && (
            <Select
              value={selectedDepartment}
              onValueChange={(val) => {
                setSelectedDepartment(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-28 sm:w-36 text-xs bg-background/60">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Depts</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Counter Badge */}
        <div className="text-[11px] sm:text-xs font-semibold text-muted-foreground shrink-0 flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" />
            <span>
              <strong className="text-foreground">{filteredStudents.length}</strong> students
            </span>
          </div>
        </div>
      </div>

      {/* FLOATING BATCH ACTION BAR (Responsive Mobile & Desktop) */}
      {selectedStudentIds.size > 0 && (
        <div className="sticky top-2 sm:top-3 z-30 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-blue-600 via-primary to-indigo-600 text-primary-foreground shadow-2xl border border-white/20 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          {/* 1. MOBILE VIEW (Screen < 640px): 2-Row Balanced Card */}
          <div className="flex flex-col gap-2 sm:hidden">
            {/* Top row: Counter + Deselect button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="p-1 rounded-md bg-white/20 text-white shrink-0">
                  <CheckSquare className="size-3.5" />
                </div>
                <span className="text-xs font-bold truncate">
                  {selectedStudentIds.size} Selected
                </span>
                <span className="text-[10px] text-white/75 font-mono">
                  (of {students.length})
                </span>
              </div>

              <button
                type="button"
                onClick={clearSelection}
                className="flex items-center gap-1 text-[11px] font-semibold text-white/90 hover:text-white bg-white/15 active:bg-white/25 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <X className="size-3" />

              </button>
            </div>

            {/* Bottom row: Equal 50/50 Grid Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              {onBulkAlertLecturers && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsBulkAlertOpen(true)}
                  disabled={isIntervening}
                  className="w-full h-8 text-xs font-bold gap-1 bg-white text-primary hover:bg-white/90 active:scale-[0.98] shadow-sm transition-all"
                >
                  <GraduationCap className="size-3.5 shrink-0" />
                  <span className="truncate">Alert Faculty</span>
                </Button>
              )}

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsBulkDialogOpen(true)}
                disabled={isIntervening}
                className={cn(
                  "h-8 text-xs font-bold gap-1 bg-white text-primary hover:bg-white/90 active:scale-[0.98] shadow-sm transition-all",
                  !onBulkAlertLecturers && "col-span-2"
                )}
              >
                <Send className="size-3.5 shrink-0" />
                <span className="truncate">Bulk Nudge ({selectedStudentIds.size})</span>
              </Button>
            </div>
          </div>

          {/* 2. DESKTOP VIEW (Screen >= 640px): Full Horizontal Toolbar */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1 rounded-md bg-white/20 text-white shrink-0">
                <CheckSquare className="size-4" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
                <span>{selectedStudentIds.size} Selected</span>
                <span className="opacity-75 text-[11px]">of {students.length}</span>
              </div>

              {/* Quick Filter Selection Shortcuts */}
              <div className="hidden lg:flex items-center gap-1.5 pl-2.5 border-l border-white/25 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllCritical}
                  className="px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 font-semibold transition-colors cursor-pointer"
                >
                  +All Critical
                </button>
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 font-semibold transition-colors cursor-pointer"
                >
                  +All Filtered ({filteredStudents.length})
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {onBulkAlertLecturers && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsBulkAlertOpen(true)}
                  disabled={isIntervening}
                  className="h-8 text-xs font-bold gap-1.5 bg-white text-primary hover:bg-white/90 shadow-sm"
                >
                  <GraduationCap className="size-3.5" />
                  <span>Alert Assigned Faculty</span>
                </Button>
              )}

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsBulkDialogOpen(true)}
                disabled={isIntervening}
                className="h-8 text-xs font-bold gap-1.5 bg-white text-primary hover:bg-white/90 shadow-sm"
              >
                <Send className="size-3.5" />
                <span>Bulk Nudge ({selectedStudentIds.size})</span>
              </Button>

              <button
                type="button"
                onClick={clearSelection}
                className="p-1 rounded-md hover:bg-white/20 text-white transition-colors cursor-pointer ml-1"
                title="Clear selection"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. DESKTOP VIEW: Table with Multi-Select Checkboxes */}
      <div className="hidden md:block bg-card/60 backdrop-blur-sm rounded-xl border border-border/80 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60 hover:bg-transparent text-xs">
              {/* Select All Checkbox */}
              <TableHead className="w-10 pl-4">
                <input
                  type="checkbox"
                  checked={isAllPaginatedSelected}
                  onChange={toggleSelectAllPaginated}
                  className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer align-middle"
                  title="Select all on this page"
                />
              </TableHead>
              <TableHead className="font-bold text-foreground">Student</TableHead>
              <TableHead className="font-bold text-foreground">Department</TableHead>
              <TableHead className="font-bold text-foreground">Risk Score</TableHead>
              <TableHead className="font-bold text-foreground whitespace-nowrap">Status / Tier</TableHead>
              <TableHead className="font-bold text-foreground">Primary Risk Drivers</TableHead>
              <TableHead className="text-right font-bold text-foreground pr-4">Interventions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell colSpan={7} className="h-14 text-center animate-pulse">
                    <div className="h-4 bg-muted/60 rounded w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  <ShieldAlert className="size-6 mx-auto opacity-30 text-primary mb-1.5" />
                  <p className="font-semibold text-xs text-foreground">No students match current filter.</p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedStudents.map((student) => {
                const isSelected = drawerStudent?.id === student.id;
                const isChecked = selectedStudentIds.has(student.id);
                const criticalFactors = student.factors.filter((f) => f.score >= 30);

                return (
                  <TableRow
                    key={student.id}
                    className={cn(
                      "border-border/50 transition-colors text-xs cursor-pointer group",
                      isChecked ? "bg-primary/15" : isSelected ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/40"
                    )}
                    onClick={() => handleStudentClick(student)}
                  >
                    {/* Row Checkbox */}
                    <TableCell className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectStudent(student.id)}
                        className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer align-middle"
                      />
                    </TableCell>

                    {/* Student Avatar + Name + ID */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 border border-border/80 shrink-0">
                          <AvatarImage src={student.avatarUrl || ""} alt={student.fullName} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {getInitials(student.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {student.fullName}
                            </p>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">
                            {student.email} · {student.studentId}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Department */}
                    <TableCell className="py-3">
                      <span className="text-muted-foreground font-medium truncate block max-w-[130px]">
                        {student.department}
                      </span>
                    </TableCell>

                    {/* Risk Score + Bar */}
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="font-black text-xs text-foreground">{student.riskScore}</span>
                          <span className="text-[9px] text-muted-foreground">/100</span>
                        </div>
                        {getScoreProgressBar(student.riskScore)}
                      </div>
                    </TableCell>

                    {/* Status / Tier Badge (Desktop) */}
                    <TableCell className="py-3.5 whitespace-nowrap">
                      {renderDesktopStatusTier(student)}
                    </TableCell>

                    {/* Risk Factors Badges (Desktop) */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {criticalFactors.length === 0 ? (
                          <span className="text-xs text-emerald-500 font-medium">
                            No major alerts
                          </span>
                        ) : (
                          criticalFactors.map((factor, fIdx) => (
                            <Badge
                              key={fIdx}
                              variant="outline"
                              className={cn(
                                "text-[10px] font-semibold px-2 py-0.5",
                                factor.score >= 60
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              )}
                            >
                              {factor.label} ({factor.metricValue || `${factor.score}%`})
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>

                    {/* 1-Click Action Buttons */}
                    <TableCell className="py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setDialogStudent(student)}
                          disabled={isIntervening}
                          className="h-7 px-2 text-[10px] font-semibold gap-1 shadow-sm shadow-primary/20"
                        >
                          <Send className="size-3" />
                          <span>Nudge</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAlertStudent(student)}
                          disabled={isIntervening || student.enrolledClasses.length === 0}
                          className="h-7 px-2 text-[10px] font-semibold gap-1 bg-background/60 hover:bg-accent"
                          title="Compose retention alert to course faculty"
                        >
                          <GraduationCap className="size-3 text-primary" />
                          <span>Alert</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 2. MOBILE VIEW: Interactive Cards with Multi-Select Checkbox */}
      <div className="block md:hidden space-y-2">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-card/60 border border-border/60 animate-pulse space-y-2">
              <div className="h-3.5 bg-muted/60 rounded w-1/2" />
              <div className="h-2.5 bg-muted/40 rounded w-3/4" />
            </div>
          ))
        ) : paginatedStudents.length === 0 ? (
          <div className="p-6 text-center bg-card/60 rounded-xl border border-border/80 text-muted-foreground text-xs">
            <ShieldAlert className="size-6 mx-auto opacity-30 text-primary mb-1" />
            <p className="font-semibold text-xs text-foreground">No students match filter.</p>
          </div>
        ) : (
          paginatedStudents.map((student) => {
            const criticalFactors = student.factors.filter((f) => f.score >= 30);
            const isChecked = selectedStudentIds.has(student.id);

            return (
              <div
                key={student.id}
                onClick={() => setDrawerStudent(student)}
                className={cn(
                  "p-3 rounded-xl bg-card/70 border border-border/80 shadow-sm active:scale-[0.99] transition-all space-y-2 cursor-pointer hover:border-primary/40",
                  isChecked && "border-primary bg-primary/5 ring-1 ring-primary/30"
                )}
              >
                {/* Top Row: Select Checkbox + Avatar, Name, Risk Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectStudent(student.id)}
                        className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer align-middle"
                      />
                    </div>

                    <Avatar className="size-8 border border-border shrink-0">
                      <AvatarImage src={student.avatarUrl || ""} alt={student.fullName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {getInitials(student.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-foreground truncate leading-tight">{student.fullName}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {student.studentId} · {student.department}
                      </p>
                    </div>
                  </div>
                  {getRiskBadge(student.riskLevel, student.riskScore)}
                </div>

                {/* Risk Progress Bar */}
                <div className="bg-background/50 px-2.5 py-1.5 rounded-md border border-border/40 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Risk Index</span>
                    <span className="font-black text-foreground">{student.riskScore}/100</span>
                  </div>
                  {getScoreProgressBar(student.riskScore)}
                </div>

                {/* Primary Risk Tags */}
                {criticalFactors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {criticalFactors.map((f, fIdx) => (
                      <Badge
                        key={fIdx}
                        variant="outline"
                        className={cn(
                          "text-[9px] font-semibold px-1.5 py-0.2",
                          f.score >= 60
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        )}
                      >
                        {f.label} ({f.metricValue || `${f.score}%`})
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions Row */}
                <div className="pt-1.5 border-t border-border/50 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDrawerStudent(student);
                    }}
                    className="text-[10px] text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer py-0.5 active:scale-95 transition-transform"
                  >
                    <Info className="size-3" />
                    <span>Tap to view details</span>
                  </button>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAlertStudent(student)}
                      disabled={isIntervening || student.enrolledClasses.length === 0}
                      className="h-6 px-2 text-[10px] font-semibold gap-1"
                    >
                      <GraduationCap className="size-3 text-primary" />
                      <span>Alert</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setDialogStudent(student)}
                      disabled={isIntervening}
                      className="h-6 px-2 text-[10px] font-semibold gap-1 shadow-sm shadow-primary/20"
                    >
                      <Send className="size-3" />
                      <span>Nudge</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl border border-border/60 bg-card/60 text-[11px] sm:text-xs">
          <span className="text-muted-foreground">
            Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-7 text-xs px-2"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-7 text-xs px-2"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* 3. RESPONSIVE STUDENT DETAILS DRAWER */}
      <Sheet open={Boolean(drawerStudent)} onOpenChange={(open) => !open && setDrawerStudent(null)}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "bg-card p-0 flex flex-col shadow-2xl overflow-hidden z-50",
            isMobile
              ? "h-[88vh] max-h-[88vh] rounded-t-3xl border-t border-border/80"
              : "w-full sm:max-w-xl md:max-w-2xl border-l border-border/80"
          )}
        >
          {drawerStudent && (
            <>
              {isMobile && (
                <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0" />
              )}

              <SheetHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b border-border/60 shrink-0 bg-muted/20">
                <div className="flex items-center justify-between gap-2.5 w-full pr-8">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-9 sm:size-10 border border-border shrink-0 shadow-sm">
                      <AvatarImage src={drawerStudent.avatarUrl || ""} alt={drawerStudent.fullName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {getInitials(drawerStudent.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <SheetTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                        {drawerStudent.fullName}
                      </SheetTitle>
                      <SheetDescription className="text-[11px] sm:text-xs text-muted-foreground font-mono truncate mt-0.5">
                        {drawerStudent.studentId} · {drawerStudent.department}
                      </SheetDescription>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {getRiskBadge(drawerStudent.riskLevel, drawerStudent.riskScore)}
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                <RiskFactorBreakdown student={drawerStudent} className="p-3 sm:p-4 bg-background/60" />
              </div>

              <SheetFooter className="p-3 sm:p-4 border-t border-border/60 bg-muted/30 flex flex-row items-center justify-end gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const s = drawerStudent;
                    setDrawerStudent(null);
                    setAlertStudent(s);
                  }}
                  disabled={isIntervening || drawerStudent.enrolledClasses.length === 0}
                  className="flex-1 h-8 sm:h-9 text-xs font-semibold gap-1.5"
                >
                  <GraduationCap className="size-3.5 text-primary" />
                  <span>Alert Lecturer</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    const s = drawerStudent;
                    setDrawerStudent(null);
                    setDialogStudent(s);
                  }}
                  disabled={isIntervening}
                  className="flex-1 h-8 sm:h-9 text-xs font-semibold gap-1.5 shadow-md shadow-primary/20"
                >
                  <Send className="size-3.5" />
                  <span>Send Nudge</span>
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 4. SINGLE INTERVENTION DRAWER */}
      <InterventionDialog
        isOpen={Boolean(dialogStudent)}
        onClose={() => setDialogStudent(null)}
        student={dialogStudent}
        onSend={onSendNudge}
        isSending={isIntervening}
      />

      {/* 5. BULK COHORT INTERVENTION DRAWER */}
      {onSendBulkNudge && (
        <BulkInterventionDialog
          isOpen={isBulkDialogOpen}
          onClose={() => setIsBulkDialogOpen(false)}
          selectedStudents={selectedStudentsList}
          onRemoveStudent={(id) => {
            const next = new Set(selectedStudentIds);
            next.delete(id);
            setSelectedStudentIds(next);
            if (next.size === 0) setIsBulkDialogOpen(false);
          }}
          onSendBulk={onSendBulkNudge}
          isSending={isIntervening}
        />
      )}

      {/* 6. SINGLE FACULTY ALERT DRAWER */}
      <AlertLecturerDialog
        isOpen={Boolean(alertStudent)}
        onClose={() => setAlertStudent(null)}
        student={alertStudent}
        onSendAlert={onAlertLecturer}
        isSending={isIntervening}
      />

      {/* 7. BULK COHORT FACULTY ALERT DRAWER */}
      {onBulkAlertLecturers && (
        <BulkAlertLecturersDialog
          isOpen={isBulkAlertOpen}
          onClose={() => setIsBulkAlertOpen(false)}
          selectedStudents={selectedStudentsList}
          onBulkAlert={onBulkAlertLecturers}
          isSending={isIntervening}
        />
      )}
    </div>
  );
};
