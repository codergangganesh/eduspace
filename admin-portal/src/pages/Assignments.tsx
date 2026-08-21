import React, { useState } from "react";
import { useAssignments } from "@/hooks/useCourses";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const Assignments: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAssignments({
    search,
    page,
    pageSize: 15,
  });

  const assignments = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const exportCols = [
    { header: "Assignment Title", key: "title", width: 30 },
    { header: "Course / Topic", key: "course_name", width: 25 },
    { header: "Max Points", key: "max_points", width: 12 },
    { header: "Due Date", key: "due_date", width: 20 },
    { header: "Status", key: "status", width: 15 },
    { header: "Created At", key: "created_at", width: 20 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Assignments Oversight</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {total} Tasks
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor student submissions, assignment deadlines, and maximum points.
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

          <ExportButton data={assignments} columns={exportCols} filename="eduspace_assignments" />
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by assignment title, course name, or topic..."
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <LoadingState count={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments found"
          description="No assignments matched your search query."
          actionLabel="Clear Search"
          onAction={() => setSearch("")}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Assignment Title</TableHead>
                <TableHead>Course / Subject</TableHead>
                <TableHead>Max Points</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((asg) => (
                <TableRow key={asg.id} className="hover:bg-muted/50">
                  <TableCell>
                    <p className="font-semibold text-sm text-foreground">{asg.title}</p>
                    {asg.topic && <p className="text-[11px] text-muted-foreground">{asg.topic}</p>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {asg.course_name || "General Coursework"}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-primary">
                    {asg.max_points ? `${asg.max_points} pts` : "100 pts"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(asg.due_date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={asg.status === "active" || !asg.status ? "success" : "secondary"}>
                      {asg.status || "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(asg.created_at)}
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
