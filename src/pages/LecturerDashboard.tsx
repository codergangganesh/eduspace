// Imports
import { Users, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLecturerData } from "@/hooks/useLecturerData";
import { useNavigate } from "react-router-dom";

export default function LecturerDashboard() {
  const { profile } = useAuth();
  const { stats: dataStats, recentSubmissions, upcomingClasses, loading } = useLecturerData();
  const navigate = useNavigate();

  // Get display name for greeting
  const displayName = profile?.full_name || "Professor";
  const title = displayName.startsWith("Dr.") || displayName.startsWith("Prof.")
    ? displayName
    : `Dr. ${displayName.split(" ").pop()}`;

  const stats = [
    { title: "Enrolled Students", value: dataStats.enrolledStudents, subtitle: "Total students in your courses", icon: Users },
    { title: "Submissions Received", value: dataStats.submissionsReceived, subtitle: "Students who submitted", icon: CheckCircle },
    { title: "Pending Submissions", value: dataStats.pendingSubmissions, subtitle: "Awaiting submission", icon: Clock },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back, {title}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your courses and student activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Submissions */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Submissions</h2>
              <a href="/assignments" className="text-sm text-primary hover:underline font-medium">
                View All
              </a>
            </div>
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              {recentSubmissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Student</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Assignment</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Course</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Submitted</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSubmissions.map((submission) => (
                        <tr key={submission.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-medium text-foreground">{submission.studentName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-foreground">{submission.assignmentTitle}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {submission.courseCode}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">{submission.submittedAt}</span>
                          </td>
                          <td className="px-4 py-3">
                            {submission.status === "pending" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-md">
                                <AlertCircle className="size-3" />
                                Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">
                                <CheckCircle className="size-3" />
                                {submission.grade}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No recent submissions found.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex flex-col gap-6">
            {/* Upcoming Classes */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Upcoming Classes</h2>
                <a href="/schedule" className="text-sm text-primary hover:underline font-medium">
                  Full Schedule
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3">
                  {upcomingClasses.length > 0 ? (
                    upcomingClasses.map((classItem) => (
                      <div
                        key={classItem.id}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          classItem.isToday
                            ? "border-primary/50 bg-primary/5"
                            : "border-border bg-surface"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "size-10 rounded-lg flex items-center justify-center shrink-0",
                            classItem.isToday ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          )}>
                            <Calendar className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-primary">{classItem.courseCode}</span>
                              {classItem.isToday && (
                                <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  Today
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-foreground text-sm mt-1 line-clamp-1">
                              {classItem.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="size-3.5" />
                                <span>{classItem.time}</span>
                              </div>
                              <span>{classItem.room}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-sm text-muted-foreground">
                      No upcoming classes.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => navigate('/assignments')}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-surface hover:bg-secondary/50 hover:border-primary/50 transition-all cursor-pointer"
                >
                  <FileText className="size-5 text-primary" />
                  <span className="text-xs font-medium text-foreground text-center">Create Assignment</span>
                </button>
                <button
                  onClick={() => navigate('/schedule')}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-surface hover:bg-secondary/50 hover:border-primary/50 transition-all cursor-pointer"
                >
                  <Calendar className="size-5 text-primary" />
                  <span className="text-xs font-medium text-foreground text-center">Schedule Class</span>
                </button>
                <button
                  onClick={() => navigate('/students')}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-surface hover:bg-secondary/50 hover:border-primary/50 transition-all cursor-pointer"
                >
                  <Users className="size-5 text-primary" />
                  <span className="text-xs font-medium text-foreground text-center">View Students</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout >
  );
}
