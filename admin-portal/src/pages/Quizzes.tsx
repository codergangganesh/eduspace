import React, { useState } from "react";
import { useQuizzes } from "@/hooks/useCourses";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, RefreshCw, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Quizzes: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuizzes({
    search,
    page,
    pageSize: 10,
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Quiz records refreshed successfully!");
    } catch (err) {
      toast.error("Failed to refresh quizzes.");
    } finally {
      setIsRefreshing(false);
    }
  };

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
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 text-xs font-medium bg-card/60 border-border/80 hover:bg-accent min-w-[95px]"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <ExportButton data={quizzes} columns={exportCols} filename="eduspace-quizzes" />
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

      {isLoading && quizzes.length === 0 ? (
        <LoadingState count={6} />
      ) : isError && quizzes.length === 0 ? (
        <ErrorState onRetry={handleRefresh} />
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
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{quiz.title}</p>
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
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(quiz.created_at)}
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
