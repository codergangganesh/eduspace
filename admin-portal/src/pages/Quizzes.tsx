import React, { useState } from "react";
import { useQuizzes } from "@/hooks/useCourses";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const Quizzes: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuizzes({
    search,
    page,
    pageSize: 15,
  });

  const quizzes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const exportCols = [
    { header: "Quiz Title", key: "title", width: 30 },
    { header: "Total Marks", key: "total_marks", width: 12 },
    { header: "Pass %", key: "pass_percentage", width: 12 },
    { header: "Due Date", key: "due_date", width: 20 },
    { header: "Status", key: "status", width: 15 },
    { header: "Created At", key: "created_at", width: 20 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Quizzes & Evaluations</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {total} Quizzes
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Published online tests, passing percentages, and total assessment marks.
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

          <ExportButton data={quizzes} columns={exportCols} filename="eduspace_quizzes" />
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by quiz title..."
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <LoadingState count={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No quizzes found"
          description="No published quizzes matched your search query."
          actionLabel="Clear Search"
          onAction={() => setSearch("")}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Quiz Title</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Passing Criteria</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id} className="hover:bg-muted/50">
                  <TableCell>
                    <p className="font-semibold text-sm text-foreground">{quiz.title}</p>
                    {quiz.description && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                        {quiz.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-primary">
                    {quiz.total_marks || 100} Marks
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {quiz.pass_percentage || 40}% to pass
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(quiz.due_date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={quiz.status === "published" || !quiz.status ? "success" : "secondary"}>
                      {quiz.status || "Published"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(quiz.created_at)}
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
