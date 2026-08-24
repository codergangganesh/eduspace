import * as React from "react";
import { useState } from "react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Activity,
  RefreshCw,
  Radio,
  ChevronRight,
  User,
  Mail,
  Calendar,
  Clock,
  Zap,
  Shield,
  Copy,
  Check,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

export const ActivityPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-foreground truncate">
              Live Activity Stream
            </h1>
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap">
              <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
              Live Feed
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
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
                <TableRow
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="group hover:bg-muted/50 transition-colors cursor-pointer"
                >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
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

      {/* ── Live Activity Details Right-Side Drawer ─────────────────────────── */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto space-y-6">
          <SheetHeader className="space-y-1.5 text-left items-start pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
                Live Event
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedLog?.created_at ? formatRelativeTime(selectedLog.created_at) : ""}
              </span>
            </div>
            <SheetTitle className="text-base sm:text-lg font-bold text-foreground text-left leading-tight break-words">
              User Activity Event
            </SheetTitle>
            <SheetDescription className="text-xs text-left text-muted-foreground">
              Daily Streak & Platform Session Verification
            </SheetDescription>
          </SheetHeader>

          {/* User Profile Overview Card */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              User Information
            </h4>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {selectedLog?.user?.full_name || "Active Student"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" />
                    {selectedLog?.user?.email || "Email Not Provided"}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Zap className="h-5 w-5" />
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">User ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-muted-foreground">{selectedLog?.user_id?.slice(0, 16)}...</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(selectedLog?.user_id || "", "User ID")}
                  >
                    {copiedField === "User ID" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Event & Interaction Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Event Telemetry
            </h4>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Action Type:</span>
                <span className="font-semibold text-foreground">Session Interaction</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Recorded Action Date:
                </span>
                <span className="font-mono font-medium text-foreground">
                  {formatDate(selectedLog?.action_date)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Exact Timestamp:
                </span>
                <span className="text-muted-foreground">
                  {formatDate(selectedLog?.created_at)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-muted-foreground">Record ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-muted-foreground">{selectedLog?.id?.slice(0, 16)}...</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(selectedLog?.id || "", "Log ID")}
                  >
                    {copiedField === "Log ID" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t flex flex-row items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLog(null)}
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
