import React, { useState } from "react";
import { useClasses } from "@/hooks/useCourses";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, RefreshCw, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Classes: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      toast.success("Classroom records refreshed successfully!");
    } catch (err) {
      toast.error("Failed to refresh classrooms.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const classes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const exportCols = [
    { header: "Class Name", key: "class_name", width: 25 },
    { header: "Course Code", key: "course_code", width: 15 },
    { header: "Instructor", key: "lecturer_name", width: 20 },
    { header: "Department", key: "lecturer_department", width: 20 },
    { header: "Academic Year", key: "academic_year", width: 15 },
    { header: "Semester", key: "semester", width: 15 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Active Classrooms</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {total} Classes
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor lecture sections, course codes, and assigned faculty instructors.
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
          onChange={(val) => {
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
                <TableHead>Academic Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id} className="group hover:bg-muted/50 transition-colors">
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
                      className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1 rounded-lg transition-all"
                    >
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
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
};
