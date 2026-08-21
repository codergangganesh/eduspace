import React, { useState } from "react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { SearchBar } from "@/components/common/SearchBar";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, RefreshCw, ShieldCheck } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export const AuditLog: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAuditLog({
    search,
    page,
    pageSize: 20,
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const exportCols = [
    { header: "Admin Name", key: "admin_name", width: 25 },
    { header: "Action Taken", key: "action", width: 20 },
    { header: "Target Email", key: "target_email", width: 30 },
    { header: "Details", key: "detailsStr", width: 30 },
    { header: "Timestamp", key: "created_at", width: 25 },
  ];

  const exportData = logs.map((l) => ({
    admin_name: l.admin_name || "Admin",
    action: l.action,
    target_email: l.target_email || "N/A",
    detailsStr: JSON.stringify(l.details || {}),
    created_at: l.created_at,
  }));

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("suspend") || action.includes("delete")) return "destructive";
    if (action.includes("activate") || action.includes("promote")) return "success";
    return "info";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Administrator Audit Trail</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {total} Logged Events
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable log of all administrative actions, suspensions, role modifications, and notices.
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

          <ExportButton data={exportData} columns={exportCols} filename="eduspace_audit_logs" />
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by action name (e.g. suspend, delete) or target email..."
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <LoadingState count={8} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No audit events found"
          description="Administrative actions taken on this portal will be recorded here automatically."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Administrator</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell>
                    <p className="font-semibold text-sm text-foreground">{log.admin_name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{log.admin_email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action) as any} className="capitalize text-xs">
                      {log.action.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {log.target_email || (log.target_user_id ? `ID: ${log.target_user_id.slice(0, 8)}...` : "System-wide")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    <span title={formatDate(log.created_at, "PPP p")}>
                      {formatRelativeTime(log.created_at)}
                    </span>
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
