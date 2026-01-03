import { FileText, CheckCircle, AlertCircle, Calendar, Loader2, Clock, UserPlus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { UpcomingTask } from "@/components/dashboard/UpcomingTask";
import { useAssignments } from "@/hooks/useAssignments";
import { useSchedule } from "@/hooks/useSchedule";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { parseISO, format, isAfter, isBefore, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { InviteUserDialog } from "@/components/lecturer/InviteUserDialog";
import { PendingInvitationsPanel } from "@/components/student/PendingInvitationsPanel";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentOnboarding } from "@/hooks/useStudentOnboarding";
import { useRealtimeInvitations } from "@/hooks/useRealtimeInvitations";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Dashboard() {
  const { assignments, stats, loading: assignmentsLoading } = useAssignments();
  const { schedules, loading: scheduleLoading } = useSchedule();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Student onboarding and real-time invitations
  const { hasPending, isOnboarding } = useStudentOnboarding();
  useRealtimeInvitations();

  const loading = assignmentsLoading || scheduleLoading || isOnboarding;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Process upcoming assignments
  const upcomingTasks = assignments
    .filter(a => {
      const isPublished = a.status === 'published';
      const isNotSubmitted = a.studentStatus ? (a.studentStatus === 'pending' || a.studentStatus === 'overdue') : true;
      return isPublished && isNotSubmitted && a.due_date;
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 3) // Limit to 3 to save space
    .map(a => {
      const dateDate = parseISO(a.due_date!);
      const isUrgent = isBefore(dateDate, addDays(new Date(), 2)) && isAfter(dateDate, new Date());

      return {
        id: a.id,
        title: a.title,
        course: a.course_title || "General Course",
        dueDate: format(dateDate, "MMM d"),
        dueTime: format(dateDate, "h:mm a"),
        type: "assignment" as const,
        isUrgent
      };
    });

  // Process upcoming classes
  const todayIndex = new Date().getDay(); // 0 is Sunday
  const upcomingClasses = schedules
    .filter(s => s.day_of_week >= todayIndex) // Today onwards
    .sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.start_time.localeCompare(b.start_time);
    })
    .slice(0, 4) // Limit to 4
    .map(s => ({
      id: s.id,
      title: s.title,
      course: s.location || "Room TBD", // Using location as subtitle context
      dueDate: s.day_of_week === todayIndex ? "Today" : days[s.day_of_week],
      dueTime: s.start_time.slice(0, 5),
      type: s.type as any, // 'lecture' | 'lab' etc
      isUrgent: s.day_of_week === todayIndex // Highlight today's classes
    }));

  return (
    <DashboardLayout
      actions={
        <Button
          variant="default"
          size="sm"
          onClick={() => setInviteDialogOpen(true)}
          className="gap-2"
        >
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Invite User</span>
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Hero Section */}
        <DashboardHero />

        {/* Pending Invitations Panel */}
        {hasPending && <PendingInvitationsPanel />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Assigned"
            value={stats.total}
            icon={FileText}
            subtitle="Total active tasks"
            className="border-l-4 border-l-blue-500"
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle}
            subtitle="Tasks finished"
            trend={{ value: 12, isPositive: true }}
            className="border-l-4 border-l-green-500"
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon={AlertCircle}
            subtitle="Require attention"
            className="border-l-4 border-l-orange-500"
          />
          <StatsCard
            title="Schedule"
            value="View"
            icon={Calendar}
            subtitle="Upcoming classes"
            className="border-l-4 border-l-purple-500 hover:border-l-purple-600 dark:border-l-purple-600"
            onClick={() => navigate("/schedule")}
          />
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Current Assignments</h2>
                <Button
                  variant="link"
                  onClick={() => navigate("/assignments")}
                  className="text-primary hover:no-underline px-0"
                >
                  View All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AssignmentCard
                  title="Assignments Assigned"
                  value={stats.total}
                  icon={FileText}
                  onClick={() => navigate("/assignments")}
                  subtitle="View all assignments"
                />
                <AssignmentCard
                  title="Action Required"
                  value={stats.pending}
                  icon={AlertCircle}
                  onClick={() => navigate("/assignments?filter=pending")}
                  variant="danger"
                  subtitle="Pending submissions"
                />
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">

            {/* Upcoming Classes Widget (Replacing Activity Feed position) */}
            <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="size-4 text-purple-500" />
                Upcoming Classes
              </h3>

              <div className="space-y-3">
                {upcomingClasses.length > 0 ? (
                  upcomingClasses.map(cls => (
                    <UpcomingTask key={cls.id} {...cls} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No upcoming classes</p>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={() => navigate("/schedule")}
                className="w-full mt-2 text-xs"
              >
                View Full Schedule
              </Button>
            </div>

            {/* Upcoming Assignments Widget */}
            <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                Assignments Due
              </h3>
              <div className="space-y-3">
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map(task => (
                    <UpcomingTask key={task.id} {...task} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No pending deadlines</p>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        lecturerName={profile?.full_name || "Student"}
        lecturerEmail={profile?.email || ""}
      />
    </DashboardLayout>
  );
}
