import { FileText, CheckCircle, AlertCircle, Calendar, Loader2, Clock, UserPlus, Heart, Send, Megaphone, Flame, Award, ChevronRight, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { UpcomingTask } from "@/components/dashboard/UpcomingTask";
import { useAssignments } from "@/hooks/useAssignments";
import { DashboardAssignmentList } from "@/components/dashboard/DashboardAssignmentList";
import { useSchedule } from "@/hooks/useSchedule";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PremiumStatsCard } from "@/components/dashboard/PremiumStatsCard";
import { parseISO, format, isAfter, isBefore, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { InviteUserDialog } from "@/components/lecturer/InviteUserDialog";
import { PendingInvitationsPanel } from "@/components/student/PendingInvitationsPanel";
import { JoinRequestModal } from "@/components/student/JoinRequestModal";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentOnboarding } from "@/hooks/useStudentOnboarding";
import { useRealtimeInvitations } from "@/hooks/useRealtimeInvitations";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useStreak } from "@/contexts/StreakContext";
import { DashboardStreakWeekly } from "@/components/dashboard/DashboardStreakWeekly";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Dashboard() {
  const { assignments, stats, loading: assignmentsLoading } = useAssignments();
  const { schedules, loading: scheduleLoading } = useSchedule();
  const { streak, loading: streakLoading } = useStreak();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { recordAcademicAction } = useStreak();

  // Record daily visit streak
  useEffect(() => {
    if (user?.id) {
      recordAcademicAction();
    }
  }, [user?.id, recordAcademicAction]);

  // Student onboarding and real-time invitations
  const {
    hasPending,
    isOnboarding,
    pendingInvitations,
    showModal,
    dismissModal,
    refreshInvitations,
    showModalForNewRequest,
    markRequestAsHandled
  } = useStudentOnboarding();

  // Set up real-time invitations with modal trigger
  useRealtimeInvitations(
    () => {
      // Refresh invitations when new one arrives
      refreshInvitations();
    },
    () => {
      // Show modal when new invitation arrives
      showModalForNewRequest();
    }
  );

  const loading = assignmentsLoading || scheduleLoading || isOnboarding || streakLoading;

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  // Process upcoming assignments
  const upcomingTasks = assignments
    .filter(a => {
      // Include both 'published' (legacy) and 'active' (new system) statuses
      const isActiveOrPublished = a.status === 'published' || a.status === 'active';
      const isNotSubmitted = a.studentStatus ? (a.studentStatus === 'pending' || a.studentStatus === 'overdue') : true;
      return isActiveOrPublished && isNotSubmitted && a.due_date;
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
        <div className="flex items-center gap-2">

          <Button
            variant="default"
            size="sm"
            onClick={() => setInviteDialogOpen(true)}
            className="gap-2"
          >
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">Invite User</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Hero Section */}
        <DashboardHero />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <PremiumStatsCard
            title="ASSIGNED"
            value={stats.total}
            subtitle="Total active tasks"
            icon={FileText}
            backgroundColor="bg-gradient-to-br from-blue-600 to-indigo-700"
            iconBackgroundColor="bg-white/10"
          />
          <PremiumStatsCard
            title="STREAK"
            value={streak?.current_streak || 0}
            subtitle="Day blaze"
            icon={Flame}
            backgroundColor="bg-gradient-to-br from-orange-500 to-red-600"
            iconBackgroundColor="bg-white/10"
            onClick={() => navigate("/streak")}
          />
          <PremiumStatsCard
            title="COMPLETED"
            value={stats.completed}
            subtitle="Tasks finished"
            icon={CheckCircle}
            backgroundColor="bg-gradient-to-br from-green-600 to-emerald-700"
            iconBackgroundColor="bg-white/10"
          />
          <PremiumStatsCard
            title="PENDING"
            value={stats.pending}
            subtitle="Require attention"
            icon={AlertCircle}
            backgroundColor="bg-gradient-to-br from-amber-500 to-orange-600"
            iconBackgroundColor="bg-white/10"
          />
          <PremiumStatsCard
            title="SCHEDULE"
            value="View"
            subtitle="Weekly plan"
            icon={Calendar}
            backgroundColor="bg-gradient-to-br from-purple-600 to-violet-700"
            iconBackgroundColor="bg-white/10"
            onClick={() => navigate("/schedule")}
            className="hidden"
          />
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Daily Streak Weekly Visual - MOBILE ONLY (at top of main content) */}
            <div className="space-y-3 lg:hidden">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Flame className="size-3.5 text-orange-500" />
                  Momentum Tracker
                </h3>
              </div>
              <DashboardStreakWeekly />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Current Assignments</h2>
              </div>
              <DashboardAssignmentList assignments={assignments} />
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            {/* Daily Streak Weekly Visual - DESKTOP ONLY (top of sidebar) */}
            <div className="space-y-3 hidden lg:block">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Flame className="size-3.5 text-orange-500" />
                  Momentum Tracker
                </h3>
              </div>
              <DashboardStreakWeekly />
            </div>

            {/* Upcoming Classes Widget */}
            <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="size-4 text-purple-500" />
                Upcoming Classes
              </h3>
              <div className="space-y-3">
                {upcomingClasses.length > 0 ? (
                  upcomingClasses.map(cls => (
                    <UpcomingTask
                      key={cls.id}
                      {...cls}
                      onClick={() => navigate("/schedule")}
                    />
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
                    <UpcomingTask
                      key={task.id}
                      {...task}
                      onClick={() => navigate(`/student/assignments/${task.id}`)}
                    />
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

      {/* Join Request Modal */}
      <JoinRequestModal
        open={showModal}
        onOpenChange={dismissModal}
        pendingInvitations={pendingInvitations}
        onRequestHandled={refreshInvitations}
        onRequestMarkedAsHandled={markRequestAsHandled}
      />
    </DashboardLayout>
  );
}
