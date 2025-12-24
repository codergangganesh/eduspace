import { useState } from "react";
import { Mail, Eye, EyeOff, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { BackgroundDecoration } from "@/components/auth/BackgroundDecoration";
import { Link } from "react-router-dom";

export default function Register() {
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register attempt:", { ...formData, role });
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
                  />
                  <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center">
                    <User className="size-5" />
                  </div>
                </div>
              </label>

              {/* Email Field */}
              <label className="flex flex-col gap-2">
                <span className="text-foreground text-sm font-medium leading-normal">
                  Institutional Email
                </span>
                <div className="relative flex items-center">
                  <Input
                    type="email"
                    placeholder={role === "student" ? "student@university.edu" : "lecturer@university.edu"}
                    value={formData.email}
                    onChange={handleChange("email")}
                    className="pr-10"
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
                  className="mt-1 size-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </label>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Or
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

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
