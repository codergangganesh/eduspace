import * as React from "react";
import { useState } from "react";
import { useLecturers } from "@/hooks/useLecturers";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/users/StatusBadge";
import { UserAvatar } from "@/components/users/UserAvatar";
import { ProfileDrawer } from "@/components/users/ProfileDrawer";
import { RoleChangeModal } from "@/components/users/RoleChangeModal";
import { DeleteUserModal } from "@/components/users/DeleteUserModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnrichedUser } from "@/types";
import { adminService } from "@/services/admin.service";
import { formatDate } from "@/lib/utils";
import {
  MoreVertical,
  Eye,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Trash2,
  GraduationCap,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Lecturers: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [activeUser, setActiveUser] = useState<EnrichedUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<EnrichedUser | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<EnrichedUser | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    lecturers,
    total,
    totalPages,
    isLoading,
    isError,
    refetch,
  } = useLecturers({
    search,
    status: statusFilter,
    page,
    pageSize: 10,
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      toast.error("Failed to refresh faculty records.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenDrawer = (user: EnrichedUser) => {
    setActiveUser(user);
    setDrawerOpen(true);
  };

  const handleQuickStatusToggle = async (user: EnrichedUser) => {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    const res = await adminService.setUserStatus(user.user_id, newStatus, user.email);
    if (res.success) {
      toast.success(`${user.full_name} is now ${newStatus}.`);
      refetch();
    } else {
      toast.error(res.error || "Failed to update status.");
    }
  };

  const exportColumns = [
    { header: "User ID", key: "user_id", width: 36 },
    { header: "Full Name", key: "full_name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Department", key: "department", width: 25 },
    { header: "Status", key: "status", width: 12 },
    { header: "Joined Date", key: "created_at", width: 20 },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-foreground truncate">
              Faculty & Lecturers
            </h1>
            <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap">
              {total} Faculty
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
            Manage faculty instructors, courses handled, and administrative permissions.
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

          <ExportButton
            data={lecturers}
            columns={exportColumns}
            filename="eduspace-lecturers"
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChange={(val: string) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by lecturer name, email, or department..."
          className="flex-1 max-w-md"
        />

        <div className="flex items-center gap-2.5">
          <FilterDropdown
            value={statusFilter}
            onChange={(val: string) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Active Only", value: "active" },
              { label: "Suspended Only", value: "suspended" },
            ]}
            placeholder="Status"
          />
        </div>
      </div>

      {/* Data Table */}
      {isLoading && lecturers.length === 0 ? (
        <LoadingState count={6} />
      ) : isError && lecturers.length === 0 ? (
        <ErrorState onRetry={handleRefresh} />
      ) : lecturers.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No faculty members found"
          description="Try adjusting your search query or status filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch("");
            setStatusFilter("all");
            setPage(1);
          }}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Lecturer Name & Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lecturers.map((lecturer: EnrichedUser) => (
                <TableRow
                  key={lecturer.user_id}
                  className="group cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleOpenDrawer(lecturer)}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <UserAvatar name={lecturer.full_name} avatarUrl={lecturer.avatar_url} size="md" />
                      <div>
                        <p className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                          {lecturer.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {lecturer.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-medium text-foreground">
                      {lecturer.department || "Academic Department"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lecturer.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(lecturer.created_at)}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDrawer(lecturer)}
                        className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1 rounded-lg transition-all"
                        title="View Faculty Details"
                      >
                        <span className="hidden sm:inline">Profile</span>
                        <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                          <DropdownMenuItem
                            onClick={() => handleOpenDrawer(lecturer)}
                            className="text-xs cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Profile
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleQuickStatusToggle(lecturer)}
                            className="text-xs cursor-pointer"
                          >
                            {lecturer.status === "suspended" ? (
                              <>
                                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                                Activate Faculty
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="mr-2 h-4 w-4 text-destructive" />
                                Suspend Faculty
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setRoleModalUser(lecturer)}
                            className="text-xs cursor-pointer"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setDeleteModalUser(lecturer)}
                            className="text-xs cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
          onPageChange={(p: number) => setPage(p)}
          totalRecords={total}
          pageSize={10}
        />
      )}

      {/* Profile Drawer */}
      <ProfileDrawer
        user={activeUser}
        open={drawerOpen}
        onOpenChange={(isOpen: boolean) => {
          setDrawerOpen(isOpen);
          if (!isOpen) setActiveUser(null);
        }}
        onUserUpdated={() => refetch()}
      />

      {roleModalUser && (
        <RoleChangeModal
          user={roleModalUser}
          open={Boolean(roleModalUser)}
          onOpenChange={(isOpen: boolean) => {
            if (!isOpen) setRoleModalUser(null);
          }}
          onSuccess={() => {
            setRoleModalUser(null);
            refetch();
          }}
        />
      )}

      {deleteModalUser && (
        <DeleteUserModal
          user={deleteModalUser}
          open={Boolean(deleteModalUser)}
          onOpenChange={(isOpen: boolean) => {
            if (!isOpen) setDeleteModalUser(null);
          }}
          onSuccess={() => {
            setDeleteModalUser(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};
