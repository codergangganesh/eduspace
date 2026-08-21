import React, { useState } from "react";
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
    pageSize: 15,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(students.map((s) => s.user_id));
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
      toast.success(`${selectedUserIds.length} accounts marked as ${status}!`);
      setSelectedUserIds([]);
      refetch();
    } else {
      toast.error(res.error || "Bulk update failed.");
    }
  };

  // Export column format
  const exportColumns = [
    { header: "Name", key: "full_name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Student ID", key: "student_id", width: 15 },
    { header: "Department", key: "department", width: 20 },
    { header: "Program", key: "program", width: 20 },
    { header: "Status", key: "status", width: 15 },
    { header: "Joined Date", key: "created_at", width: 20 },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Students Directory</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {total} Total
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor, inspect, and manage student enrollments, statuses, and profiles.
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

          <ExportButton
            data={students}
            columns={exportColumns}
            filename="eduspace_students_list"
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by student name, email, ID, or department..."
          className="flex-1 max-w-md"
        />

        <div className="flex items-center gap-2.5">
          <FilterDropdown
            value={statusFilter}
            onChange={(val) => {
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
            onChange={(val) => {
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
        <ErrorState onRetry={() => refetch()} />
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
                <TableHead>Student</TableHead>
                <TableHead>Department / Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const isSelected = selectedUserIds.includes(student.user_id);
                return (
                  <TableRow
                    key={student.user_id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      isSelected ? "bg-primary/5" : ""
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
                          <p className="font-semibold text-foreground text-sm leading-tight">
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
                                Activate Account
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="mr-2 h-4 w-4 text-destructive" />
                                Suspend Account
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="px-4 pb-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={total}
              pageSize={15}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <BulkActionBar
        selectedCount={selectedUserIds.length}
        onClear={() => setSelectedUserIds([])}
        actions={[
          {
            label: "Suspend Selected",
            icon: ShieldAlert,
            variant: "destructive",
            onClick: () => setBulkSuspendOpen(true),
          },
          {
            label: "Activate Selected",
            icon: ShieldCheck,
            onClick: () => setBulkActivateOpen(true),
          },
        ]}
      />

      {/* Detail Profile Drawer */}
      <ProfileDrawer
        user={activeUser}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUserUpdated={() => refetch()}
      />

      {/* Role Change Modal */}
      <RoleChangeModal
        user={roleModalUser}
        open={!!roleModalUser}
        onOpenChange={(open) => !open && setRoleModalUser(null)}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteUserModal
        user={deleteModalUser}
        open={!!deleteModalUser}
        onOpenChange={(open) => !open && setDeleteModalUser(null)}
        onSuccess={() => refetch()}
      />

      {/* Bulk Suspend Confirmation */}
      <ConfirmationModal
        open={bulkSuspendOpen}
        onOpenChange={setBulkSuspendOpen}
        title={`Suspend ${selectedUserIds.length} accounts?`}
        description="Selected students will immediately lose login access until manually reactivated by an administrator."
        confirmText="Suspend Accounts"
        variant="destructive"
        onConfirm={() => handleBulkStatus("suspended")}
      />

      {/* Bulk Activate Confirmation */}
      <ConfirmationModal
        open={bulkActivateOpen}
        onOpenChange={setBulkActivateOpen}
        title={`Activate ${selectedUserIds.length} accounts?`}
        description="Selected students will regain full platform access."
        confirmText="Activate Accounts"
        variant="default"
        onConfirm={() => handleBulkStatus("active")}
      />
    </div>
  );
};
