import { FileText, CheckCircle, AlertCircle, Calendar, Loader2, Clock, GraduationCap, Bell } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeAccessRequests } from "@/hooks/useRealtimeAccessRequests";
import { useEnrolledClasses } from "@/hooks/useEnrolledClasses";
import { AccessRequestCard } from "@/components/student/AccessRequestCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Dashboard() {
  const { assignments, stats, loading: assignmentsLoading } = useAssignments();
  const { schedules, loading: scheduleLoading } = useSchedule();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { pendingRequests, loading: requestsLoading, refetch: refetchRequests } = useRealtimeAccessRequests();
  const { enrolledClasses, loading: classesLoading } = useEnrolledClasses();

  const loading = assignmentsLoading || scheduleLoading || requestsLoading || classesLoading;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const upcomingTasks = assignments
    .filter(a => {
      const isPublished = a.status === 'published';
      const isNotSubmitted = a.studentStatus ? (a.studentStatus === 'pending' || a.studentStatus === 'overdue') : true;
      return isPublished && isNotSubmitted && a.due_date;
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 3)
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

  const todayIndex = new Date().getDay();
  const upcomingClasses = schedules
    .filter(s => s.day_of_week >= todayIndex)
    .sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.start_time.localeCompare(b.start_time);
    })
    .slice(0, 4)
    .map(s => ({
      id: s.id,
      title: s.title,
      course: s.location || "Room TBD",
      dueDate: s.day_of_week === todayIndex ? "Today" : days[s.day_of_week],
      dueTime: s.start_time.slice(0, 5),
      type: s.type as any,
      isUrgent: s.day_of_week === todayIndex
    }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <DashboardHero />

        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-primary animate-pulse" />
              <h2 className="text-xl font-bold text-foreground">Pending Class Invitations</h2>
              <Badge variant="default" className="ml-2">{pendingRequests.length} new</Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingRequests.map((request) => (
                <AccessRequestCard
                  key={request.id}
                  request={request}
                  onRespond={refetchRequests}
                />
              ))}
            </div>
          </div>
        )}

        {enrolledClasses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">My Classes</h2>
                <Badge variant="secondary">{enrolledClasses.length}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledClasses.slice(0, 3).map((enrollment) => (
                <Card key={enrollment.id} className="bg-card border-border hover:border-primary/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {enrollment.classes.course_code}
                        </h3>
                        {enrollment.classes.class_name && (
                          <p className="text-sm text-muted-foreground truncate">
                            {enrollment.classes.class_name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {enrollment.classes.lecturer_name || 'Lecturer'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Enrolled Classes"
            value={enrolledClasses.length}
            icon={GraduationCap}
            subtitle="Active enrollments"
            className="border-l-4 border-l-indigo-500"
          />
          <StatsCard
            title="Assignments"
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

          <div className="space-y-6">
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
    </DashboardLayout>
  );
}
