import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Sun, Moon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();

  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const currentTheme = resolvedTheme || theme;

  useEffect(() => {
    // Check if recovery session or token exists in URL
    const verifySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      } else {
        // Listen to auth state change in case token is being parsed from URL hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" || session) {
            setHasSession(true);
          }
        });

        // Small timeout before deciding if token is missing
        setTimeout(async () => {
          const { data: { session: checkAgain } } = await supabase.auth.getSession();
          if (!checkAgain) {
            setHasSession(false);
          }
        }, 1500);

        return () => subscription.unsubscribe();
      }
    };

    verifySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMsg("Password must contain uppercase letters, lowercase letters, and at least one number.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMsg(error.message || "Failed to update password.");
      } else {
        setIsSuccess(true);
        toast.success("Password updated successfully!", {
          description: "You can now log in with your new password.",
        });

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#e0f2fe] via-[#93c5fd]/50 to-[#1e3a8a]/90 dark:from-[#0B0F1A] dark:via-[#0F172A] dark:to-[#020617] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-10 font-sans transition-colors duration-300 relative">
      
      {/* Top Right Floating Dark / Light Mode Toggle */}
      <button
        type="button"
        onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/40 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 shadow-lg hover:scale-105 transition-all cursor-pointer"
      >
        {currentTheme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
      </button>

      {/* Main Card */}
      <div className="w-full max-w-[480px] my-auto bg-white dark:bg-[#0f172a] rounded-[32px] p-8 sm:p-10 shadow-[0_25px_70px_-15px_rgba(30,58,138,0.45)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] border border-white/50 dark:border-slate-800 transition-colors">
        
        {/* Logo */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="flex items-center gap-2 mb-1">
            <img src="/favicon.png" alt="Eduspace" className="h-9 w-9 rounded-lg shadow-sm" />
            <span className="text-2xl font-black text-[#1e40af] dark:text-blue-400">Eduspace</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Security & Authentication
          </span>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enter a strong new password for your administrative account
          </p>
        </div>

        {/* Expired Token Notice */}
        {hasSession === false && !isSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Recovery Link Invalid or Expired</span>
            </div>
            <p className="leading-relaxed">
              This password recovery link has either expired or already been used. Please request a fresh reset link from the login page.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Login</span>
            </Link>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success View */}
        {isSuccess ? (
          <div className="space-y-4 text-center py-4 animate-in fade-in">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="font-bold text-base">Password Updated!</h3>
              <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
                Your password has been successfully updated in real-time. Redirecting you to login...
              </p>
            </div>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 h-11 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm rounded-lg shadow-md transition-all"
            >
              <span>Go to Login Now</span>
            </Link>
          </div>
        ) : (
          hasSession !== false && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password (min. 6 characters)"
                  className="w-full h-11 sm:h-12 pl-4 pr-11 rounded-lg bg-white dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 focus:border-[#2563eb] dark:focus:border-blue-500 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full h-11 sm:h-12 pl-4 pr-11 rounded-lg bg-white dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 focus:border-[#2563eb] dark:focus:border-blue-500 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Cloudflare Turnstile CAPTCHA Protection */}
              <div className="flex justify-center my-2 min-h-[65px]">
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  options={{
                    theme: currentTheme === "dark" ? "dark" : "light",
                    size: "normal",
                  }}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(undefined)}
                  onError={() => setCaptchaToken(undefined)}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading || !captchaToken}
                  className="w-full h-11 sm:h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm tracking-wider uppercase rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </form>
          )
        )}

      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-white/80 dark:text-slate-500 pt-4">
        &copy; {new Date().getFullYear()} Eduspace Institutional Suite &bull; All rights reserved.
      </footer>

    </div>
  );
};
