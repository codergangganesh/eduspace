import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { auditService } from "@/services/audit.service";
import { supabase } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useTheme } from "next-themes";
import {
  User,
  Lock,
  Mail,
  Phone,
  Save,
  CheckCircle,
  Camera,
  Activity,
  KeyRound,
  Eye,
  EyeOff,
  Clock,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
  Trash2,
  Check,
  Palette,
  Edit3,
  X,
  ShieldCheck,
  Sparkles,
  Fingerprint,
  Key,
  Plus,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn, getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { AdminAuditLog } from "@/types";
import {
  passkeyService,
  PasskeyFactor,
  isPasskeySupported,
  getSuggestedPasskeyName,
} from "@/services/passkey.service";
import { AdminPinSecurityCard } from "@/components/auth/AdminPinSecurityCard";
import { AdminMfaSecurityCard } from "@/components/auth/AdminMfaSecurityCard";
import { AndroidIcon } from "@/components/auth/AdminMfaEnrollModal";

type ProfileTab =
  | "personal"
  | "preferences"
  | "2fa"
  | "passkeys"
  | "pin_lock"
  | "password"
  | "activity";

const profileTabs = [
  { id: "personal" as ProfileTab, label: "Personal Info", icon: User },
  { id: "preferences" as ProfileTab, label: "Display Theme", icon: Palette },
  { id: "2fa" as ProfileTab, label: "Two-Factor Auth (2FA)", icon: AndroidIcon },
  { id: "passkeys" as ProfileTab, label: "Passkeys & Biometrics", icon: Fingerprint },
  { id: "pin_lock" as ProfileTab, label: "Profile PIN Lock", icon: ShieldCheck },
  { id: "password" as ProfileTab, label: "Account Password", icon: Lock },
  { id: "activity" as ProfileTab, label: "Activity Log", icon: Activity },
];

export const AdminProfile: React.FC = () => {
  const { user, profile, refreshProfile } = useAdminAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Persistent Avatar & Banner image states
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");

  // Security fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Passkey & WebAuthn states
  const [passkeys, setPasskeys] = useState<PasskeyFactor[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [isAddPasskeyOpen, setIsAddPasskeyOpen] = useState(false);
  const [deletingPasskey, setDeletingPasskey] = useState<PasskeyFactor | null>(null);
  const [isDeletingPasskey, setIsDeletingPasskey] = useState(false);

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

      const savedAvatar =
        profile.avatar_url ||
        localStorage.getItem("eduspace_admin_avatar") ||
        (profile.user_id ? localStorage.getItem(`admin_avatar_${profile.user_id}`) : "") ||
        "";

      const savedBanner =
        (profile as any).cover_url ||
        (profile as any).banner_url ||
        localStorage.getItem("eduspace_admin_banner") ||
        (profile.user_id ? localStorage.getItem(`admin_banner_${profile.user_id}`) : "") ||
        "";

      if (savedAvatar) setAvatarUrl(savedAvatar);
      if (savedBanner) setBannerUrl(savedBanner);
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === "activity") {
      fetchAdminLogs();
    } else if (activeTab === "passkeys") {
      fetchPasskeys();
    }
  }, [activeTab]);

  const fetchPasskeys = async () => {
    try {
      setIsLoadingPasskeys(true);
      const { data, error } = await passkeyService.listPasskeys();
      if (!error && data) {
        setPasskeys(data);
      }
    } catch (err) {
      console.error("Error fetching passkeys:", err);
    } finally {
      setIsLoadingPasskeys(false);
    }
  };

  const handleOpenAddPasskey = () => {
    setPasskeyName(getSuggestedPasskeyName());
    setIsAddPasskeyOpen(true);
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyName.trim()) {
      toast.error("Please enter a device name for this passkey.");
      return;
    }

    try {
      setIsRegisteringPasskey(true);
      const { data, error } = await passkeyService.registerPasskey(passkeyName.trim());

      if (error) {
        toast.error(error);
        return;
      }

      toast.success("Passkey registered successfully! You can now sign in using your biometric sensor or security key.");
      setIsAddPasskeyOpen(false);
      setPasskeyName("");
      await fetchPasskeys();

      if (user) {
        await auditService.logAction({
          action: "REGISTER_PASSKEY" as any,
          targetUserId: user.id,
          targetEmail: user.email,
          details: { friendly_name: passkeyName.trim() },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to register passkey.");
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleConfirmDeletePasskey = async () => {
    if (!deletingPasskey) return;

    try {
      setIsDeletingPasskey(true);
      const { success, error } = await passkeyService.removePasskey(deletingPasskey.id);

      if (!success || error) {
        toast.error(error || "Failed to remove passkey.");
        return;
      }

      toast.success(`Passkey "${deletingPasskey.friendly_name}" removed successfully.`);
      setDeletingPasskey(null);
      await fetchPasskeys();

      if (user) {
        await auditService.logAction({
          action: "REMOVE_PASSKEY" as any,
          targetUserId: user.id,
          targetEmail: user.email,
          details: { friendly_name: deletingPasskey.friendly_name },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete passkey.");
    } finally {
      setIsDeletingPasskey(false);
    }
  };

  const fetchAdminLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await auditService.getAuditLogs({ pageSize: 15 });
      setRecentLogs(res.data || []);
    } catch (err) {
      console.error("Error fetching audit logs for profile:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Direct Avatar Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile photo file size must be less than 5MB.");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const res = await uploadToCloudinary(file);

      if (res?.url) {
        setAvatarUrl(res.url);
        localStorage.setItem("eduspace_admin_avatar", res.url);
        localStorage.setItem(`admin_avatar_${user.id}`, res.url);

        await supabase
          .from("profiles")
          .update({
            avatar_url: res.url,
            updated_at: new Date().toISOString(),
          })
          .or(`user_id.eq.${user.id},id.eq.${user.id}`);

        if (user.email) {
          await supabase
            .from("profiles")
            .update({ avatar_url: res.url, updated_at: new Date().toISOString() })
            .ilike("email", user.email);
        }

        try {
          await supabase.auth.updateUser({ data: { avatar_url: res.url } });
        } catch (_) { }

        await auditService.logAction({
          action: "UPDATE_AVATAR",
          targetUserId: user.id,
          targetEmail: user.email,
          details: { avatar_url: res.url },
        });

        await refreshProfile();
        toast.success("Profile photo updated successfully!");
      }
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast.error(err.message || "Failed to upload profile photo.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    try {
      setAvatarUrl("");
      localStorage.removeItem("eduspace_admin_avatar");
      localStorage.removeItem(`admin_avatar_${user.id}`);

      await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .or(`user_id.eq.${user.id},id.eq.${user.id}`);

      if (user.email) {
        await supabase
          .from("profiles")
          .update({ avatar_url: null, updated_at: new Date().toISOString() })
          .ilike("email", user.email);
      }

      try {
        await supabase.auth.updateUser({ data: { avatar_url: null } });
      } catch (_) { }

      await refreshProfile();
      toast.success("Profile photo removed.");
    } catch (err: any) {
      toast.error("Failed to remove avatar.");
    }
  };

  // Direct Banner Upload
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Banner image file size must be less than 8MB.");
      return;
    }

    try {
      setIsUploadingBanner(true);
      const res = await uploadToCloudinary(file);

      if (res?.url) {
        setBannerUrl(res.url);
        localStorage.setItem("eduspace_admin_banner", res.url);
        localStorage.setItem(`admin_banner_${user.id}`, res.url);

        await supabase
          .from("profiles")
          .update({
            cover_url: res.url,
            updated_at: new Date().toISOString(),
          })
          .or(`user_id.eq.${user.id},id.eq.${user.id}`);

        if (user.email) {
          await supabase
            .from("profiles")
            .update({ cover_url: res.url, updated_at: new Date().toISOString() })
            .ilike("email", user.email);
        }

        try {
          await supabase.auth.updateUser({ data: { cover_url: res.url } });
        } catch (_) { }

        await auditService.logAction({
          action: "UPDATE_BANNER",
          targetUserId: user.id,
          targetEmail: user.email,
          details: { cover_url: res.url },
        });

        await refreshProfile();
        toast.success("Profile banner updated successfully!");
      }
    } catch (err: any) {
      console.error("Banner upload failed:", err);
      toast.error(err.message || "Failed to upload banner image.");
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleRemoveBanner = async () => {
    if (!user) return;
    try {
      setBannerUrl("");
      localStorage.removeItem("eduspace_admin_banner");
      localStorage.removeItem(`admin_banner_${user.id}`);

      await supabase
        .from("profiles")
        .update({ cover_url: null, updated_at: new Date().toISOString() })
        .or(`user_id.eq.${user.id},id.eq.${user.id}`);

      if (user.email) {
        await supabase
          .from("profiles")
          .update({ cover_url: null, updated_at: new Date().toISOString() })
          .ilike("email", user.email);
      }

      try {
        await supabase.auth.updateUser({ data: { cover_url: null } });
      } catch (_) { }

      await refreshProfile();
      toast.success("Custom banner removed.");
    } catch (err: any) {
      toast.error("Failed to remove banner.");
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
          updated_at: new Date().toISOString(),
        })
        .or(`user_id.eq.${user.id},id.eq.${user.id}`);

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
      console.error("Save profile error:", err);
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
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error("Password must contain uppercase letters, lowercase letters, and at least one number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsUpdatingPassword(true);

      // Verify current password if provided
      if (currentPassword && user?.email) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (verifyErr) {
          toast.error("Current password is incorrect.");
          setIsUpdatingPassword(false);
          return;
        }
      }

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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const displayName = profile?.full_name || fullName || "Administrator";
  const displayEmail = user?.email || "";
  const displayAvatar = avatarUrl || profile?.avatar_url || "";
  const displayInitials = getInitials(displayName);
  const bioMaxLength = 300;
  const bioRemaining = bioMaxLength - bio.length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-1 sm:px-0 pb-24 lg:pb-8">
      {/* Hidden File Inputs for Direct Avatar & Banner Upload */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileChange}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerFileChange}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            <h1 className="text-base sm:text-2xl font-black tracking-tight text-foreground truncate flex items-center gap-2">
              <User className="h-4 w-4 sm:h-6 sm:w-6 text-primary shrink-0" />
              Admin Profile & Settings
            </h1>
            <Badge variant="default" className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-primary shrink-0 whitespace-nowrap">
              Super Admin
            </Badge>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
            Manage your personal profile, uploaded photos, display theme, and security.
          </p>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
        {/* Left Column (Desktop Only): Profile Card & Vertical Tab Navigation */}
        <div className="hidden lg:block w-72 shrink-0 space-y-4">
          <Card className="border-border shadow-sm overflow-hidden bg-card">
            <div className="p-5 flex flex-col items-center text-center border-b border-border/60 bg-muted/20">
              {/* Avatar with Click to Change */}
              <div className="relative group/avatar mb-2.5">
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/65 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer gap-1"
                  title="Click to upload profile photo"
                >
                  <Camera className={cn("h-4 w-4", isUploadingAvatar && "animate-spin")} />
                  <span>{isUploadingAvatar ? "..." : "Upload"}</span>
                </button>
              </div>

              <h3 className="font-bold text-base text-foreground leading-tight">{displayName}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-full">
                {displayEmail}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider bg-primary">
                  Super Admin
                </Badge>
                <Badge variant="outline" className="text-[10px] font-semibold text-emerald-500 border-emerald-500/30">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              </div>

              {/* Quick Image Action Buttons */}
              <div className="mt-2.5 flex items-center justify-center gap-2 pt-2 border-t border-border/50 w-full">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Upload Photo
                </button>
                {displayAvatar && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-xs font-semibold text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Vertical Tab Navigation */}
            <div className="p-2 flex flex-col gap-1.5">
              {profileTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-bold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Hero Banner + Active Content Panel */}
        <div className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6">
          {/* Responsive Hero Banner & Profile Header Card */}
          <Card className="border-border shadow-sm overflow-hidden bg-card relative">
            {/* Banner Image Container with Correct Mobile Fit */}
            <div
              className={cn(
                "h-32 sm:h-44 md:h-48 w-full relative transition-all duration-300 group/banner",
                !bannerUrl && "bg-gradient-to-r from-primary/35 via-primary/20 to-sky-600/30"
              )}
              style={
                bannerUrl
                  ? {
                    backgroundImage: `url(${bannerUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                  : undefined
              }
            >
              <div className="absolute inset-0 bg-black/20 group-hover/banner:bg-black/35 transition-colors" />

              {/* Banner Action Buttons */}
              <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-1.5 sm:gap-2 z-10">
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    title="Remove custom banner image"
                    className="size-7 sm:size-8 rounded-full bg-black/75 hover:bg-destructive text-white border border-white/20 shadow-md flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  title="Upload banner image"
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/75 hover:bg-black/90 text-white border border-white/20 shadow-md flex items-center gap-1.5 backdrop-blur-md text-[11px] font-semibold cursor-pointer transition-all"
                >
                  <Camera className={cn("h-3.5 w-3.5", isUploadingBanner && "animate-spin")} />
                  <span>{isUploadingBanner ? "Uploading..." : "Change Banner"}</span>
                </button>
              </div>
            </div>

            {/* Profile Avatar & Info Row (Correct Mobile Alignment) */}
            <div className="px-3 sm:px-6 pb-4 sm:pb-6 pt-0 relative flex items-end justify-between gap-3 -mt-9 sm:-mt-12">
              <div className="flex items-end gap-3 sm:gap-4 min-w-0 flex-1">
                {/* Hero Avatar with Quick Upload Click */}
                <div className="relative group/heroAvatar shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-3 sm:border-4 border-card shadow-xl rounded-2xl overflow-hidden cursor-pointer">
                    <AvatarImage src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg sm:text-2xl font-extrabold rounded-2xl w-full h-full flex items-center justify-center">
                      {displayInitials}
                    </AvatarFallback>
                  </Avatar>

                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 rounded-2xl bg-black/65 opacity-0 group-hover/heroAvatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer gap-1 z-10"
                    title="Click to upload profile photo"
                  >
                    <Camera className={cn("h-4 w-4", isUploadingAvatar && "animate-spin")} />
                    <span>{isUploadingAvatar ? "..." : "Photo"}</span>
                  </button>
                </div>

                <div className="mb-0.5 sm:mb-1 min-w-0 flex-1">
                  <h2 className="text-base sm:text-xl font-extrabold text-foreground truncate leading-tight">
                    {displayName}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate mt-0.5">
                    {department}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 sm:hidden">
                    <Badge variant="default" className="text-[9px] font-bold py-0 px-1.5 bg-primary">
                      Super Admin
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-xs font-semibold gap-1.5 py-1 px-3">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Active Session
                </Badge>
              </div>
            </div>
          </Card>

          {/* Mobile Horizontal Scrollable Tab Navigation (lg:hidden) */}
          <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-1.5 p-1.5 bg-card border border-border/80 rounded-2xl shadow-xs">
            {profileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Personal Information with Inline Edit Button */}
          {activeTab === "personal" && (
            <Card className="border-border shadow-sm bg-card animate-in fade-in duration-200">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-border/40">
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4 text-primary shrink-0" />
                    Personal & Institutional Details
                  </CardTitle>
                  <CardDescription className="text-xs truncate sm:whitespace-normal">
                    Public and institutional identity parameters for your administrator profile.
                  </CardDescription>
                </div>

                <Button
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-semibold h-8 shrink-0 gap-1"
                >
                  {isEditing ? (
                    <>

                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>

              <form onSubmit={handleSaveProfile}>
                <CardContent className="space-y-4 pt-4 sm:pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Full Name</Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={!isEditing}
                        placeholder="Admin Full Name"
                        className="h-9 sm:h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Admin Email (Identity)</Label>
                      <Input
                        value={displayEmail}
                        disabled
                        className="h-9 sm:h-10 text-sm bg-muted/50 cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Contact Phone</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                        placeholder="+91 98765 43210"
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Assigned Department / Unit</Label>
                      <Input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={!isEditing}
                        placeholder="e.g. Central IT / Academic Administration"
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">City</Label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!isEditing}
                        placeholder="City"
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">State / Region</Label>
                      <Input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        disabled={!isEditing}
                        placeholder="State"
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Country</Label>
                      <Input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={!isEditing}
                        placeholder="Country"
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Administrator Bio</Label>
                      <span className="text-[11px] text-muted-foreground">
                        {bioRemaining} characters left
                      </span>
                    </div>
                    <Textarea
                      value={bio}
                      onChange={(e) => {
                        if (e.target.value.length <= bioMaxLength) {
                          setBio(e.target.value);
                        }
                      }}
                      disabled={!isEditing}
                      placeholder="Write a brief professional summary about your role and responsibilities..."
                      className="min-h-[90px] text-sm resize-none"
                    />
                  </div>
                </CardContent>

                {isEditing && (
                  <CardFooter className="pt-2 pb-4 border-t border-border/40 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving}
                      className="text-xs font-semibold shadow-md shadow-primary/20 gap-1.5"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          Save Profile Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </form>
            </Card>
          )}

          {/* TAB 2: Display Theme & Visual Preferences */}
          {activeTab === "preferences" && (
            <Card className="border-border shadow-sm bg-card animate-in fade-in duration-200">
              <CardHeader className="pb-3 sm:pb-4 border-b border-border/40">
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                  <Palette className="h-4 w-4 text-primary shrink-0" />
                  Appearance & Display Theme
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose the color theme and appearance for your Administrator portal.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4 sm:pt-5 max-w-md">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">Select Display Theme</Label>
                  <Select value={theme || "system"} onValueChange={(val) => setTheme(val)}>
                    <SelectTrigger className="w-full h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Select display theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4 text-amber-500" />
                          <span>Light Mode</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-blue-500" />
                          <span>Dark Mode</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-emerald-500" />
                          <span>System Default (Auto)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>


              </CardContent>
            </Card>
          )}

          {/* TAB 3: Two-Factor Authentication (2FA / TOTP) */}
          {activeTab === "2fa" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <AdminMfaSecurityCard />
            </div>
          )}

          {/* TAB 4: Passkeys & Biometric Security */}
          {activeTab === "passkeys" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                        <Fingerprint className="h-4 w-4 text-primary shrink-0" />
                        Passkeys & Biometric Authentication
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 py-0.5 px-2 uppercase tracking-wider shrink-0 whitespace-nowrap">
                        FIDO2 / WebAuthn
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      Log in to the Admin Portal instantly using Windows Hello, Touch ID, Face ID, or a hardware security key (YubiKey).
                    </CardDescription>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenAddPasskey}
                    className="text-xs font-semibold shadow-sm gap-1.5 h-8 sm:h-9 w-full sm:w-auto shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Register New Passkey
                  </Button>
                </CardHeader>

                <CardContent className="pt-4 sm:pt-5 space-y-4">
                  {/* Browser Compatibility Notice */}
                  {!isPasskeySupported() ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2.5">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>
                        WebAuthn / Passkeys are not supported on this browser. You can continue using password authentication.
                      </span>
                    </div>
                  ) : null}

                  {/* Passkeys List */}
                  {isLoadingPasskeys ? (
                    <div className="space-y-2.5 py-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-xl" />
                      ))}
                    </div>
                  ) : passkeys.length === 0 ? (
                    <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-border/70 bg-muted/10 space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Key className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-foreground">No Passkeys Registered</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Add a passkey to enable biometric authentication on this workstation or hardware security keys.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenAddPasskey}
                        className="text-xs font-semibold gap-1.5 h-8 cursor-pointer"
                      >
                        <Fingerprint className="h-3.5 w-3.5 text-primary" />
                        Create Your First Passkey
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {passkeys.map((factor) => {
                        const nameLower = factor.friendly_name.toLowerCase();
                        const isGoogle = nameLower.includes("google") || nameLower.includes("password manager") || nameLower.includes("chrome");
                        const isApple = nameLower.includes("apple") || nameLower.includes("mac") || nameLower.includes("iphone") || nameLower.includes("ipad");
                        const isWindows = nameLower.includes("windows");
                        const isMobile = nameLower.includes("phone") || nameLower.includes("android");

                        const DeviceIcon = isWindows ? Laptop : isMobile ? Smartphone : isApple ? Fingerprint : Key;

                        return (
                          <div
                            key={factor.id}
                            className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-all shadow-xs gap-3"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className={cn(
                                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0",
                                isGoogle
                                  ? "bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs"
                                  : "bg-primary/10 text-primary"
                              )}>
                                {isGoogle ? (
                                  <svg className="h-4.5 w-4.5 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                      fill="#4285F4"
                                    />
                                    <path
                                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                      fill="#34A853"
                                    />
                                    <path
                                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                      fill="#FBBC05"
                                    />
                                    <path
                                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                      fill="#EA4335"
                                    />
                                  </svg>
                                ) : (
                                  <DeviceIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                                    {factor.friendly_name}
                                  </p>
                                  <Badge variant="outline" className="text-[9px] sm:text-[10px] font-semibold text-emerald-500 border-emerald-500/30 py-0 px-1.5 shrink-0 whitespace-nowrap">
                                    Active
                                  </Badge>
                                </div>
                                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                                  Added on {formatDate(factor.created_at)}
                                </p>
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingPasskey(factor)}
                              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 sm:px-2.5 shrink-0 gap-1 cursor-pointer"
                              title="Remove this passkey"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Remove</span>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: 4-Digit In-App Screen Lock (PIN & Biometrics) */}
          {activeTab === "pin_lock" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <AdminPinSecurityCard />
            </div>
          )}

          {/* TAB 6: Account Password Management */}
          {activeTab === "password" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Card className="border-border shadow-sm bg-card">
                <CardHeader className="pb-3 sm:pb-4 border-b border-border/40">
                  <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                    <Lock className="h-4 w-4 text-primary shrink-0" />
                    Account Password Management
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your administrator account password as a fallback sign-in method.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handlePasswordChange}>
                  <CardContent className="space-y-4 pt-4 sm:pt-5 max-w-lg">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Current Password</Label>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="h-9 sm:h-10 text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">New Administrator Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="h-9 sm:h-10 text-sm pr-10"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Minimum 8 characters with uppercase, lowercase, and numbers.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Confirm New Password</Label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="h-9 sm:h-10 text-sm"
                        required
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-2.5 text-xs text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        Administrative credentials provide privileged access to institutional data. Use a strong, unique password.
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 pb-4 border-t border-border/40 flex items-center justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isUpdatingPassword || !newPassword}
                      className="text-xs font-semibold shadow-md shadow-primary/20 gap-1.5 cursor-pointer"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <KeyRound className="h-3.5 w-3.5" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}

              {/* Add Passkey Modal Dialog */}
              <Dialog open={isAddPasskeyOpen} onOpenChange={setIsAddPasskeyOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-primary" />
                      Register New Passkey
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Enter a recognizable name for this device or security key, then complete the biometric prompt.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleRegisterPasskey} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="passkey-name" className="text-xs font-semibold">
                        Passkey Device Name
                      </Label>
                      <Input
                        id="passkey-name"
                        value={passkeyName}
                        onChange={(e) => setPasskeyName(e.target.value)}
                        placeholder="e.g. MacBook Pro Touch ID / Windows Hello"
                        className="h-10 text-sm"
                        disabled={isRegisteringPasskey}
                        autoFocus
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">
                        This label helps you identify this authenticator in your security settings.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-start gap-2.5">
                      <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        When you click continue, your operating system will display its native Windows Hello / Touch ID / Security Key verification dialog.
                      </span>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddPasskeyOpen(false)}
                        disabled={isRegisteringPasskey}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isRegisteringPasskey || !passkeyName.trim()}
                        className="text-xs font-semibold gap-1.5 shadow-md"
                      >
                        {isRegisteringPasskey ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Verifying Device...
                          </>
                        ) : (
                          <>
                            <Fingerprint className="h-3.5 w-3.5" />
                            Continue to Verify
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Delete Passkey Confirmation Dialog */}
              <AlertDialog open={Boolean(deletingPasskey)} onOpenChange={(open) => !open && setDeletingPasskey(null)}>
                <AlertDialogContent className="sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
                      <Trash2 className="h-5 w-5" />
                      Remove Passkey?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs leading-relaxed">
                      Are you sure you want to remove <strong>"{deletingPasskey?.friendly_name}"</strong>? You will no longer be able to sign in using this biometric authenticator until you re-register it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
                    <AlertDialogCancel
                      disabled={isDeletingPasskey}
                      onClick={() => setDeletingPasskey(null)}
                      className="text-xs"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleConfirmDeletePasskey();
                      }}
                      disabled={isDeletingPasskey}
                      className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingPasskey ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Removing...
                        </>
                      ) : (
                        "Remove Passkey"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

          {/* TAB 7: Admin Activity Log */}
          {activeTab === "activity" && (
            <Card className="border-border shadow-sm bg-card animate-in fade-in duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4 border-b border-border/40">
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                    <Activity className="h-4 w-4 text-primary shrink-0" />
                    Administrative Actions & Telemetry
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your recent administrative events recorded on this portal.
                  </CardDescription>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAdminLogs}
                  disabled={isLoadingLogs}
                  className="h-8 text-xs font-medium gap-1"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isLoadingLogs && "animate-spin")} />
                  Refresh
                </Button>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                {isLoadingLogs ? (
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 bg-muted/60 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : recentLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No recent administrative activity recorded for this session.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-mono capitalize py-0 px-1.5">
                              {log.action.replace("_", " ")}
                            </Badge>
                            <span className="font-semibold text-foreground truncate">
                              {log.target_email || "System-wide"}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] text-muted-foreground shrink-0">
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

      {/* ── Sticky Mobile Bottom Navigation Bar ──────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/80 px-2 py-1.5 flex items-center justify-around lg:hidden shadow-2xl safe-area-inset-bottom">
        {profileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative cursor-pointer",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  isActive ? "bg-primary/15 text-primary scale-110" : ""
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
