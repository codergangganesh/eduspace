import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { auditService } from "@/services/audit.service";
import { supabase } from "@/lib/supabase";
import {
  User,
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  Calendar,
  Save,
  CheckCircle,
  Camera,
  Activity,
  KeyRound,
  Eye,
  EyeOff,
  Building,
  MapPin,
  Clock,
  Sparkles,
  RefreshCw,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn, getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { AdminAuditLog } from "@/types";

type ProfileTab = "personal" | "admin_scope" | "security" | "activity";

const profileTabs = [
  { id: "personal" as ProfileTab, label: "Personal Info", icon: User },
  { id: "admin_scope" as ProfileTab, label: "Admin Privileges", icon: Shield },
  { id: "security" as ProfileTab, label: "Security & Password", icon: Lock },
  { id: "activity" as ProfileTab, label: "Admin Activity Log", icon: Activity },
];

export const AdminProfile: React.FC = () => {
  const { user, profile, refreshProfile } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields matching EduSpace profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Security tab fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Activity logs
  const [recentLogs, setRecentLogs] = useState<AdminAuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
      setDepartment(profile.department || "System Administration");
      setCity(profile.city || "");
      setState(profile.state || "");
      setCountry(profile.country || "India");
      setEmailNotifications(profile.email_notifications ?? true);
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === "activity" && user?.id) {
      fetchAdminLogs(user.id);
    }
  }, [activeTab, user?.id]);

  const fetchAdminLogs = async (adminId: string) => {
    try {
      setIsLoadingLogs(true);
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .eq("admin_id", adminId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentLogs(data as AdminAuditLog[]);
      }
    } catch (err) {
      console.error("Failed to load admin logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
          department: department.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          email_notifications: emailNotifications,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await auditService.logAction({
        action: "UPDATE_PROFILE",
        targetUserId: user.id,
        targetEmail: user.email,
        details: { updated_fields: ["full_name", "phone", "bio", "department"] },
      });

      await refreshProfile();
      toast.success("Admin profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      if (user) {
        await auditService.logAction({
          action: "CHANGE_PASSWORD",
          targetUserId: user.id,
          targetEmail: user.email,
        });
      }

      toast.success("Administrator password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const displayName = profile?.full_name || "Administrator";
  const displayEmail = user?.email || "";
  const displayAvatar = profile?.avatar_url || "";
  const displayInitials = getInitials(displayName);
  const bioMaxLength = 300;
  const bioRemaining = bioMaxLength - bio.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <User className="h-6 w-6 text-primary" />
            Admin Profile & Account Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your administrative identity, credentials, role parameters, and system audit trail.
          </p>
        </div>

        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-semibold self-start sm:self-auto"
        >
          {isEditing ? "Cancel Editing" : "Edit Profile Details"}
        </Button>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Quick Profile Card & Navigation Tabs */}
        <div className="w-full lg:w-72 shrink-0 space-y-4 sticky top-6">
          <Card className="border-border shadow-sm overflow-hidden bg-card">
            <div className="p-5 flex flex-col items-center text-center border-b border-border/60 bg-muted/20">
              <div className="relative group/avatar mb-3">
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h3 className="font-bold text-base text-foreground leading-tight">{displayName}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-full">
                {displayEmail}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider bg-primary">
                  Super Admin
                </Badge>
                <Badge variant="outline" className="text-[10px] font-semibold text-emerald-500 border-emerald-500/30">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              </div>
            </div>

            {/* Vertical Tab Navigation */}
            <div className="p-2 space-y-1">
              {profileTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-bold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Quick System Summary */}
          <Card className="border-border shadow-sm p-4 text-xs space-y-2 bg-card">
            <div className="font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Security Governance
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Full database write authorization and cryptographic session tokens active.
            </p>
            <div className="pt-2 text-[10px] text-muted-foreground border-t border-border/50">
              Joined: <span className="font-mono text-foreground font-medium">{formatDate(user?.created_at || "")}</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Main Content Panels */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Header Banner Card (matching student profile hero banner) */}
          <Card className="border-border shadow-sm overflow-hidden bg-card">
            <div className="h-28 sm:h-36 bg-gradient-to-r from-primary/30 via-primary/10 to-blue-600/20 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
            </div>

            <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
              <div className="flex items-end gap-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl rounded-2xl">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-extrabold rounded-2xl">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="mb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-foreground">{displayName}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{department}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-semibold gap-1.5 py-1 px-3">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Active Session
                </Badge>
              </div>
            </div>
          </Card>

          {/* TAB 1: Personal Information */}
          {activeTab === "personal" && (
            <Card className="border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Personal & Institutional Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Public and institutional identity parameters for your administrator profile.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSaveProfile}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Full Name</Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={!isEditing}
                        placeholder="Admin Full Name"
                        className="h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Admin Email (Identity)</Label>
                      <Input
                        value={displayEmail}
                        disabled
                        className="h-10 text-sm bg-muted/50 cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Contact Phone</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                        placeholder="+91 98765 43210"
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Assigned Department / Unit</Label>
                      <Input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={!isEditing}
                        placeholder="e.g. Central IT / Academic Administration"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">City</Label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!isEditing}
                        placeholder="City"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">State / Region</Label>
                      <Input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        disabled={!isEditing}
                        placeholder="State"
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Country</Label>
                      <Input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={!isEditing}
                        placeholder="Country"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Bio / Administrative Scope</Label>
                      {isEditing && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {bioRemaining} characters left
                        </span>
                      )}
                    </div>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, bioMaxLength))}
                      disabled={!isEditing}
                      placeholder="Write a brief description of your administrative responsibilities..."
                      className="min-h-[90px] text-sm resize-y"
                    />
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Email Notifications</p>
                      <p className="text-[11px] text-muted-foreground">Receive critical platform security digests via email</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>

                {isEditing && (
                  <CardFooter className="pt-2">
                    <Button type="submit" disabled={isSaving} className="text-xs font-semibold">
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      {isSaving ? "Saving changes..." : "Save Profile Details"}
                    </Button>
                  </CardFooter>
                )}
              </form>
            </Card>
          )}

          {/* TAB 2: Administrative Scope & Privileges */}
          {activeTab === "admin_scope" && (
            <Card className="border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Administrator Scope & Access Privileges
                </CardTitle>
                <CardDescription className="text-xs">
                  Active policy permissions granted to your administrative account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      User Governance
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Capability to suspend, activate, promote to admin, or permanently delete student and faculty profiles.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Academic Oversight
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Cross-departmental visibility over all enrolled courses, classes, assignments, and submitted quizzes.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Communication Moderation
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Oversight of user messaging threads and dispatch authority for institution-wide targeted broadcast announcements.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Audit & Compliance Trail
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Immutable logging of all administrative operations stored directly in the <code className="font-mono text-primary">admin_audit_logs</code> table.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: Security & Password */}
          {activeTab === "security" && (
            <Card className="border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Security & Authentication
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your administrator account password and review security protocols.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handlePasswordChange}>
                <CardContent className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">New Administrator Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="h-10 text-sm pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Confirm New Password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-10 text-sm"
                      required
                    />
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button type="submit" disabled={isUpdatingPassword} className="text-xs font-semibold">
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    {isUpdatingPassword ? "Updating Password..." : "Update Admin Password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* TAB 4: Admin Audit Activity */}
          {activeTab === "activity" && (
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Recent Administrative Actions
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Audit log history of actions performed by your administrator account.
                  </CardDescription>
                </div>
                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAdminLogs(user.id)}
                    disabled={isLoadingLogs}
                    className="text-xs h-8"
                  >
                    <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isLoadingLogs && "animate-spin")} />
                    Refresh
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">Loading recent actions...</div>
                ) : recentLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    No recent administrative actions recorded for this account.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg border border-border bg-muted/20 text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-foreground">
                            {log.action}
                            {log.target_email && (
                              <span className="text-muted-foreground font-normal"> on {log.target_email}</span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {JSON.stringify(log.details)}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
