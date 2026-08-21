import React, { useState } from "react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Radio } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export const ActivityPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useActivityLogs({
    page,
    pageSize: 20,
  });

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
            onClick={() => refetch()}
            className="h-9 text-xs font-medium bg-card/60 border-border/80 hover:bg-accent"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>

          <ExportButton data={exportData} columns={exportCols} filename="eduspace_activity_log" />
        </div>
      </div>

      {isLoading ? (
        <LoadingState count={8} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
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
                <TableHead className="text-right">Recorded Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell>
                    <p className="font-semibold text-sm text-foreground">
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
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatRelativeTime(log.created_at)}
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
              pageSize={20}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
