import * as React from "react";
import { useState } from "react";
import { useQuizzes } from "@/hooks/useCourses";
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
  FileCheck,
  RefreshCw,
  ChevronRight,
  Award,
  Percent,
  Calendar,
  Clock,
  HelpCircle,
  CheckCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Quizzes: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-foreground truncate">
              Quizzes & Evaluations
            </h1>
            <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap">
              {total} Quizzes
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
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
          onChange={(val: string) => {
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
          description="No evaluation records matched your search query."
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
                <TableHead>Pass %</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow
                  key={quiz.id}
                  onClick={() => setSelectedQuiz(quiz)}
                  className="group hover:bg-muted/50 transition-colors cursor-pointer"
                >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuiz(quiz);
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

      {/* ── Quiz Details Right-Side Drawer ─────────────────────────────────── */}
      <Sheet open={!!selectedQuiz} onOpenChange={(open) => !open && setSelectedQuiz(null)}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto space-y-6">
          <SheetHeader className="space-y-1.5 text-left items-start pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Evaluation Test
              </span>
              <Badge variant={selectedQuiz?.status === "published" || !selectedQuiz?.status ? "success" : "secondary"}>
                {selectedQuiz?.status || "Published"}
              </Badge>
            </div>
            <SheetTitle className="text-base sm:text-lg font-bold text-foreground text-left leading-tight break-words">
              {selectedQuiz?.title}
            </SheetTitle>
            <SheetDescription className="text-xs text-left text-muted-foreground">
              Online Quiz & Assessment Parameters
            </SheetDescription>
          </SheetHeader>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-emerald-500" />
                Total Marks
              </span>
              <p className="text-xl font-bold text-primary">
                {selectedQuiz?.total_marks || 100} Marks
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Percent className="h-3.5 w-3.5 text-blue-500" />
                Passing Mark
              </span>
              <p className="text-xl font-bold text-foreground">
                {selectedQuiz?.pass_percentage || 40}% Score
              </p>
            </div>
          </div>

          {/* Schedule & Due Date Info */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Due Deadline:
              </span>
              <span className="font-semibold text-foreground">
                {formatDate(selectedQuiz?.due_date)}
              </span>
            </div>

            {selectedQuiz?.time_limit_minutes && (
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  Time Limit:
                </span>
                <span className="font-semibold text-foreground">
                  {selectedQuiz.time_limit_minutes} Minutes
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Created Timestamp:
              </span>
              <span className="text-muted-foreground">
                {formatDate(selectedQuiz?.created_at)}
              </span>
            </div>
          </div>

          {/* Quiz Description / Instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              Quiz Instructions & Overview
            </h4>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {selectedQuiz?.description || "No specific instructions provided for this evaluation."}
            </div>
          </div>

          <SheetFooter className="pt-4 border-t flex flex-row items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedQuiz(null)}
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
