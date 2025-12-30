import { FileText, CheckCircle, AlertCircle, Calendar, Loader2, Bell } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AssignmentCard } from "@/components/dashboard/AssignmentCard";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignments } from "@/hooks/useAssignments";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createTestAssignmentNotificationWithPreference, testAssignmentReminderToggle } from "@/lib/testNotifications";
import { toast } from "sonner";

export default function Dashboard() {
  const { profile } = useAuth();
  const { stats, loading, error } = useAssignments();
  const navigate = useNavigate();

  // Get first name for greeting
  const firstName = profile?.full_name?.split(" ")[0] || "Student";

  const handleTestNotification = async () => {
    // First check current setting
    const statusCheck = await testAssignmentReminderToggle();

    if (!statusCheck.success) {
      toast.error("Failed to check notification settings");
      return;
    }

    // Show current status
    if (!statusCheck.willReceiveNotifications) {
      toast.warning("Assignment reminders are OFF. Enable them in Profile → Notifications to receive notifications.");
      return;
    }

    // Try to create notification
    const result = await createTestAssignmentNotificationWithPreference();

    if (result.success) {
      if (result.reminderStatus) {
        toast.success("✅ Test notification sent! Check the bell icon.");
      } else {
        toast.info("ℹ️ Notification not sent - assignment reminders are disabled in your profile.");
      }
    } else {
      toast.error("Failed to create notification");
    }
  };

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
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your assignments and schedule.
          </p>
        </div>

        {/* Assignment Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AssignmentCard
            title="Assignments Assigned"
            value={stats.total}
            icon={FileText}
            onClick={() => navigate("/assignments")}
            subtitle="Total assignments"
          />

          <AssignmentCard
            title="Completed Assignments"
            value={stats.completed}
            icon={CheckCircle}
            onClick={() => navigate("/assignments?filter=completed")}
            variant="success"
            subtitle="Well done!"
          />

          <AssignmentCard
            title="Pending Assignments"
            value={stats.pending}
            icon={AlertCircle}
            onClick={() => navigate("/assignments?filter=pending")}
            variant="danger"
            subtitle="Needs attention"
          />

          <AssignmentCard
            title="Upcoming Schedule"
            value="View"
            icon={Calendar}
            onClick={() => navigate("/schedule")}
            subtitle="Check your classes"
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">🧪 Test Assignment Notification (Preference-Based)</p>
              <p className="text-xs text-muted-foreground mt-1">
                Test the notification system. Notifications will only be sent if "Assignment Reminders" is enabled in Profile → Notifications.
              </p>
            </div>
            <Button onClick={handleTestNotification} variant="outline" size="sm" className="gap-2">
              <Bell className="size-4" />
              Test Notification
            </Button>
          </div>
        </div>

        {/* Quick Actions Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Click on any card above to view more details and manage your assignments.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
