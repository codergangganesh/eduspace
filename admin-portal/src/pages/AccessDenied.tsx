import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, ArrowLeft, ExternalLink, RefreshCw, CheckCircle } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";

export const AccessDenied: React.FC = () => {
  const { user, signOut, refreshProfile, isAdmin } = useAdminAuth();
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  const handleSignOutAndLogin = async () => {
    try {
      await signOut();
      toast.info("Signed out. Please log in with administrator credentials.");
      navigate("/login", { replace: true });
    } catch (err) {
      navigate("/login", { replace: true });
    }
  };

  const handleRecheckPermissions = async () => {
    try {
      setIsChecking(true);
      await refreshProfile();
      if (isAdmin) {
        toast.success("Administrator authorization confirmed!");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error("This account still does not have the 'admin' role in user_roles.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify role.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md border-border text-center shadow-2xl bg-card relative z-10">
        <CardContent className="pt-8 pb-8 px-6 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-2 shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Access Denied</h2>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            You are authenticated as <strong className="text-foreground">{user?.email || "User"}</strong>, but this account does not possess <span className="font-semibold text-destructive">Administrator</span> privileges for Eduspace.
          </p>

          <div className="pt-4 flex flex-col gap-2.5">
            {/* Recheck Role Button */}
            <Button
              variant="default"
              size="sm"
              onClick={handleRecheckPermissions}
              disabled={isChecking}
              className="w-full h-9 font-semibold text-xs shadow-sm shadow-primary/20"
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Re-verifying Permissions..." : "Re-check Admin Permissions"}
            </Button>

            {/* Return to Main Student App */}
            <Button asChild variant="outline" size="sm" className="w-full h-9 text-xs">
              <a href="https://eduspaceacademy.online" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Return to Student & Lecturer Portal
              </a>
            </Button>

            {/* Switch Account */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOutAndLogin}
              className="w-full text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 h-9"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Sign in with an Admin Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
