import * as React from "react";
import { useState } from "react";
import { useClasses } from "@/hooks/useCourses";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  FolderKanban,
  RefreshCw,
  ChevronRight,
  User,
  Building2,
  Calendar,
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Classes: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useClasses({
    search,
    page,
    pageSize: 10,
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      toast.error("Failed to refresh classrooms.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const classes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const exportCols = [
    { header: "Class Name", key: "class_name", width: 25 },
    { header: "Course Code", key: "course_code", width: 15 },
    { header: "Instructor", key: "lecturer_name", width: 20 },
    { header: "Department", key: "lecturer_department", width: 20 },
    { header: "Enrolled", key: "student_count", width: 15 },
    { header: "Academic Year", key: "academic_year", width: 15 },
    { header: "Semester", key: "semester", width: 15 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-foreground truncate">
              Active Classrooms
            </h1>
            <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 whitespace-nowrap">
              {total} Classes
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
            Monitor lecture sections, course codes, enrolled students, and assigned faculty instructors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 text-xs font-medium bg-card/60 border-border/80 hover:bg-accent min-w-[95px]"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <ExportButton data={classes} columns={exportCols} filename="eduspace-classes" />
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChange={(val: string) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by class name, course code, instructor, or department..."
          className="max-w-md"
        />
      </div>

      {isLoading && classes.length === 0 ? (
        <LoadingState count={6} />
      ) : isError && classes.length === 0 ? (
        <ErrorState onRetry={handleRefresh} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No classes found"
          description="No classrooms matched your search query."
          actionLabel="Clear Search"
          onAction={() => setSearch("")}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Course Code</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className="group hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <TableCell className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {cls.class_name || "Section Class"}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-xs text-primary">
                    {cls.course_code}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {cls.lecturer_name || "Faculty Member"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {cls.lecturer_department || "Department"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {cls.student_count ?? 0} Students
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {cls.academic_year || "2026"} (Sem {cls.semester || "1"})
                  </TableCell>
                  <TableCell>
                    <Badge variant={cls.is_active !== false ? "success" : "secondary"}>
                      {cls.is_active !== false ? "Active" : "Completed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(cls.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClass(cls);
                      }}
                      className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1 rounded-lg transition-all"
                    >
                      <span className="hidden sm:inline">Details</span>
                      <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={total}
          pageSize={10}
          onPageChange={(p: number) => setPage(p)}
        />
      )}

      {/* ── Class Details Right-Side Drawer ─────────────────────────────────── */}
      <Sheet open={!!selectedClass} onOpenChange={(open) => !open && setSelectedClass(null)}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto space-y-6">
          <SheetHeader className="space-y-1.5 text-left items-start pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Classroom Section
              </span>
              <Badge variant={selectedClass?.is_active !== false ? "success" : "secondary"}>
                {selectedClass?.is_active !== false ? "Active" : "Inactive"}
              </Badge>
            </div>
            <SheetTitle className="text-base sm:text-lg font-bold text-foreground text-left leading-tight break-words">
              {selectedClass?.class_name || "Section Class"}
            </SheetTitle>
            <SheetDescription className="text-xs text-left text-muted-foreground">
              Course Code: <strong className="font-mono text-primary">{selectedClass?.course_code}</strong>
            </SheetDescription>
          </SheetHeader>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-amber-500" />
                Enrolled Students
              </span>
              <p className="text-xl font-bold text-foreground">
                {selectedClass?.student_count ?? 0}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Term & Semester
              </span>
              <p className="text-sm font-bold text-foreground">
                {selectedClass?.academic_year || "2026"} • Sem {selectedClass?.semester || "1"}
              </p>
            </div>
          </div>

          {/* Instructor & Faculty Member Card */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Assigned Instructor
            </h4>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {selectedClass?.lecturer_name || "Faculty Member"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedClass?.lecturer_email || "Email Not Provided"}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Department:
                </span>
                <span className="font-semibold text-foreground">
                  {selectedClass?.lecturer_department || "General Academic"}
                </span>
              </div>
            </div>
          </div>

          {/* Class Information & Identifiers */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Course & Identification
            </h4>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Course Code:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-primary">{selectedClass?.course_code}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(selectedClass?.course_code || "", "Course Code")}
                  >
                    {copiedField === "Course Code" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Classroom ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-muted-foreground">{selectedClass?.id?.slice(0, 16)}...</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(selectedClass?.id || "", "Classroom ID")}
                  >
                    {copiedField === "Classroom ID" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Created At:
                </span>
                <span className="text-foreground">{formatDate(selectedClass?.created_at)}</span>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t flex flex-row items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedClass(null)}
              className="text-xs"
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
