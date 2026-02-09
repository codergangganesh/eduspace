import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { deleteUserAccount } from "@/lib/accountService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
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

export default function Settings() {
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);


  const handleDeleteAccount = async () => {
    if (!user || !user.email) return;

    if (!password || confirmText !== "DELETE") {
      toast({
        title: "Validation Failed",
        description: "Please enter your password and type 'DELETE' to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Verify password by attempting to sign in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) {
        throw new Error("Invalid password. Please try again.");
      }

      // 2. Proceed with deletion
      const { success, error } = await deleteUserAccount(user.id);

      if (success) {
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully reset. You will be signed out.",
        });

        // Clear state
        setPassword("");
        setConfirmText("");
        setIsConfirming(false);

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
              <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="size-4 mr-2" />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-destructive">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                      This action cannot be undone. This will permanently delete your
                      account data and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="py-6 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="password">1. Enter your password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Current password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-muted/50"
                        autoComplete="current-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-text">
                        2. Type <span className="font-bold text-foreground">DELETE</span> to confirm
                      </Label>
                      <Input
                        id="confirm-text"
                        type="text"
                        placeholder="Type DELETE"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="bg-muted/50 font-mono"
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex gap-2 items-start">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <span>This dual-verification ensures you are certain about scrubbing your data permanently.</span>
                    </div>
                  </div>

                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel
                      disabled={isDeleting}
                      onClick={() => {
                        setPassword("");
                        setConfirmText("");
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteAccount();
                      }}
                      className="bg-destructive hover:bg-destructive/90 text-white min-w-[120px]"
                      disabled={isDeleting || !password || confirmText !== "DELETE"}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Account"
                      )}
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
