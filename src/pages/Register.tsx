import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { BackgroundDecoration } from "@/components/auth/BackgroundDecoration";
import { Link } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);

    const result = await signUp(formData.email, formData.password, formData.fullName, role);

    if (result.success) {
      toast.success("Account created successfully! Welcome to EduSpace.");
      navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard");
    } else {
      toast.error(result.error || "Registration failed");
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await signInWithGoogle(role);
    
    if (!result.success) {
      toast.error(result.error || "Google sign in failed");
      setIsGoogleLoading(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <AuthHeader />

      <main className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">
          {/* Page Heading */}
          <div className="flex flex-col gap-2 text-center sm:text-left animate-fade-in">
            <h1 className="text-foreground text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
              Create Account
            </h1>
            <p className="text-muted-foreground text-base font-normal leading-normal">
              Join EduSpace and start your learning journey.
            </p>
          </div>

          {/* Registration Form Card */}
          <div className="bg-surface rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-none border border-border p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
            {/* Role Switcher - Moved to top */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">I am a</label>
              <RoleSwitcher value={role} onChange={setRole} />
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <svg className="size-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google as {role === "lecturer" ? "Lecturer" : "Student"}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Or continue with email
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Role Switcher */}
            <RoleSwitcher value={role} onChange={setRole} />

            {/* Form */}
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {/* Full Name Field */}
              <label className="flex flex-col gap-2">
                <span className="text-foreground text-sm font-medium leading-normal">
                  Full Name
                </span>
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange("fullName")}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center">
                    <User className="size-5" />
                  </div>
                </div>
              </label>

              {/* Email Field */}
              <label className="flex flex-col gap-2">
                <span className="text-foreground text-sm font-medium leading-normal">
                  Email Address
                </span>
                <div className="relative flex items-center">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange("email")}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center">
                    <Mail className="size-5" />
                  </div>
                </div>
              </label>

              {/* Password Field */}
              <label className="flex flex-col gap-2">
                <span className="text-foreground text-sm font-medium leading-normal">
                  Password
                </span>
                <div className="relative flex items-center">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange("password")}
                    className="pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </label>

              {/* Confirm Password Field */}
              <label className="flex flex-col gap-2">
                <span className="text-foreground text-sm font-medium leading-normal">
                  Confirm Password
                </span>
                <div className="relative flex items-center">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    className="pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                  >
                    {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </label>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 size-4 rounded border-border text-primary focus:ring-primary/20"
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </label>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="flex flex-col gap-3 text-center">
              <p className="text-muted-foreground text-sm">Already have an account?</p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <p className="text-xs text-muted-foreground/70">
              Protected by reCAPTCHA and subject to the{" "}
              <a className="underline hover:text-muted-foreground" href="#">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a className="underline hover:text-muted-foreground" href="#">
                Terms of Service
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <BackgroundDecoration />
    </div>
  );
}
