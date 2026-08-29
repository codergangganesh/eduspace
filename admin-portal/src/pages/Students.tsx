import * as React from "react";
import { useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { Pagination } from "@/components/common/Pagination";
import { ExportButton } from "@/components/common/ExportButton";
import { BulkActionBar } from "@/components/common/BulkActionBar";
import { EmptyState, LoadingState, ErrorState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/users/StatusBadge";
import { UserAvatar } from "@/components/users/UserAvatar";
import { ProfileDrawer } from "@/components/users/ProfileDrawer";
import { RoleChangeModal } from "@/components/users/RoleChangeModal";
import { DeleteUserModal } from "@/components/users/DeleteUserModal";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
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
  Users,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Students: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [activeUser, setActiveUser] = useState<EnrichedUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<EnrichedUser | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<EnrichedUser | null>(null);
  const [bulkSuspendOpen, setBulkSuspendOpen] = useState(false);
  const [bulkActivateOpen, setBulkActivateOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    students,
    total,
    totalPages,
    isLoading,
    isError,
    refetch,
    departments,
  } = useStudents({
    search,
    status: statusFilter,
    department: deptFilter,
    page,
    pageSize: 10,
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      toast.error("Failed to refresh student records.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(students.map((s: EnrichedUser) => s.user_id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
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

  const handleBulkStatus = async (status: "active" | "suspended") => {
    const res = await adminService.bulkSetStatus(selectedUserIds, status);
    if (res.success) {
      toast.success(`Updated status for ${selectedUserIds.length} students.`);
      setSelectedUserIds([]);
      refetch();
    } else {
      toast.error(res.error || "Bulk action failed.");
    }
  };

  const exportColumns = [
    { header: "User ID", key: "user_id", width: 36 },
    { header: "Full Name", key: "full_name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Student ID", key: "student_id", width: 15 },
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
              Students Directory
            </h1>
            <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0 whitespace-nowrap">
              {total} Enrolled
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
            Monitor, inspect, and manage student enrollments, statuses, and academic records.
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
            data={students}
            columns={exportColumns}
            filename="eduspace-students"
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
          placeholder="Search by student name, email, ID, or department..."
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

          <FilterDropdown
            value={deptFilter}
            onChange={(val: string) => {
              setDeptFilter(val);
              setPage(1);
            }}
            options={[
              { label: "All Departments", value: "all" },
              ...departments.map((d) => ({ label: d, value: d })),
            ]}
            placeholder="Department"
          />
        </div>
      </div>

      {/* Data Table */}
      {isLoading && students.length === 0 ? (
        <LoadingState count={6} />
      ) : isError && students.length === 0 ? (
        <ErrorState onRetry={handleRefresh} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students match criteria"
          description="Try adjusting your search query, status filter, or department."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch("");
            setStatusFilter("all");
            setDeptFilter("all");
            setPage(1);
          }}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === students.length && students.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border"
                  />
                </TableHead>
                <TableHead>Student Name & Email</TableHead>
                <TableHead>Department / Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: EnrichedUser) => {
                const isSelected = selectedUserIds.includes(student.user_id);
                return (
                  <TableRow
                    key={student.user_id}
                    className={`group cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/5" : ""
                      }`}
                    onClick={() => handleOpenDrawer(student)}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(student.user_id)}
                        className="rounded border-border"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <UserAvatar name={student.full_name} avatarUrl={student.avatar_url} size="md" />
                        <div>
                          <p className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                            {student.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {student.email}
                          </p>
                          {student.student_id && (
                            <span className="text-[10px] font-mono text-primary font-medium">
                              ID: {student.student_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-foreground">
                        {student.department || "General"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {student.program || "Student Account"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(student.created_at)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDrawer(student)}
                          className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1 rounded-lg transition-all"
                          title="View Profile Details"
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
                              onClick={() => handleOpenDrawer(student)}
                              className="text-xs cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Full Profile
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleQuickStatusToggle(student)}
                              className="text-xs cursor-pointer"
                            >
                              {student.status === "suspended" ? (
                                <>
                                  <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                                  Reactivate Student
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="mr-2 h-4 w-4 text-destructive" />
                                  Suspend Student
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setRoleModalUser(student)}
                              className="text-xs cursor-pointer"
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => setDeleteModalUser(student)}
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
                );
              })}
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

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedUserIds.length}
        onClear={() => setSelectedUserIds([])}
        actions={[
          {
            label: "Activate Selected",
            icon: ShieldCheck,
            onClick: () => setBulkActivateOpen(true),
            variant: "secondary",
          },
          {
            label: "Suspend Selected",
            icon: ShieldAlert,
            onClick: () => setBulkSuspendOpen(true),
            variant: "destructive",
          },
        ]}
      />

      {/* Drawers and Modals */}
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

      <ConfirmationModal
        open={bulkSuspendOpen}
        onOpenChange={(isOpen: boolean) => setBulkSuspendOpen(isOpen)}
        onConfirm={() => {
          handleBulkStatus("suspended");
          setBulkSuspendOpen(false);
        }}
        title={`Suspend ${selectedUserIds.length} Students?`}
        description="Suspended students will immediately lose access to their classes, assignments, and discussions."
        confirmText="Suspend All"
        variant="destructive"
      />

      <ConfirmationModal
        open={bulkActivateOpen}
        onOpenChange={(isOpen: boolean) => setBulkActivateOpen(isOpen)}
        onConfirm={() => {
          handleBulkStatus("active");
          setBulkActivateOpen(false);
        }}
        title={`Reactivate ${selectedUserIds.length} Students?`}
        description="All selected students will have their platform access restored immediately."
        confirmText="Reactivate All"
      />
    </div>
  );
};
