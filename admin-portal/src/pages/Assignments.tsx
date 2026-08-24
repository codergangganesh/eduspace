import * as React from "react";
import { useState } from "react";
import { useAssignments } from "@/hooks/useCourses";
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
  ClipboardList,
  RefreshCw,
  ChevronRight,
  Calendar,
  Award,
  BookOpen,
  FileText,
  Clock,
  ExternalLink,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Assignments: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

  const { data, isLoading, isError, refetch } = useAssignments({
    search,
    page,
    pageSize: 10,
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Assignment records refreshed successfully!");
    } catch (err) {
      toast.error("Failed to refresh assignments.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const assignments = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const exportCols = [
    { header: "Assignment Title", key: "title", width: 30 },
    { header: "Course / Topic", key: "course_name", width: 25 },
    { header: "Submissions", key: "submissions_count", width: 15 },
    { header: "Max Points", key: "max_points", width: 12 },
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
              Assignments Oversight
            </h1>
            <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 whitespace-nowrap">
              {total} Tasks
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
            Monitor student submissions, assignment deadlines, and maximum points.
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

          <ExportButton data={assignments} columns={exportCols} filename="eduspace-assignments" />
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChange={(val: string) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by assignment title, course name, or topic..."
          className="max-w-md"
        />
      </div>

      {isLoading && assignments.length === 0 ? (
        <LoadingState count={6} />
      ) : isError && assignments.length === 0 ? (
        <ErrorState onRetry={handleRefresh} />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments found"
          description="No coursework matched your search query."
          actionLabel="Clear Search"
          onAction={() => setSearch("")}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Assignment Title</TableHead>
                <TableHead>Course / Topic</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Max Points</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((asg) => (
                <TableRow
                  key={asg.id}
                  onClick={() => setSelectedAssignment(asg)}
                  className="group hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <TableCell>
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {asg.title}
                    </p>
                    {asg.topic && <p className="text-[11px] text-muted-foreground">{asg.topic}</p>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {asg.course_name || "General Coursework"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {asg.submissions_count ?? 0} Submissions
                    </span>
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
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(asg.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAssignment(asg);
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

      {/* ── Assignment Details Right-Side Drawer ───────────────────────────── */}
      <Sheet open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto space-y-6">
          <SheetHeader className="space-y-1.5 text-left items-start pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Coursework Assignment
              </span>
              <Badge variant={selectedAssignment?.status === "active" || !selectedAssignment?.status ? "success" : "secondary"}>
                {selectedAssignment?.status || "Active"}
              </Badge>
            </div>
            <SheetTitle className="text-base sm:text-lg font-bold text-foreground text-left leading-tight break-words">
              {selectedAssignment?.title}
            </SheetTitle>
            <SheetDescription className="text-xs text-left text-muted-foreground">
              Course: <strong className="text-foreground">{selectedAssignment?.course_name || "General Coursework"}</strong>
            </SheetDescription>
          </SheetHeader>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                Total Submissions
              </span>
              <p className="text-xl font-bold text-foreground">
                {selectedAssignment?.submissions_count ?? 0}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                Maximum Score
              </span>
              <p className="text-xl font-bold text-primary">
                {selectedAssignment?.max_points ? `${selectedAssignment.max_points} pts` : "100 pts"}
              </p>
            </div>
          </div>

          {/* Schedule & Due Date Info */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Submission Due Date:
              </span>
              <span className="font-semibold text-foreground">
                {formatDate(selectedAssignment?.due_date)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Created Timestamp:
              </span>
              <span className="text-muted-foreground">
                {formatDate(selectedAssignment?.created_at)}
              </span>
            </div>
          </div>

          {/* Assignment Description / Instructions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Assignment Details & Instructions
            </h4>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {selectedAssignment?.description || selectedAssignment?.topic || "No detailed instructions provided for this assignment."}
            </div>
          </div>

          {/* Attachment resource link if present */}
          {selectedAssignment?.attachment_url && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Assignment Attachment
              </h4>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between">
                <span className="text-xs text-foreground truncate">{selectedAssignment.attachment_name || "Download Resource"}</span>
                <a
                  href={selectedAssignment.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View File
                </a>
              </div>
            </div>
          )}

          <SheetFooter className="pt-4 border-t flex flex-row items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAssignment(null)}
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
