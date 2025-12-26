import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSwitcher } from "./RoleSwitcher";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password, role);

    if (result.success) {
      toast.success("Welcome back!");
      navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard");
    } else {
      toast.error(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-surface rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-none border border-border p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
      {/* Sample Credentials Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
        <p className="font-medium text-primary mb-2">Sample Credentials:</p>
        <div className="text-muted-foreground space-y-1">
          <p><strong>Student:</strong> student@university.edu / student123</p>
          <p><strong>Lecturer:</strong> lecturer@university.edu / lecturer123</p>
        </div>
      </div>

      {/* Role Switcher */}
      <RoleSwitcher value={role} onChange={setRole} />

      {/* Form */}
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {/* Email Field */}
        <label className="flex flex-col gap-2">
          <span className="text-foreground text-sm font-medium leading-normal">
            Institutional Email
          </span>
          <div className="relative flex items-center">
            <Input
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary-hover hover:underline decoration-primary/30 underline-offset-4 transition-all"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
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

      {/* Create Account */}
      <div className="flex flex-col gap-3 text-center">
        <p className="text-muted-foreground text-sm">Don't have an account yet?</p>
        <Button variant="outline" asChild className="w-full">
          <Link to="/register">Create New Account</Link>
        </Button>
      </div>
    </div>
  );
}
