import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { deleteUserAccount } from "@/lib/accountService";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Trash2,
  AlertTriangle,
  Loader2,
  Bell,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect } from "react";

export default function Settings() {
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      // Default to true if undefined
      setNotificationsEnabled(profile.notifications_enabled !== false);
    }
  }, [profile]);

  const handleToggleNotifications = async (checked: boolean) => {
    if (!user) return;
    setIsUpdating(true);
    setNotificationsEnabled(checked); // Optimistic

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: checked })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: checked ? "Notifications Enabled" : "Notifications Disabled",
        description: checked
          ? "You will now receive alerts for activities."
          : "Notification alerts have been muted.",
      });

      // Reload window to reflect header changes or use context update
      // Ideally update context, but reload is safer for quick impl without reload-less context sync
      window.location.reload();

    } catch (error) {
      console.error(error);
      setNotificationsEnabled(!checked); // Revert
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const { success, error } = await deleteUserAccount(user.id);

      if (success) {
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully reset. You will be signed out.",
        });

        // Wait briefly for the toast to be visible
        setTimeout(async () => {
          await signOut();
          navigate("/login");
        }, 1500);
      } else {
        throw new Error(error || "Failed to delete account");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account security and preferences
          </p>
        </div>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage how you receive alerts and reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Enable Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Show the notification bell and receive alerts for assignments
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleToggleNotifications}
                disabled={isUpdating}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-destructive/80">
              Irreversible account actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. Please be certain.
                This action will:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 space-y-1">
                <li>Permanently delete your profile information</li>
                <li>Remove you from all enrolled courses</li>
                <li>Delete your submission history and grades</li>
                <li>Remove your access to the platform immediately</li>
              </ul>
            </div>

            <div className="pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="size-4 mr-2" />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
