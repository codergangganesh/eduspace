import * as React from "react";
import { useState } from "react";
import { useAuditLog } from "@/hooks/useAuditLog";
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
  History,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Shield,
  User,
  Clock,
  FileCode,
  Copy,
  Check,
  Target,
  Lock,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

export const AuditLog: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAuditLog({
    search,
    page,
    pageSize: 10,
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Audit trail refreshed successfully!");
    } catch (err) {
      toast.error("Failed to refresh audit trail.");
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
    const act = (action || "").toLowerCase();
    if (act.includes("suspend") || act.includes("delete") || act.includes("lockout") || act.includes("removed") || act.includes("tamper")) return "destructive";
    if (act.includes("activate") || act.includes("promote") || act.includes("set_maintenance") || act.includes("configured") || act.includes("enrolled") || act.includes("unlocked")) return "success";
    if (act.includes("reset") || act.includes("locked")) return "warning";
    return "info";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-foreground truncate">
              Administrator Audit Trail
            </h1>
            <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1 shrink-0 whitespace-nowrap">
              <ShieldCheck className="h-3 w-3" />
              {total} Events
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
            Immutable log of all administrative actions, suspensions, role modifications, and notices.
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

          <ExportButton data={exportData} columns={exportCols} filename="eduspace-audit-logs" />
        </div>
      </div>

      <div className="bg-card p-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChange={(val: string) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by action name (e.g. suspend, delete) or target email..."
          className="max-w-md"
        />
      </div>

      {isLoading && logs.length === 0 ? (
        <LoadingState count={8} />
      ) : isError && logs.length === 0 ? (
        <ErrorState onRetry={handleRefresh} />
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
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => setSelectedAudit(log)}
                  className="group hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <TableCell>
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{log.admin_name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{log.admin_email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action) as any} className="capitalize text-xs font-semibold">
                      {(log.action || "").replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {log.target_email || (log.target_user_id ? `ID: ${log.target_user_id.slice(0, 8)}...` : "System-wide")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span title={formatDate(log.created_at, "PPP p")}>
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAudit(log);
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

      {/* ── Audit Event Details Right-Side Drawer ─────────────────────────── */}
      <Sheet open={!!selectedAudit} onOpenChange={(open) => !open && setSelectedAudit(null)}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto space-y-6">
          <SheetHeader className="space-y-1.5 text-left items-start pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Audit Record
              </span>
              <Badge variant={getActionBadgeVariant(selectedAudit?.action || "") as any} className="capitalize text-xs font-semibold">
                {(selectedAudit?.action || "").replace(/_/g, " ")}
              </Badge>
            </div>
            <SheetTitle className="text-base sm:text-lg font-bold text-foreground capitalize text-left leading-tight break-words">
              {(selectedAudit?.action || "Audit Event").replace(/_/g, " ")}
            </SheetTitle>
            <SheetDescription className="text-xs text-left flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              Recorded: {selectedAudit?.created_at ? formatDate(selectedAudit.created_at, "PPP p") : ""}
            </SheetDescription>
          </SheetHeader>

          {/* Administrator Info Card */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Initiating Administrator
            </h4>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Admin Name:</span>
                <span className="font-semibold text-foreground">{selectedAudit?.admin_name || "Platform Admin"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Admin Email:</span>
                <span className="font-mono text-foreground">{selectedAudit?.admin_email || "N/A"}</span>
              </div>
              {selectedAudit?.admin_id && (
                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="text-muted-foreground">Admin ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[11px] text-muted-foreground">{selectedAudit.admin_id.slice(0, 16)}...</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(selectedAudit.admin_id, "Admin ID")}
                    >
                      {copiedField === "Admin ID" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Target User / Entity Card */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" />
              Target Entity
            </h4>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Target Email:</span>
                <span className="font-semibold text-foreground">{selectedAudit?.target_email || "System-Wide / No Single User"}</span>
              </div>
              {selectedAudit?.target_user_id && (
                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="text-muted-foreground">Target User ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[11px] text-muted-foreground">{selectedAudit.target_user_id.slice(0, 16)}...</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(selectedAudit.target_user_id, "Target User ID")}
                    >
                      {copiedField === "Target User ID" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Details & Telemetry JSON */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-primary" />
              Action Parameters & Details
            </h4>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-56 text-foreground">
              <pre>{JSON.stringify(selectedAudit?.details || {}, null, 2)}</pre>
            </div>
          </div>

          {/* Audit Record ID */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Log Entry ID:</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[11px] text-muted-foreground">{selectedAudit?.id?.slice(0, 16)}...</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(selectedAudit?.id || "", "Log Entry ID")}
              >
                {copiedField === "Log Entry ID" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t flex flex-row items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAudit(null)}
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
