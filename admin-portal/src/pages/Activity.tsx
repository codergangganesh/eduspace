import React, { useState } from "react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Radio, ChevronRight } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

export const ActivityPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useActivityLogs({
    page,
    pageSize: 10,
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Activity stream refreshed successfully!");
    } catch (err) {
      toast.error("Failed to refresh activity stream.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const exportCols = [
    { header: "User Name", key: "userName", width: 25 },
    { header: "User Email", key: "userEmail", width: 30 },
    { header: "Action Date", key: "action_date", width: 20 },
    { header: "Timestamp", key: "created_at", width: 25 },
  ];

  const exportData = logs.map((l: any) => ({
    userName: l.user?.full_name || "Unknown User",
    userEmail: l.user?.email || "N/A",
    action_date: l.action_date,
    created_at: l.created_at,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Live Activity Stream</h1>
            <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
              Live Feed
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time platform access events and user daily streak interactions.
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

          <ExportButton data={exportData} columns={exportCols} filename="eduspace-activity" />
        </div>
      </div>

      {isLoading && logs.length === 0 ? (
        <LoadingState count={8} />
      ) : isError && logs.length === 0 ? (
        <ErrorState onRetry={handleRefresh} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity recorded"
          description="Platform activity records will appear here as users engage."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action Type</TableHead>
                <TableHead>Activity Date</TableHead>
                <TableHead>Recorded Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {log.user?.full_name || "Active Student / User"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {log.user?.email || `User ID: ${log.user_id?.slice(0, 8)}...`}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Platform Session Interaction
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-foreground">
                    {formatDate(log.action_date)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatRelativeTime(log.created_at)}
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
