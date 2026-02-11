// Imports
import { Users, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar, Loader2, UserPlus, ArrowRight, BookOpen, GraduationCap, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLecturerData } from "@/hooks/useLecturerData";
import { useNavigate } from "react-router-dom";
import { InviteUserDialog } from "@/components/lecturer/InviteUserDialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRealtimeRejections } from "@/hooks/useRealtimeRejections";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { PerformanceTrendChart } from "@/components/dashboard/PerformanceTrendChart";

import { TestPushNotification } from "@/components/lecturer/TestPushNotification";

export default function LecturerDashboard() {
  const { profile } = useAuth();
  const { stats: dataStats, upcomingClasses, loading } = useLecturerData();
  const navigate = useNavigate();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Listen for real-time rejection notifications
  useRealtimeRejections();

  // Get display name for greeting
  const title = profile?.full_name || "Professor";

  const stats = [
    {
      title: "Total Students",
      value: dataStats.enrolledStudents,
      label: "Unique students enrolled",
      icon: Users,
      color: "bg-blue-500",
      lightColor: "bg-blue-500/10 text-blue-600",
      gradient: "from-blue-500/20 to-blue-600/5",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      title: "Submissions",
      value: `${dataStats.submissionsReceived} / ${dataStats.totalExpectedSubmissions}`,
      label: "Students submitted",
      icon: FileText,
      color: "bg-purple-500",
      lightColor: "bg-purple-500/10 text-purple-600",
      gradient: "from-purple-500/20 to-purple-600/5",
      borderColor: "border-purple-200 dark:border-purple-800"
    },
    {
      title: "Pending Submissions",
      value: dataStats.pendingSubmissions,
      label: "Students yet to submit",
      icon: AlertCircle,
      color: "bg-amber-500",
      lightColor: "bg-amber-500/10 text-amber-600",
      gradient: "from-amber-500/20 to-amber-600/5",
      borderColor: "border-amber-200 dark:border-amber-800"
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      actions={
        <Button
          variant="default"
          size="sm"
          onClick={() => setInviteDialogOpen(true)}
          className="w-9 px-0 md:w-auto md:px-3 gap-2 shadow-sm"
          title="Invite Student"
        >
          <UserPlus className="size-4" />
          <span className="hidden md:inline">Invite Student</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-8 pb-8">

        {/* Modern Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 size-[500px] rounded-full bg-indigo-500/30 blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-[400px] rounded-full bg-emerald-500/20 blur-3xl opacity-50 pointer-events-none" />

          <div className="relative z-10 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-emerald-300">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                </span>
                Academic Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back, <span className="text-white">{title}</span>
              </h1>
              <p className="text-slate-300 text-base">
                Your daily overview of student progress and upcoming classes.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Premium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stats.map((stat, i) => (
            <div
              key={stat.title}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1",
                stat.borderColor
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", stat.gradient)} />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{stat.value}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <div className={cn("rounded-xl p-3", stat.lightColor)}>
                  <stat.icon className="size-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Performance Trend - Left Column (2/3) */}
          <div className="xl:col-span-2 space-y-6">
            <PerformanceTrendChart />
          </div>

          {/* Right Sidebar (1/3) */}
          <div className="space-y-6">

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/schedule')}
                className="flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-all text-left group"
              >
                <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-indigo-900 dark:text-indigo-100">Schedule</h3>
                  <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80">Manage classes</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/all-students')}
                className="flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/50 hover:shadow-md transition-all text-left group"
              >
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <GraduationCap className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">Students</h3>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">View directory</p>
                </div>
              </button>
            </div>

            {/* Test Notification Card */}
            <TestPushNotification />

            {/* Upcoming Classes - Timeline Style */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Upcoming Classes</h2>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate('/schedule')}>See all</Button>
              </div>

              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-0">
                  {upcomingClasses.length > 0 ? (
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-6 top-4 bottom-4 w-px bg-border/60" />

                      <div className="flex flex-col">
                        {upcomingClasses.map((classItem, idx) => (
                          <div
                            key={classItem.id}
                            className="relative pl-12 pr-4 py-4 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer group"
                            onClick={() => {
                              if (classItem.classId) {
                                navigate(`/schedule?classId=${classItem.classId}`);
                              } else {
                                navigate('/schedule');
                              }
                            }}
                          >
                            {/* Timeline Dot */}
                            <div className={cn(
                              "absolute left-[21px] top-6 size-2.5 rounded-full border-2 border-background z-10 transition-colors",
                              classItem.isToday ? "bg-emerald-500 ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/40" : "bg-slate-300 dark:bg-slate-600 group-hover:bg-primary"
                            )} />

                            <div className="flex justify-between items-start mb-1">
                              <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded",
                                classItem.isToday ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-secondary text-secondary-foreground"
                              )}>
                                {classItem.courseCode}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground">{classItem.time}</span>
                            </div>

                            <h4 className="font-semibold text-sm text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">{classItem.title}</h4>

                            <div className="flex items-center text-xs text-muted-foreground gap-1">
                              <Clock className="size-3" />
                              <span>{classItem.room}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p className="text-sm">No upcoming classes scheduled.</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/schedule')}>
                        Schedule Class
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        lecturerName={profile?.full_name || "Lecturer"}
        lecturerEmail={profile?.email || ""}
      />
    </DashboardLayout >
  );
}
