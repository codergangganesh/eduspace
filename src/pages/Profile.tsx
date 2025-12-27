import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth, Profile as ProfileType } from "@/contexts/AuthContext";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    assignment_reminders: true,
    grade_updates: true,
    course_announcements: true,
    weekly_digest: false,
    // Preferences
    language: "en",
    timezone: "America/New_York",
    theme: "system",
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
        email_notifications: profile.email_notifications ?? true,
        push_notifications: profile.push_notifications ?? true,
        sms_notifications: profile.sms_notifications ?? false,
        assignment_reminders: profile.assignment_reminders ?? true,
        grade_updates: profile.grade_updates ?? true,
        course_announcements: profile.course_announcements ?? true,
        weekly_digest: profile.weekly_digest ?? false,
        language: profile.language || "en",
        timezone: profile.timezone || "America/New_York",
        theme: profile.theme || "system",
      });
    }
  }, [profile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateProfile({
      full_name: formData.full_name,
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
      email_notifications: formData.email_notifications,
      push_notifications: formData.push_notifications,
      sms_notifications: formData.sms_notifications,
      assignment_reminders: formData.assignment_reminders,
      grade_updates: formData.grade_updates,
      course_announcements: formData.course_announcements,
      weekly_digest: formData.weekly_digest,
      language: formData.language,
      timezone: formData.timezone,
      theme: formData.theme,
    } as Partial<ProfileType>);

    if (result.success) {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } else {
      toast.error(result.error || "Failed to update profile");
    }
    setIsSaving(false);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    // Password change would require Supabase auth.updateUser
    toast.success("Password change feature coming soon!");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const bioMaxLength = 250;
  const bioRemaining = bioMaxLength - (formData.bio?.length || 0);
  const initials = formData.full_name?.split(" ").map((n) => n[0]).join("") || "U";

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Left Sidebar - Profile Navigation */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-surface border border-border rounded-xl p-4">
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
                  {role === "lecturer" ? "Lecturer" : `Student ID: ${formData.student_id || "N/A"}`}
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
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar with Edit */}
              <div className="relative">
                <Avatar className="size-24 sm:size-28">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 size-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="size-4" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1">
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
                </div>
              </div>

              {/* Action Button */}
              <Button variant="outline">View Public Profile</Button>
            </div>
          </div>

          {/* Personal Information Section */}
          {activeTab === "personal" && (
            <>
              <div className="bg-surface border border-border rounded-xl p-6">
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
              <div className="bg-surface border border-border rounded-xl p-6">
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
              <div className="bg-surface border border-border rounded-xl p-6">
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
                  {/* Student ID */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Student ID</label>
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

                  {/* Department */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Department</label>
                    <Input
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Computer Science"
                    />
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
                </div>
              </div>

              {/* Credits Progress */}
              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Credits Progress</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Credits Completed</label>
                    <Input
                      type="number"
                      value={formData.credits_completed}
                      onChange={(e) => handleInputChange("credits_completed", e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., 90"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Credits Required</label>
                    <Input
                      type="number"
                      value={formData.credits_required}
                      onChange={(e) => handleInputChange("credits_required", e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., 120"
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {formData.credits_completed || 0} / {formData.credits_required || 120} credits
                    </span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          ((parseInt(formData.credits_completed) || 0) /
                            (parseInt(formData.credits_required) || 120)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-surface border border-border rounded-xl p-6">
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
            </>
          )}

          {/* Security Section */}
          {activeTab === "security" && (
            <>
              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Change Password</h2>

                <div className="space-y-4 max-w-md">
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

                  <Button onClick={handlePasswordChange} className="mt-2">
                    Update Password
                  </Button>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Two-Factor Authentication</h2>
                <p className="text-muted-foreground mb-4">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <Button variant="outline">
                  <Smartphone className="size-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Active Sessions</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Globe className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">Browser • Active now</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Current
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notifications Section */}
          {activeTab === "notifications" && (
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Notification Preferences</h2>

              <div className="space-y-6">
                {/* Notification Channels */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-4">Notification Channels</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={formData.email_notifications}
                        onCheckedChange={(checked) => handleInputChange("email_notifications", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                      </div>
                      <Switch
                        checked={formData.push_notifications}
                        onCheckedChange={(checked) => handleInputChange("push_notifications", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                      </div>
                      <Switch
                        checked={formData.sms_notifications}
                        onCheckedChange={(checked) => handleInputChange("sms_notifications", checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-foreground mb-4">Notification Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Assignment Reminders</p>
                        <p className="text-sm text-muted-foreground">Get reminded about upcoming deadlines</p>
                      </div>
                      <Switch
                        checked={formData.assignment_reminders}
                        onCheckedChange={(checked) => handleInputChange("assignment_reminders", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Grade Updates</p>
                        <p className="text-sm text-muted-foreground">Be notified when grades are posted</p>
                      </div>
                      <Switch
                        checked={formData.grade_updates}
                        onCheckedChange={(checked) => handleInputChange("grade_updates", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Course Announcements</p>
                        <p className="text-sm text-muted-foreground">Receive course updates from instructors</p>
                      </div>
                      <Switch
                        checked={formData.course_announcements}
                        onCheckedChange={(checked) => handleInputChange("course_announcements", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Digest</p>
                        <p className="text-sm text-muted-foreground">Get a weekly summary of your activities</p>
                      </div>
                      <Switch
                        checked={formData.weekly_digest}
                        onCheckedChange={(checked) => handleInputChange("weekly_digest", checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Section */}
          {activeTab === "preferences" && (
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">App Preferences</h2>

              <div className="space-y-6 max-w-md">
                {/* Language */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Globe className="size-4" />
                    Language
                  </label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => handleInputChange("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Clock className="size-4" />
                    Timezone
                  </label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => handleInputChange("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Palette className="size-4" />
                    Theme
                  </label>
                  <Select
                    value={formData.theme}
                    onValueChange={(value) => handleInputChange("theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
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
    </DashboardLayout>
  );
}
