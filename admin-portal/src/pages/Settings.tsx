import * as React from "react";
import { useState, useEffect } from "react";
import { adminService } from "@/services/admin.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { UserAvatar } from "@/components/users/UserAvatar";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  UserPlus,
  Settings as SettingsIcon,
  CheckCircle2,
  Server,
  Lock,
  AlertTriangle,
  Power,
  Scale,
  FlaskConical,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { Badge } from "@/components/ui/badge";
import { LEGAL_VERSIONS } from "@/services/legal.service";

export const Settings: React.FC = () => {
  const { isMaintenanceMode, setMaintenanceMode } = useMaintenanceMode();
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteUserId, setPromoteUserId] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setIsLoadingAdmins(true);
      const data = await adminService.getAdmins();
      setAdmins(data);
    } catch (err) {
      console.error("Error loading admins:", err);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleLookupAndPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteEmail.trim()) {
      toast.error("Please enter a user's email address.");
      return;
    }

    try {
      // Find user profile by email
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .eq("email", promoteEmail.trim())
        .maybeSingle();

      if (error || !profile) {
        toast.error("No registered user found with that email address.");
        return;
      }

      setTargetUser(profile);
      setPromoteUserId(profile.user_id);
      setPromoteModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to find user.");
    }
  };

  const handleConfirmPromotion = async () => {
    if (!promoteUserId || !targetUser) return;

    try {
      setIsPromoting(true);
      const res = await adminService.promoteToAdmin(promoteUserId, targetUser.email);
      if (res.success) {
        toast.success(`Successfully promoted ${targetUser.full_name} (${targetUser.email}) to Administrator!`);
        setPromoteEmail("");
        setTargetUser(null);
        setPromoteUserId(null);
        setPromoteModalOpen(false);
        loadAdmins();
      } else {
        toast.error(res.error || "Failed to promote user.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to promote user.");
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Settings & Governance</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage platform administrators, system configurations, and security policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Admin Team & Promotion */}
        <div className="lg:col-span-7 space-y-6">
          {/* Add Administrator Tool */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                Grant Administrator Access
              </CardTitle>
              <CardDescription className="text-xs">
                Promote an existing registered Eduspace user to full Administrator status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookupAndPromote} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">User Email Address</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={promoteEmail}
                      onChange={(e) => setPromoteEmail(e.target.value)}
                      placeholder="e.g. professor.sharma@eduspace.edu"
                      className="h-10 text-sm"
                      required
                    />
                    <Button type="submit" className="h-10 text-xs font-semibold shrink-0">
                      Lookup & Promote
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Active Administrators List */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Active Platform Administrators ({admins.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Users with complete administrative permissions across the Eduspace portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAdmins ? (
                <div className="space-y-3 py-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : admins.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">No admins found.</p>
              ) : (
                <div className="space-y-2.5">
                  {admins.map((adm) => (
                    <div
                      key={adm.user_id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/80"
                    >
                      <div className="flex items-center space-x-3">
                        <UserAvatar name={adm.full_name} avatarUrl={adm.avatar_url} size="md" />
                        <div>
                          <p className="font-semibold text-sm text-foreground leading-tight">
                            {adm.full_name || "Administrator"}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {adm.email}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded">
                          Super Admin
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Joined {formatDate(adm.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Platform Configuration Info */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                Environment Configuration
              </CardTitle>
              <CardDescription className="text-xs">
                Active connection endpoints and backend parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              {/* <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Supabase Project URL</span>
                <p className="font-mono text-foreground font-semibold p-2 rounded bg-muted/40 border border-border truncate">
                  {import.meta.env.VITE_SUPABASE_URL || "Configured via .env"}
                </p>
              </div> */}

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Admin Portal Endpoint</span>
                <div className="font-mono text-foreground font-semibold p-2 rounded bg-muted/40 border border-border flex items-center justify-between gap-2">
                  <span className="truncate">https://admin.eduspaceacademy.online</span>
                  <a
                    href="https://admin.eduspaceacademy.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground px-2.5 py-1 rounded transition-colors shrink-0"
                  >
                    Open
                  </a>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium">Main Application URL</span>
                <div className="font-mono text-foreground font-semibold p-2 rounded bg-muted/40 border border-border flex items-center justify-between gap-2">
                  <span className="truncate">https://eduspaceacademy.online</span>
                  <a
                    href="https://eduspaceacademy.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground px-2.5 py-1 rounded transition-colors shrink-0"
                  >
                    Open
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Mode Governance Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Platform Maintenance Mode
                </CardTitle>
                <Badge
                  variant={isMaintenanceMode ? "destructive" : "outline"}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  {isMaintenanceMode ? "Active" : "Normal Mode"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Restricts platform access for scheduled maintenance and security upgrades.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <p className="text-xs text-muted-foreground">
                When enabled, a warning banner will appear across the portal and student access will be restricted.
              </p>
              <Button
                type="button"
                variant={isMaintenanceMode ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  const next = !isMaintenanceMode;
                  setMaintenanceMode(next);
                  if (next) {
                    toast.warning("Platform Maintenance Mode enabled! Warning banner is now active.");
                  } else {
                    toast.success("Platform Maintenance Mode disabled. Normal operations resumed.");
                  }
                }}
                className="w-full text-xs font-semibold h-9 gap-1.5"
              >
                <Power className="h-3.5 w-3.5" />
                {isMaintenanceMode ? "Deactivate Maintenance Mode" : "Enable Maintenance Mode"}
              </Button>
            </CardContent>
          </Card>


        </div>
      </div>

      {/* Promotion Confirmation Modal */}
      <ConfirmationModal
        open={promoteModalOpen}
        onOpenChange={setPromoteModalOpen}
        title="Promote User to Administrator?"
        description={`You are about to give ${targetUser?.full_name} (${targetUser?.email}) full administrative permissions to manage all students, faculty, and system data.`}
        confirmText="Promote to Administrator"
        variant="default"
        requireInput="CONFIRM"
        inputLabel='Type "CONFIRM" to authorize administrator promotion:'
        onConfirm={handleConfirmPromotion}
        isLoading={isPromoting}
      />
    </div>
  );
};
