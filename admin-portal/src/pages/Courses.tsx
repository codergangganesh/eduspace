import React, { useState } from "react";
import { useCourses } from "@/hooks/useCourses";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const Courses: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useCourses({
    search,
    page,
    pageSize: 15,
  });

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
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
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
            onClick={() => refetch()}
            className="h-9 text-xs font-medium bg-card/60 border-border/80 hover:bg-accent"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>

          <ExportButton data={courses} columns={exportCols} filename="eduspace_courses" />
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by course title, code (e.g. CS101), or department..."
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <LoadingState count={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
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
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono font-bold text-xs text-primary">
                    {course.course_code}
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-foreground">
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
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(course.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="px-4 pb-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={total}
              pageSize={15}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
