import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { StatCard } from "@/components/dashboard/StatCard";
import { UserGrowthChart } from "@/components/dashboard/UserGrowthChart";
import { UserDistributionChart } from "@/components/dashboard/UserDistributionChart";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { ExportButton } from "@/components/common/ExportButton";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  FolderKanban,
  ClipboardList,
  FileCheck,
  UserPlus,
  ShieldAlert,
  MessageSquare,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const Dashboard: React.FC = () => {
  const { stats, refetch, recentActivity, isLoadingActivity, isLoading } = useDashboardStats();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      toast.error("Failed to refresh dashboard data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportData = [
    { Metric: "Total Students", Value: stats?.totalStudents ?? 0 },
    { Metric: "Active Students", Value: stats?.activeStudents ?? 0 },
    { Metric: "Suspended Students", Value: stats?.suspendedStudents ?? 0 },
    { Metric: "Total Lecturers", Value: stats?.totalLecturers ?? 0 },
    { Metric: "Active Lecturers", Value: stats?.activeLecturers ?? 0 },
    { Metric: "Total Classes", Value: stats?.totalClasses ?? 0 },
    { Metric: "Total Assignments", Value: stats?.totalAssignments ?? 0 },
    { Metric: "Total Quizzes", Value: stats?.totalQuizzes ?? 0 },
    { Metric: "Total Messages", Value: stats?.totalMessages ?? 0 },
    { Metric: "New Users (30 Days)", Value: stats?.newUsersLast30Days ?? 0 },
  ];

  const exportCols = [
    { header: "Platform Metric", key: "Metric", width: 25 },
    { header: "Current Value", key: "Value", width: 15 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Platform Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time statistics, metrics, and activity across the entire Eduspace ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            data={exportData}
            columns={exportCols}
            filename="eduspace_platform_summary"
          />

          <Button asChild size="sm" className="h-9 text-xs font-semibold shadow-sm shadow-primary/20">
            <Link to="/announcements">
              <Megaphone className="mr-1.5 h-3.5 w-3.5" />
              Broadcast Notice
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          subtitle={`${stats?.activeStudents ?? stats?.totalStudents ?? 0} active enrolled`}
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Total Lecturers"
          value={stats?.totalLecturers ?? 0}
          subtitle={`${stats?.activeLecturers ?? stats?.totalLecturers ?? 0} active faculty`}
          icon={GraduationCap}
          color="emerald"
        />

        <StatCard
          title="Total Classes"
          value={stats?.totalClasses ?? 0}
          subtitle="Active lecture rooms"
          icon={FolderKanban}
          color="amber"
        />

        <StatCard
          title="New Users (30d)"
          value={stats?.newUsersLast30Days ?? 0}
          subtitle="Recent registrations"
          icon={UserPlus}
          color="rose"
        />
      </div>

      {/* Secondary KPI Row (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Assignments"
          value={stats?.totalAssignments ?? 0}
          subtitle="Course coursework tasks"
          icon={ClipboardList}
          color="blue"
        />

        <StatCard
          title="Quizzes"
          value={stats?.totalQuizzes ?? 0}
          subtitle="Published evaluations"
          icon={FileCheck}
          color="emerald"
        />

        <StatCard
          title="Messages Sent"
          value={stats?.totalMessages ?? 0}
          subtitle="Chat communications"
          icon={MessageSquare}
          color="purple"
        />

        <StatCard
          title="Suspended Users"
          value={stats?.suspendedStudents ?? 0}
          subtitle="Accounts restricted"
          icon={ShieldAlert}
          color="rose"
        />
      </div>

      {/* Primary Charts Grid: User Growth & User Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UserGrowthChart
          data={stats?.userGrowth || []}
          datasets={stats?.userGrowthDatasets}
          isLoading={isLoading}
        />
        <UserDistributionChart data={stats?.userDistribution || []} />
      </div>

      {/* Side-by-Side Grid: Academic Resources Overview & Recent Platform Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart data={stats?.activitySummary || []} />
        <RecentActivityFeed
          activity={recentActivity}
          isLoading={isLoadingActivity}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </div>
    </div>
  );
};
