import * as React from "react";
import { useState } from "react";
import { useCourses } from "@/hooks/useCourses";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Courses: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useCourses({
    search,
    page,
    pageSize: 10,
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Course catalog refreshed successfully!");
    } catch (err) {
      toast.error("Failed to refresh courses.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const courses = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const exportCols = [
    { header: "Course Title", key: "title", width: 30 },
    { header: "Course Code", key: "course_code", width: 15 },
    { header: "Department", key: "department", width: 20 },
    { header: "Credits", key: "credits", width: 10 },
    { header: "Semester", key: "semester", width: 15 },
    { header: "Created At", key: "created_at", width: 20 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Course Catalog</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
              {total} Courses
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Overview of academic courses, program codes, and semester distributions.
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

          <ExportButton data={courses} columns={exportCols} filename="eduspace-courses" />
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChange={(val: string) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by course title, code (e.g. CS101), or department..."
          className="max-w-md"
        />
      </div>

      {isLoading && courses.length === 0 ? (
        <LoadingState count={6} />
      ) : isError && courses.length === 0 ? (
        <ErrorState onRetry={handleRefresh} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description="No courses matched your search query."
          actionLabel="Clear Search"
          onAction={() => setSearch("")}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono font-bold text-xs text-primary">
                    {course.course_code}
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {course.title}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {course.department || "Academic Department"}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {course.credits ? `${course.credits} Credits` : "N/A"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {course.semester || "Semester 1"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={course.is_active !== false ? "success" : "secondary"}>
                      {course.is_active !== false ? "Active" : "Archived"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(course.created_at)}
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
          onPageChange={(p: number) => setPage(p)}
        />
      )}
    </div>
  );
};
