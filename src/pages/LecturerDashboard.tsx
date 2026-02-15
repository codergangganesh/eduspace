// Imports
import { Users, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar, Loader2, UserPlus, ArrowRight, BookOpen, GraduationCap, ChevronRight, Megaphone, Heart, Send } from "lucide-react";
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
import { TypewriterName } from "@/components/common/TypewriterName";
import { PremiumStatsCard } from "@/components/dashboard/PremiumStatsCard";


export default function LecturerDashboard() {
  const { profile } = useAuth();
  const { stats: dataStats, upcomingClasses, loading } = useLecturerData();
  const navigate = useNavigate();

  // Listen for real-time rejection notifications
  useRealtimeRejections();

  // Get display name for greeting
  const title = profile?.full_name || "Professor";

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-8">

        {/* Modern Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md border border-slate-100 dark:border-slate-800">
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 size-[500px] rounded-full bg-emerald-500/5 dark:bg-indigo-500/30 blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-[400px] rounded-full bg-blue-500/5 dark:bg-emerald-500/20 blur-3xl opacity-50 pointer-events-none" />

          <div className="relative z-10 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-white/10 backdrop-blur-md border border-emerald-100 dark:border-white/10 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                </span>
                Academic Dashboard
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Welcome back, <TypewriterName name={title} className="text-indigo-600 dark:text-indigo-400" />
              </h1>
              <p className="text-slate-500 dark:text-slate-300 text-base max-w-lg">
                Your daily overview of student progress and upcoming classes.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Premium Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          <PremiumStatsCard
            title="TOTAL STUDENTS"
            value={dataStats.enrolledStudents}
            subtitle="Unique students enrolled"
            icon={Users}
            backgroundColor="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700"
            iconBackgroundColor="bg-white/10"
          />
          <PremiumStatsCard
            title="SUBMISSIONS"
            value={`${dataStats.submissionsReceived} / ${dataStats.totalExpectedSubmissions}`}
            subtitle="Students submitted"
            icon={FileText}
            backgroundColor="bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-700"
            iconBackgroundColor="bg-white/10"
          />
          <PremiumStatsCard
            title="PENDING"
            value={dataStats.pendingSubmissions}
            subtitle="Students yet to submit"
            icon={AlertCircle}
            backgroundColor="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600"
            iconBackgroundColor="bg-white/10"
            className="col-span-2 lg:col-span-1"
          />
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

    </DashboardLayout >
  );
}
