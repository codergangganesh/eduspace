import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth, Profile as ProfileType } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext"; // Added for theme management
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  GraduationCap,
  Shield,
  Bell,
  Settings,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Camera,
  Save,
  BookOpen,
  Award,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  Globe,
  Palette,
  Loader2,
  Upload,
  Share2,
  Copy,
  ExternalLink,
  MapPin,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { ProfileNotificationSettings } from "@/components/ProfileNotificationSettings";

const profileTabs = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "academic", label: "Academic Details", icon: GraduationCap },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Settings },
];

export default function Profile() {
  const { user, profile, isAuthenticated, isLoading: authLoading, updateProfile, role } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    bio: "",
    street: "",
    city: "",
    state: "",
    zip_code: "",
    country: "United States",
    // Academic
    student_id: "",
    program: "",
    year: "",
    department: "",
    gpa: "",
    credits_completed: "",
    credits_required: "",
    advisor: "",
    enrollment_date: "",
    expected_graduation: "",
    // Notifications
    notifications_enabled: true,
    // Preferences
    language: "en",
    timezone: "America/New_York",
    theme: "system",
    batch: "",
    hod_name: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        date_of_birth: profile.date_of_birth || "",
        bio: profile.bio || "",
        street: profile.street || "",
        city: profile.city || "",
        state: profile.state || "",
        zip_code: profile.zip_code || "",
        country: profile.country || "United States",
        student_id: profile.student_id || "",
        program: profile.program || "",
        year: profile.year || "",
        department: profile.department || "",
        gpa: profile.gpa?.toString() || "",
        credits_completed: profile.credits_completed?.toString() || "",
        credits_required: profile.credits_required?.toString() || "",
        advisor: profile.advisor || "",
        enrollment_date: profile.enrollment_date || "",
        expected_graduation: profile.expected_graduation || "",
        notifications_enabled: profile.notifications_enabled ?? true,
        language: profile.language || "en",
        timezone: profile.timezone || "America/New_York",
        theme: profile.theme || "system",
        batch: profile.batch || "",
        hod_name: profile.hod_name || "",
      });
    }
  }, [profile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB for base64)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload to Cloudinary
      const uploaded = await uploadToCloudinary(file);
      console.log('Image uploaded to Cloudinary:', uploaded.url);

      const result = await updateProfile({ avatar_url: uploaded.url } as Partial<ProfileType>);

      if (result.success) {
        toast.success('Profile image updated successfully!');
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }

      setIsUploadingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(errorMessage);
      setIsUploadingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <ProfileSkeleton />
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleInputChange = async (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-save notification preferences
    if (typeof value === 'boolean') {
      const result = await updateProfile({ [field]: value } as Partial<ProfileType>);
      if (result.success) {
        toast.success("Preference saved");
      } else {
        toast.error("Failed to save preference");
        // Revert on failure
        setFormData((prev) => ({ ...prev, [field]: !value }));
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateProfile({
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      date_of_birth: formData.date_of_birth || null,
      bio: formData.bio,
      street: formData.street,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      country: formData.country,
      student_id: formData.student_id,
      program: formData.program,
      year: formData.year,
      department: formData.department,
      gpa: formData.gpa ? parseFloat(formData.gpa) : null,
      credits_completed: formData.credits_completed ? parseInt(formData.credits_completed) : null,
      credits_required: formData.credits_required ? parseInt(formData.credits_required) : null,
      advisor: formData.advisor,
      enrollment_date: formData.enrollment_date || null,
      expected_graduation: formData.expected_graduation || null,
      notifications_enabled: formData.notifications_enabled,
      language: formData.language,
      timezone: formData.timezone,
      theme: formData.theme,
      batch: formData.batch,
      hod_name: formData.hod_name,
    } as Partial<ProfileType>);

    if (result.success) {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } else {
      toast.error(result.error || "Failed to update profile");
    }
    setIsSaving(false);
  };

  const handleShare = async () => {
    if (!profile?.user_id) {
      toast.error("Profile ID not found. Please refresh and try again.");
      return;
    }
    const profileUrl = `https://eduspace-five.vercel.app/p/${profile.user_id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${formData.full_name}'s Profile | EduSpace`,
          text: `Check out my academic profile on EduSpace!`,
          url: profileUrl,
        });
        toast.success("Shared successfully");
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
          copyToClipboard(profileUrl);
        }
      }
    } else {
      copyToClipboard(profileUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Link copied to clipboard");
    }).catch((err) => {
      console.error('Could not copy text: ', err);
      toast.error("Failed to copy link");
    });
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);

    try {
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        toast.error(error.message || "Failed to update password");
      } else {
        toast.success("Password updated successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const bioMaxLength = 250;
  const bioRemaining = bioMaxLength - (formData.bio?.length || 0);
  const initials = formData.full_name?.split(" ").map((n) => n[0]).join("") || "U";

  return (
    <DashboardLayout>
      <div className="flex flex-col xl:flex-row gap-8 w-full animate-in fade-in duration-500 pb-24 xl:pb-0">
        {/* Left Sidebar - Profile Navigation (Desktop Only) */}
        <div className="hidden xl:block w-80 shrink-0">
          <div className="bg-surface border border-border rounded-xl p-4 sticky top-4">
            {/* User Quick Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
              <Avatar className="size-12">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{formData.full_name || "User"}</h3>
                <p className="text-xs text-muted-foreground">
                  {role === "lecturer" ? `Lecturer ID: ${formData.student_id || "N/A"}` : `Student ID: ${formData.student_id || "N/A"}`}
                </p>
              </div>
            </div>

            {/* Verified Badge */}
            {profile?.verified && (
              <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                <CheckCircle className="size-4" />
                <span>Account Verified</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <nav className="flex flex-col gap-1">
              {profileTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <tab.icon className="size-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Profile Header Card */}
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Top Row on Mobile: Avatar + Mobile Button */}
              <div className="flex flex-row items-center justify-between w-full sm:w-auto">
                {/* Avatar with Edit */}
                <div className="relative">
                  <Avatar className="size-24 sm:size-28">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute bottom-0 right-0 size-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Upload profile image"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                  </button>
                </div>

                {/* Mobile Public Profile Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:hidden"
                  onClick={() => setShowPublicProfile(true)}
                >
                  <Eye className="size-4 mr-2" />
                  Public Profile
                </Button>
              </div>

              {/* User Info */}
              <div className="flex-1 w-full sm:w-auto">
                <h1 className="text-2xl font-bold text-foreground">{formData.full_name || "User"}</h1>
                <p className="text-muted-foreground">
                  {formData.program || "No program set"} {formData.year && `• ${formData.year}`}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {role === "lecturer" ? "Lecturer" : "Student"}
                  </Badge>
                  {profile?.verified && (
                    <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-500/20">
                      Verified
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      const url = `${window.location.origin}/p/${user?.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Public profile link copied!");
                    }}
                    title="Share Profile"
                  >
                    <Share2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Desktop Action Button */}
              <Button
                variant="outline"
                className="hidden sm:flex"
                onClick={() => setShowPublicProfile(true)}
              >
                <Eye className="size-4 mr-2" />
                View Public Profile
              </Button>
            </div>
          </div>

          {/* Personal Information Section */}
          {activeTab === "personal" && (
            <>
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {isEditing ? "Cancel" : "Edit Info"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        value={formData.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        value={formData.email}
                        disabled
                        className="pl-10 bg-muted/50"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium text-foreground">Bio</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value.slice(0, bioMaxLength))}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bioRemaining} characters left
                  </p>
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Address Details</h2>

                <div className="space-y-4">
                  {/* Street Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Street Address</label>
                    <Input
                      value={formData.street}
                      onChange={(e) => handleInputChange("street", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* City */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">City</label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* State */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">State / Province</label>
                      <Input
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Zip Code */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Zip Code</label>
                      <Input
                        value={formData.zip_code}
                        onChange={(e) => handleInputChange("zip_code", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Country</label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => handleInputChange("country", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="India">India</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Academic Details Section */}
          {activeTab === "academic" && (
            <>
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Academic Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {isEditing ? "Cancel" : "Edit Info"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student/Lecturer ID - Moved outside to be top level first item maybe? Or keep in grid */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {role === "lecturer" ? "Lecturer ID" : "Student ID"}
                    </label>
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        value={formData.student_id}
                        onChange={(e) => handleInputChange("student_id", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Program */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Program</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        value={formData.program}
                        onChange={(e) => handleInputChange("program", e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                        placeholder="e.g., B.Sc. Computer Science"
                      />
                    </div>
                  </div>

                  {/* Additional Lecturer Fields */}
                  {role === "lecturer" && (
                    <>
                      {/* Batch */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Batch</label>
                        <Select
                          value={formData.batch}
                          onValueChange={(value) => handleInputChange("batch", value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2022-2026">2022–2026</SelectItem>
                            <SelectItem value="2023-2027">2023–2027</SelectItem>
                            <SelectItem value="2024-2028">2024–2028</SelectItem>
                            <SelectItem value="2025-2029">2025–2029</SelectItem>
                            <SelectItem value="2026-2030">2026–2030</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* HOD Name */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">HOD Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                          <Input
                            value={formData.hod_name}
                            onChange={(e) => handleInputChange("hod_name", e.target.value)}
                            disabled={!isEditing}
                            className="pl-10"
                            placeholder="e.g., Dr. Head of Dept"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Student Specific Fields */}
                  {role !== "lecturer" && (
                    <>
                      {/* Year */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Year</label>
                        <Select
                          value={formData.year}
                          onValueChange={(value) => handleInputChange("year", value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1st Year">1st Year</SelectItem>
                            <SelectItem value="2nd Year">2nd Year</SelectItem>
                            <SelectItem value="3rd Year">3rd Year</SelectItem>
                            <SelectItem value="4th Year">4th Year</SelectItem>
                            <SelectItem value="Graduate">Graduate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* GPA */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">GPA</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          value={formData.gpa}
                          onChange={(e) => handleInputChange("gpa", e.target.value)}
                          disabled={!isEditing}
                          placeholder="e.g., 3.75"
                        />
                      </div>

                      {/* Advisor */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Academic Advisor</label>
                        <Input
                          value={formData.advisor}
                          onChange={(e) => handleInputChange("advisor", e.target.value)}
                          disabled={!isEditing}
                          placeholder="e.g., Dr. Smith"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Only show Important Dates for Students */}
              {role !== "lecturer" && (
                <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-6">Important Dates</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Enrollment Date</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                        <Input
                          type="date"
                          value={formData.enrollment_date}
                          onChange={(e) => handleInputChange("enrollment_date", e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Expected Graduation</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                        <Input
                          type="date"
                          value={formData.expected_graduation}
                          onChange={(e) => handleInputChange("expected_graduation", e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Security Section */}
          {activeTab === "security" && (
            <>
              <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Change Password</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                        className="pl-10 pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.current ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                        className="pl-10 pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        className="pl-10 pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <Button onClick={handlePasswordChange} disabled={isSaving} className="mt-2">
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Notifications Section */}
          {activeTab === "notifications" && (
            <ProfileNotificationSettings />
          )}

          {/* Preferences Section */}
          {activeTab === "preferences" && (
            <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">App Preferences</h2>

              <div className="space-y-6">
                {/* Theme */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Palette className="size-4" />
                    Theme
                  </label>
                  <ThemeSelector />
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred theme. System will follow your device settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(activeTab === "personal" || activeTab === "academic" || activeTab === "notifications" || activeTab === "preferences") && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Public Profile Modal */}
      <Dialog open={showPublicProfile} onOpenChange={setShowPublicProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle>Public Profile View</DialogTitle>
          </DialogHeader>

          {/* Academic Profile Preview */}
          <div className="bg-slate-50 dark:bg-[#050b14] text-slate-900 dark:text-white rounded-xl overflow-hidden shadow-2xl font-sans selection:bg-blue-500/30 transition-colors duration-300">

            {/* Top Header */}
            <div className="pt-8 pb-4 text-center">
              <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase">Academic Profile</h2>
            </div>

            <div className="max-w-md mx-auto px-6 pb-12 relative z-10">
              <div className="flex flex-col items-center text-center mt-4">
                {/* Avatar with Glow */}
                <div className="relative mb-6 group">
                  <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full opacity-75 blur"></div>
                  <div className="relative">
                    <Avatar className="size-24 border-4 border-white dark:border-[#050b14] shadow-2xl">
                      <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-2xl font-bold text-blue-500">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {profile?.verified && (
                      <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-4 border-white dark:border-[#050b14]">
                        <CheckCircle className="size-3" fill="currentColor" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                  {formData.full_name || "User Name"}
                </h1>

                {/* Badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-6 items-center">
                  <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    Academic Portal
                  </Badge>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    {role === "lecturer" ? "Lecturer" : "Student"}
                  </Badge>
                  {profile?.verified && (
                    <Badge className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      Verified Identity
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 ml-1"
                    onClick={() => {
                      const url = `${window.location.origin}/p/${user?.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Public profile link copied!");
                    }}
                    title="Share Profile"
                  >
                    <Share2 className="size-3.5" />
                  </Button>
                </div>

                {/* Info Row */}
                <div className="flex flex-col items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-blue-500" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-blue-500" />
                    <span>Updated {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Personal Statement */}
                {formData.bio && (
                  <div className="w-full text-left mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1 w-6 bg-blue-600 rounded-full"></div>
                      <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-500 uppercase">Personal Statement</h3>
                    </div>
                    <p className="text-base text-slate-600 dark:text-slate-200 italic font-medium leading-relaxed">
                      "{formData.bio}"
                    </p>
                  </div>
                )}

                {/* Connectivity */}
                <div className="w-full text-left mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-500 uppercase">Connectivity</h3>
                  </div>

                  <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-blue-500/20 transition-all cursor-pointer shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Globe className="size-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate tracking-tight">
                        eduspace.network/{formData.full_name?.toLowerCase().replace(/\s+/g, '')}
                      </span>
                    </div>
                    <Copy className="size-3.5 text-slate-500" />
                  </div>
                </div>

                {/* Footer E-Record Card */}
                <div className="w-full bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-slate-200/50 dark:shadow-blue-900/5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full border-2 border-blue-500/20 flex items-center justify-center bg-blue-500/5 text-blue-500">
                      <Shield className="size-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Official Academic E-Record</p>
                      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID: PREVIEW-MODE</p>
                    </div>
                  </div>
                  <div className="bg-blue-600 text-[8px] font-black px-3 py-1.5 rounded-lg text-white tracking-wider">
                    VERIFIED
                  </div>
                </div>

                <div className="mt-6 w-full pb-2 flex justify-center">
                  <Button
                    className="w-full max-w-sm bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-full py-6 shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] border border-white/10"
                    onClick={() => {
                      toast.info("This is a preview. Download functionality is available on the public profile page.");
                    }}
                  >
                    <Download className="size-4 mr-2" />
                    <span className="font-bold tracking-wide text-xs uppercase">Download Official PDF</span>
                  </Button>
                </div>
                
                {/* Visit Public Profile Link */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setShowPublicProfile(false);
                      setTimeout(() => {
                        navigate(`/p/${user?.id}`);
                      }, 100);
                    }}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors underline-offset-2 hover:underline"
                  >
                    Visit Public Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Navigation for Profile Tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border xl:hidden pb-safe">
        <nav className="flex items-center justify-around h-16 px-2 overflow-x-auto no-scrollbar">
          {profileTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full text-[10px] font-medium transition-colors my-1",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all",
                  activeTab === tab.id && "bg-primary/10"
                )}
              >
                <tab.icon
                  className={cn("size-5 transition-all", activeTab === tab.id ? "text-primary" : "text-muted-foreground")}
                  strokeWidth={activeTab === tab.id ? 2.5 : 2}
                />
              </div>
              <span className={cn("hidden xs:block scale-0 transition-all duration-200", activeTab === tab.id && "scale-100")}>
                {tab.label.split(" ")[0]}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </DashboardLayout>
  );
}
