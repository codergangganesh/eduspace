import { useState } from "react";
import { Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSwitcher } from "./RoleSwitcher";
import { Link } from "react-router-dom";

export function LoginForm() {
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password, role });
  };

  return (
    <div className="bg-surface rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-none border border-border p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
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
        <Button type="submit" className="w-full">
          Sign In
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
