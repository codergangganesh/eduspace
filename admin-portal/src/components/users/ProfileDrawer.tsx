import * as React from "react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { UserAvatar } from "./UserAvatar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { RoleChangeModal } from "./RoleChangeModal";
import { DeleteUserModal } from "./DeleteUserModal";
import { EnrichedUser } from "@/types";
import { useStudentDetails } from "@/hooks/useStudents";
import { useLecturerDetails } from "@/hooks/useLecturers";
import { adminService } from "@/services/admin.service";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  User,
  BookOpen,
  Activity,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Trash2,
  Mail,
  Calendar,
  Building,
  GraduationCap,
  Award,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileDrawerProps {
  user: EnrichedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: ProfileDrawerProps) => {
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isStudent = user?.role === "student";
  const { data: studentDetails } = useStudentDetails(
    isStudent && user ? user.user_id : null
  );
  const { data: lecturerDetails } = useLecturerDetails(
    !isStudent && user ? user.user_id : null
  );

  if (!user) return null;

  const isSuspended = user.status === "suspended";

  const handleToggleStatus = async () => {
    const newStatus = isSuspended ? "active" : "suspended";
    try {
      setIsProcessing(true);
      const res = await adminService.setUserStatus(user.user_id, newStatus, user.email);
      if (res.success) {
        user.status = newStatus;
        toast.success(
          `Account for ${user.full_name} is now ${newStatus === "active" ? "activated" : "suspended"}.`
        );
        onUserUpdated();
        setSuspendModalOpen(false);
      } else {
        toast.error(res.error || "Failed to update status in database.");
      }
    } catch (err: any) {
      console.error("[ProfileDrawer] Status update exception:", err);
      toast.error(err.message || "Failed to update status in database.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col bg-card border-border">
          <SheetHeader className="sr-only">
            <SheetTitle>{user.full_name} User Profile</SheetTitle>
            <SheetDescription>Comprehensive user details, academic records, and account permissions.</SheetDescription>
          </SheetHeader>

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border-b border-border/80">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <UserAvatar name={user.full_name} avatarUrl={user.avatar_url} size="lg" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">{user.full_name}</h2>
                  <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={user.status} />
                    <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Content Area */}
          <div className="flex-1 p-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6 bg-muted/60">
                <TabsTrigger value="profile" className="text-xs font-medium gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="academic" className="text-xs font-medium gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Academic
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-xs font-medium gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Activity
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5" /> Department
                    </span>
                    <p className="text-sm font-medium text-foreground">{user.department || "General"}</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" /> Program / Degree
                    </span>
                    <p className="text-sm font-medium text-foreground">{user.program || "Student Account"}</p>
                  </div>

                  {user.student_id && (
                    <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Student ID</span>
                      <p className="text-sm font-mono font-medium text-foreground">{user.student_id}</p>
                    </div>
                  )}

                  {user.year && (
                    <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Academic Year</span>
                      <p className="text-sm font-medium text-foreground">{user.year}</p>
                    </div>
                  )}

                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Joined Platform
                    </span>
                    <p className="text-sm font-medium text-foreground">{formatDate(user.created_at)}</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Account Verified</span>
                    <p className="text-sm font-medium text-foreground">{user.verified ? "✅ Verified" : "⏳ Pending"}</p>
                  </div>
                </div>

                {/* Additional profile bio */}
                {studentDetails?.profile?.bio && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground">Bio / About</span>
                    <p className="text-xs text-foreground/90 leading-relaxed">{studentDetails.profile.bio}</p>
                  </div>
                )}
              </TabsContent>

              {/* Academic Tab */}
              <TabsContent value="academic" className="space-y-4">
                {isStudent ? (
                  <div className="space-y-4">
                    {/* Live Real-time Status Badge */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-foreground">Live Academic Metrics</span>
                      <div className="flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        <span className="relative flex h-1.5 w-1.5 mr-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Supabase Live
                      </div>
                    </div>

                    {/* 3 Core Academic Metric Tiles */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center shadow-sm">
                        <span className="text-2xl font-black text-primary">
                          {studentDetails?.classes?.length || 0}
                        </span>
                        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Classes Enrolled</p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center shadow-sm">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {studentDetails?.assignmentSubmissions?.length || 0}
                        </span>
                        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Submissions</p>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center shadow-sm">
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                          {studentDetails?.quizSubmissions?.length || 0}
                        </span>
                        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Quizzes Taken</p>
                      </div>
                    </div>

                    {/* Coding Profile Stats (if available in Supabase) */}
                    {(studentDetails as any)?.codingProfile && (
                      <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            LeetCode & Competitive Coding
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {(studentDetails as any).codingProfile.leetcode_username || "Active"}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90">
                          Total Problems Solved: <span className="font-bold">{(studentDetails as any).codingProfile.overall_data?.totalSolved || (studentDetails as any).codingProfile.leetcode_data?.totalSolved || 0}</span>
                        </p>
                      </div>
                    )}

                    {/* Enrolled Classes List */}
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Enrolled Classes & Coursework ({studentDetails?.classes?.length || 0})
                      </h4>
                      {studentDetails?.classes && studentDetails.classes.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {studentDetails.classes.map((cls: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                              <div>
                                <span className="font-medium text-foreground block">{cls.register_number || cls.class_name || `Class ${i + 1}`}</span>
                                {cls.lecturer && <span className="text-[10px] text-muted-foreground">Instructor: {cls.lecturer}</span>}
                              </div>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">Enrolled</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No enrolled classes recorded.</p>
                      )}
                    </div>

                    {/* Recent Submissions List */}
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Assignment Submissions ({studentDetails?.assignmentSubmissions?.length || 0})
                      </h4>
                      {studentDetails?.assignmentSubmissions && studentDetails.assignmentSubmissions.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {studentDetails.assignmentSubmissions.map((sub: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                              <div>
                                <span className="font-medium text-foreground block">{sub.title || `Assignment ${i + 1}`}</span>
                                <span className="text-[10px] text-muted-foreground">{formatDate(sub.submitted_at)}</span>
                              </div>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">{sub.grade || "Submitted"}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No assignment submissions recorded.</p>
                      )}
                    </div>

                    {/* Quizzes Taken List */}
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Quizzes & Evaluations ({studentDetails?.quizSubmissions?.length || 0})
                      </h4>
                      {studentDetails?.quizSubmissions && studentDetails.quizSubmissions.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {studentDetails.quizSubmissions.map((q: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                              <div>
                                <span className="font-medium text-foreground block">{q.title || `Quiz Evaluation ${i + 1}`}</span>
                                <span className="text-[10px] text-muted-foreground">{formatDate(q.submitted_at)}</span>
                              </div>
                              <span className="font-semibold text-purple-600 dark:text-purple-400 text-xs">{q.total_obtained ? `${q.total_obtained} pts` : "Completed"}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No quiz attempts recorded.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                        <span className="text-xl font-bold text-primary">
                          {lecturerDetails?.classes?.length || 0}
                        </span>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Active Classes</p>
                      </div>

                      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {lecturerDetails?.courses?.length || 0}
                        </span>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Courses Handled</p>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {lecturerDetails?.quizzes?.length || 0}
                        </span>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Quizzes Published</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Assigned Courses ({lecturerDetails?.courses?.length || 0})
                      </h4>
                      {lecturerDetails?.courses && lecturerDetails.courses.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {lecturerDetails.courses.map((crs: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                              <div>
                                <span className="font-medium text-foreground block">{crs.title || crs.course_name || `Course ${i + 1}`}</span>
                                <span className="text-[10px] text-muted-foreground">{crs.course_code || `Credits: ${crs.credits || 3}`}</span>
                              </div>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">Active</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No courses assigned.</p>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-3">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-foreground">Last Recorded Activity</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {studentDetails?.activityLog && studentDetails.activityLog.length > 0
                        ? formatRelativeTime(studentDetails.activityLog[0].action_date || studentDetails.activityLog[0].created_at)
                        : "No recent activity"}
                    </p>
                  </div>
                  <Award className="h-5 w-5 text-amber-500" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Recent Daily Actions ({studentDetails?.activityLog?.length || 0})
                  </h4>
                  {studentDetails?.activityLog && studentDetails.activityLog.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {studentDetails.activityLog.map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                          <span className="font-medium text-foreground">Platform Access</span>
                          <span className="font-mono text-muted-foreground">{formatDate(log.action_date || log.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No daily activity records found.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-muted/20 border-t border-border mt-auto space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administrative Actions
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant={isSuspended ? "default" : "outline"}
                size="sm"
                onClick={() => setSuspendModalOpen(true)}
                className={`text-xs font-medium justify-center ${!isSuspended ? "text-destructive border-destructive/30 hover:bg-destructive/10" : ""
                  }`}
              >
                {isSuspended ? (
                  <>
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                    Activate Account
                  </>
                ) : (
                  <>
                    <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                    Suspend Account
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleModalOpen(true)}
                className="text-xs font-medium justify-center"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Change Role
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive justify-center"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Permanently Delete User Account
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={suspendModalOpen}
        onOpenChange={setSuspendModalOpen}
        title={isSuspended ? "Activate this account?" : "Suspend this account?"}
        description={
          isSuspended
            ? `User ${user.full_name} will regain complete access to their Eduspace dashboard.`
            : `User ${user.full_name} will immediately lose access to the Eduspace platform until manually reactivated.`
        }
        confirmText={isSuspended ? "Activate Account" : "Suspend Account"}
        variant={isSuspended ? "default" : "destructive"}
        onConfirm={handleToggleStatus}
        isLoading={isProcessing}
      />

      <RoleChangeModal
        user={user}
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        onSuccess={onUserUpdated}
      />

      <DeleteUserModal
        user={user}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onSuccess={() => {
          onUserUpdated();
          onOpenChange(false);
        }}
      />
    </>
  );
};
