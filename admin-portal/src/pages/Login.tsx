import * as React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTheme } from "next-themes";
import { Eye, EyeOff, AlertCircle, Loader2, Sun, Moon, ArrowLeft, CheckCircle2, Mail, Lock, ShieldCheck, Fingerprint, Key } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { hasAcceptedCurrentAgreements } from "@/services/legal.service";
import { Turnstile } from "@marsidev/react-turnstile";
import { isPasskeySupported } from "@/services/passkey.service";
import { mfaService } from "@/services/mfa.service";
import { AdminMfaChallengeView } from "@/components/auth/AdminMfaChallengeView";

const ROTATING_MESSAGES = [
  "Manage your institution effortlessly.",
  "Real-time analytics and student insights.",
  "Empower educators with modern tools.",
  "Seamless administrative control."
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();

  // 2FA Challenge State
  const [mfaChallenge, setMfaChallenge] = useState<{ factorId: string; factorName: string } | null>(null);

  // Inline View Mode: "login" | "forgot-password"
  const [viewMode, setViewMode] = useState<"login" | "forgot-password">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCaptchaToken, setResetCaptchaToken] = useState<string | undefined>();
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<"idle" | "success" | "error">("idle");
  const [resetErrorMsg, setResetErrorMsg] = useState("");

  // Theme Management
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Prevent SSR/hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme || theme) : "dark";

  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  // Typing Effect State for left panel banner (Desktop)
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { signIn, signInWithPasskey, user, isAdmin, isLoading: isAuthChecking } = useAdminAuth();
  const navigate = useNavigate();

  // Typing Effect Logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentFullText = ROTATING_MESSAGES[textIndex];

    if (!isDeleting) {
      if (displayText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.substring(0, displayText.length + 1));
        }, 45);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 4000);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.substring(0, displayText.length - 1));
        }, 25);
      } else {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, textIndex]);

  // If already authenticated as admin, check if 2FA AAL2 challenge is required before redirecting
  useEffect(() => {
    if (!isAuthChecking && user && isAdmin) {
      mfaService.getAssuranceLevel().then(({ currentLevel, nextLevel }) => {
        if (currentLevel === "aal1" && nextLevel === "aal2") {
          mfaService.listFactors().then(({ totpFactors }) => {
            const activeFactor = totpFactors.find((f) => f.status === "verified") || totpFactors[0];
            if (activeFactor) {
              setMfaChallenge({
                factorId: activeFactor.id,
                factorName: activeFactor.friendly_name || "Authenticator App",
              });
              return;
            }
          });
        } else {
          if (hasAcceptedCurrentAgreements(user.id)) {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/agreement", { replace: true });
          }
        }
      });
    }
  }, [user, isAdmin, isAuthChecking, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg("");
      const res = await signIn(email.trim(), password, captchaToken);

      if (res.success) {
        // Check if account has 2FA enabled (AAL2 challenge required)
        const { currentLevel, nextLevel } = await mfaService.getAssuranceLevel();
        if (currentLevel === "aal1" && nextLevel === "aal2") {
          const { totpFactors } = await mfaService.listFactors();
          const activeFactor = totpFactors.find((f) => f.status === "verified") || totpFactors[0];
          if (activeFactor) {
            setMfaChallenge({
              factorId: activeFactor.id,
              factorName: activeFactor.friendly_name || "Authenticator App",
            });
            setIsLoading(false);
            return;
          }
        }

        toast.success("Welcome to the Eduspace Admin Portal!");
        const currentUserId = res.user?.id || user?.id;
        if (hasAcceptedCurrentAgreements(currentUserId)) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/agreement", { replace: true });
        }
      } else {
        setErrorMsg(res.error || "Authentication failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    try {
      setIsPasskeyLoading(true);
      setErrorMsg("");

      if (!isPasskeySupported()) {
        setErrorMsg("WebAuthn / Passkeys are not supported by this browser.");
        setIsPasskeyLoading(false);
        return;
      }

      if (!captchaToken) {
        setErrorMsg("Please verify the security check (CAPTCHA) above before signing in with Passkey.");
        setIsPasskeyLoading(false);
        return;
      }

      const res = await signInWithPasskey(captchaToken);

      if (res.success) {
        // Check if account has 2FA enabled (AAL2 challenge required)
        const { currentLevel, nextLevel } = await mfaService.getAssuranceLevel();
        if (currentLevel === "aal1" && nextLevel === "aal2") {
          const { totpFactors } = await mfaService.listFactors();
          const activeFactor = totpFactors.find((f) => f.status === "verified") || totpFactors[0];
          if (activeFactor) {
            setMfaChallenge({
              factorId: activeFactor.id,
              factorName: activeFactor.friendly_name || "Authenticator App",
            });
            setIsPasskeyLoading(false);
            return;
          }
        }

        toast.success("Authenticated with Passkey! Welcome to Eduspace Admin.");
        const currentUserId = res.user?.id || user?.id;
        if (hasAcceptedCurrentAgreements(currentUserId)) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/agreement", { replace: true });
        }
      } else {
        setErrorMsg(res.error || "Passkey verification was cancelled or failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate with passkey.");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleVerifyMfa = async (code: string) => {
    if (!mfaChallenge) return { success: false, error: "No active 2FA challenge." };
    const res = await mfaService.challengeAndVerify(mfaChallenge.factorId, code);
    if (res.success) {
      toast.success("Two-Factor Authentication verified!");
      setMfaChallenge(null);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id || user?.id;
      if (hasAcceptedCurrentAgreements(currentUserId)) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/agreement", { replace: true });
      }
      return { success: true };
    }
    return { success: false, error: res.error || "Invalid 6-digit code. Please try again." };
  };

  const handleCancelMfa = async () => {
    setMfaChallenge(null);
    try {
      await supabase.auth.signOut();
    } catch {}
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetErrorMsg("Please enter your registered email address.");
      return;
    }

    try {
      setIsResetting(true);
      setResetErrorMsg("");
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
        ...(resetCaptchaToken ? { captchaToken: resetCaptchaToken } : {}),
      });

      if (error) {
        setResetErrorMsg(error.message || "Failed to send reset link.");
        setResetStatus("error");
      } else {
        setResetStatus("success");
        toast.success("Password reset email sent!", {
          description: `Check your inbox at ${resetEmail.trim()}`,
        });
      }
    } catch (err: any) {
      setResetErrorMsg(err.message || "An unexpected error occurred.");
      setResetStatus("error");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* Top Right Floating Dark / Light Mode Toggle Button (Icon Only) */}
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center"
        title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} Mode`}
        aria-label="Toggle dark and light mode"
      >
        {currentTheme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
        )}
      </button>

      {/* ========================================================================= */}
      {/* 1. MOBILE VIEW (Visible on mobile/tablet screens < lg, matching reference) */}
      {/* ========================================================================= */}
      <div className="flex lg:hidden flex-col min-h-screen w-full bg-white dark:bg-[#0B0F1A] text-slate-900 dark:text-white font-sans relative overflow-x-hidden selection:bg-blue-500/30">
        
        {/* Top Organic Curved Wave Banner (~36% height) */}
        <div className="relative w-full h-72 sm:h-80 bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6] overflow-hidden flex flex-col justify-between">
          
          {/* Topographical / Contour Organic Wave SVG Background Patterns */}
          <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="none">
            <path d="M-50,60 C80,20 180,140 450,40" fill="none" stroke="white" strokeWidth="2" opacity="0.6" />
            <path d="M-30,110 C100,70 200,190 470,90" fill="none" stroke="white" strokeWidth="2.5" opacity="0.7" />
            <path d="M-10,160 C120,120 220,240 490,140" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
            <path d="M10,210 C140,170 240,290 510,190" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
            <circle cx="280" cy="110" r="60" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
            <circle cx="280" cy="110" r="95" fill="none" stroke="white" strokeWidth="1.8" opacity="0.4" />
            <circle cx="280" cy="110" r="130" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
            <circle cx="100" cy="220" r="70" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
          </svg>

          {/* Repeating Favicon Watermark Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: "url('/favicon.png')",
              backgroundRepeat: "repeat",
              backgroundSize: "56px 56px",
            }}
          />

          {/* Top Branding Pill */}
          <div className="relative z-10 px-6 pt-6 flex items-center gap-2">
            <img src="/favicon.png" alt="Eduspace Logo" className="w-8 h-8 rounded-lg shadow-md brightness-110 object-cover" />
            <span className="text-xl font-black text-white tracking-tight">Eduspace</span>
          </div>

          {/* Bottom Organic S-Curve Divider to the White/Dark Card */}
          <div className="relative z-10 w-full">
            <svg
              className="w-full h-28 sm:h-36 fill-white dark:fill-[#0B0F1A] transition-colors duration-300 -mb-[1px]"
              viewBox="0 0 375 120"
              preserveAspectRatio="none"
            >
              {/* Pronounced deep organic curve swooping from left to right */}
              <path d="M0,15 C130,5 175,115 375,118 L375,120 L0,120 Z" />
            </svg>
          </div>
        </div>

        {/* Bottom Form Sheet */}
        <div className="flex-1 px-6 sm:px-10 pt-1 sm:pt-4 pb-8 relative z-20 flex flex-col justify-between">
          <div className="w-full max-w-[420px] mx-auto">
            
            {mfaChallenge ? (
              <AdminMfaChallengeView
                factorName={mfaChallenge.factorName}
                onVerify={handleVerifyMfa}
                onCancel={handleCancelMfa}
              />
            ) : viewMode === "login" ? (
              <>
                {/* Heading: Sign In */}
                <div className="mb-6 pt-2 sm:pt-4">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight relative inline-block">
                    Sign in
                    <span className="absolute -bottom-1.5 left-0 right-0 h-1 bg-[#2563eb] rounded-full" />
                  </h1>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-200 dark:border-slate-800 focus-within:border-[#2563eb] transition-colors">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="demo@email.com"
                        className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-200 dark:border-slate-800 focus-within:border-[#2563eb] transition-colors relative">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-medium pr-8"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Row (Right-aligned without Remember Me) */}
                  <div className="flex items-center justify-end text-xs font-semibold pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("forgot-password");
                        setResetEmail(email || "");
                        setResetStatus("idle");
                        setResetErrorMsg("");
                      }}
                      className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Forgot Password?
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

                  {/* Sign In Button */}
                  <div className="pt-1 space-y-3">
                    <button
                      type="submit"
                      disabled={isLoading || isPasskeyLoading || !captchaToken}
                      className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Sign in"
                      )}
                    </button>

                    {/* Passkey Sign In Option (Mobile) */}
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-white dark:bg-[#0B0F1A] px-2 text-slate-400 font-bold tracking-wider">OR</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePasskeySignIn}
                      disabled={isLoading || isPasskeyLoading || !captchaToken}
                      className="w-full h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isPasskeyLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Fingerprint className="h-4 w-4 text-primary" />
                      )}
                      <span>Sign in with Passkey / Biometrics</span>
                    </button>
                  </div>

                  {/* Open Main App Link */}
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>Don't have an Account ? </span>
                    <a
                      href="http://localhost:8080/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline"
                    >
                      Sign up / Open App
                    </a>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* Heading: Reset Password */}
                <div className="mb-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight relative inline-block">
                    Reset Password
                    <span className="absolute -bottom-1.5 left-0 right-0 h-1 bg-[#2563eb] rounded-full" />
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Enter your email to receive recovery instructions
                  </p>
                </div>

                {/* Reset Error Message */}
                {resetErrorMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{resetErrorMsg}</span>
                  </div>
                )}

                {resetStatus === "success" ? (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                      <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Recovery Link Sent</h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                        Instructions have been sent to <strong>{resetEmail}</strong>. Please check your inbox.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("login");
                        setResetStatus("idle");
                      }}
                      className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm uppercase rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                        Email Address
                      </label>
                      <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-200 dark:border-slate-800 focus-within:border-[#2563eb] transition-colors">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="Registered Email Address"
                          className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* Cloudflare Turnstile CAPTCHA Protection */}
                    <div className="flex justify-center my-2 min-h-[65px]">
                      <Turnstile
                        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                        options={{
                          theme: currentTheme === "dark" ? "dark" : "light",
                          size: "normal",
                        }}
                        onSuccess={(token) => setResetCaptchaToken(token)}
                        onExpire={() => setResetCaptchaToken(undefined)}
                        onError={() => setResetCaptchaToken(undefined)}
                      />
                    </div>

                    {/* Submit Reset Link */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isResetting || !resetCaptchaToken}
                        className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isResetting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          "Send Reset Link"
                        )}
                      </button>
                    </div>

                    {/* Back to Login Button */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("login");
                          setResetErrorMsg("");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563eb] dark:text-blue-400 hover:underline"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Login</span>
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Mobile Legal Disclaimer */}
            <div className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-normal">
              By signing in you accept all our{" "}
              <Link to="/terms" className="text-slate-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 underline font-medium">
                terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 underline font-medium">
                privacy policy
              </Link>.
            </div>

          </div>

          {/* Footer branding */}
          <div className="text-center text-[10px] text-slate-400 dark:text-slate-600 pt-6">
            &copy; {new Date().getFullYear()} Eduspace Institutional Suite
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (Visible on lg: and wider screens, preserved 100%)       */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex h-screen overflow-hidden w-full bg-gradient-to-b from-[#e0f2fe] via-[#93c5fd]/50 to-[#1e3a8a]/90 dark:from-[#0B0F1A] dark:via-[#0F172A] dark:to-[#020617] flex-col justify-between items-center p-4 lg:p-6 font-sans selection:bg-blue-500/30 transition-colors duration-300 relative">

        {/* Central Two-Panel Elevated Card */}
        <div className="w-full max-w-[1140px] flex-1 flex flex-col justify-center relative z-10 min-h-0">

          <div className="w-full grid grid-cols-12 rounded-[36px] overflow-hidden shadow-[0_25px_70px_-15px_rgba(30,58,138,0.45)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] border border-white/50 dark:border-slate-800/80 transition-colors duration-300">

            {/* LEFT SIDE: Brand Pattern, Navigation, and Admin Header */}
            <div className="col-span-6 relative bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#1d4ed8] text-white p-10 flex flex-col justify-between overflow-hidden">

              {/* Repeating Eduspace Favicon Watermark Pattern */}
              <div
                className="absolute inset-0 pointer-events-none select-none z-0 opacity-15 dark:opacity-20"
                style={{
                  backgroundImage: "url('/favicon.png')",
                  backgroundRepeat: "repeat",
                  backgroundSize: "64px 64px",
                  backgroundPosition: "0 0",
                  filter: "brightness(1.5) contrast(1.2)",
                }}
              />

              {/* Prominent Large Eduspace Logo Watermark */}
              <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-96 h-96 pointer-events-none select-none z-0 opacity-20 dark:opacity-25 flex items-center justify-center -rotate-12">
                <img
                  src="/favicon.png"
                  alt="Eduspace Watermark"
                  className="w-full h-full object-contain filter drop-shadow-2xl mix-blend-overlay"
                />
              </div>

              {/* Glowing Ambient Orbs */}
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-400/25 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-900/40 blur-3xl pointer-events-none" />

              {/* Center Content: My Dashboard & Admin Login */}
              <div className="relative z-10 my-auto py-10 flex flex-col justify-center">
                <span className="text-sm font-bold tracking-widest text-blue-200 uppercase block mb-1">
                  My Dashboard
                </span>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white uppercase drop-shadow-sm">
                  Admin Login
                </h1>

                {/* Dynamic typing subtitle for interactivity */}
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-100/90 font-medium bg-black/15 backdrop-blur-sm px-3.5 py-2 rounded-xl w-fit max-w-full border border-white/10">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate">{displayText}</span>
                  <span className="animate-pulse text-white font-light">|</span>
                </div>
              </div>

              {/* Bottom branding detail */}
              <div className="relative z-10 text-[11px] text-blue-200/80 font-medium flex items-center gap-2 mt-auto">
                <img src="/favicon.png" alt="Eduspace" className="w-5 h-5 rounded object-cover brightness-110" />
                <span>Eduspace Institutional Suite &copy; {new Date().getFullYear()}</span>
              </div>

              {/* SVG Organic Curved Mask on the Right Border (Desktop) */}
              <div className="absolute -right-0.5 top-0 bottom-0 w-24 pointer-events-none z-20">
                <svg
                  className="h-full w-full fill-[#F1F5FB] dark:fill-[#0f172a] transition-colors duration-300"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path d="M0,0 Q100,50 0,100 L100,100 L100,0 Z" />
                </svg>
              </div>
            </div>

            {/* RIGHT SIDE: Welcome Back & Sign-In Form / Forgot Password Form */}
            <div className="col-span-6 bg-[#F1F5FB] dark:bg-[#0f172a] p-6 lg:p-8 flex flex-col justify-center overflow-y-auto relative transition-colors duration-300">

              <div className="w-full max-w-[420px] mx-auto">

                {/* Top Logo */}
                <div className="flex flex-col items-center justify-center text-center mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="/favicon.png" alt="Eduspace" className="h-9 w-9 rounded-lg shadow-sm object-cover" />
                    <span className="text-2xl font-black text-[#1e40af] dark:text-blue-400 tracking-tight">Eduspace</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    experience the excellence
                  </span>
                </div>

                {mfaChallenge ? (
                  <AdminMfaChallengeView
                    factorName={mfaChallenge.factorName}
                    onVerify={handleVerifyMfa}
                    onCancel={handleCancelMfa}
                  />
                ) : viewMode === "login" ? (
                  <>
                    {/* Header Title */}
                    <div className="text-center mb-4">
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                        Welcome Back!
                      </h2>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        Please login to view your dashboard
                      </p>
                    </div>

                    {/* Error Message */}
                    {errorMsg && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Form Inputs */}
                    <form onSubmit={handleSubmit} className="space-y-3">

                      {/* User Name / Email Input */}
                      <div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="User Name / Email"
                          className="w-full h-12 px-4 rounded-lg bg-white dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 focus:border-[#2563eb] dark:focus:border-blue-500 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all shadow-sm"
                          required
                        />
                      </div>

                      {/* Password Input */}
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full h-12 pl-4 pr-11 rounded-lg bg-white dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 focus:border-[#2563eb] dark:focus:border-blue-500 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all shadow-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Inline Forgot Password Button */}
                      <div className="flex items-center justify-end text-sm font-semibold pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setViewMode("forgot-password");
                            setResetEmail(email || "");
                            setResetStatus("idle");
                            setResetErrorMsg("");
                          }}
                          className="text-slate-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          Forgot password? <span className="text-[#2563eb] dark:text-blue-400 font-bold">Reset now</span>
                        </button>
                      </div>

                      {/* Cloudflare Turnstile CAPTCHA Protection */}
                      <div className="flex justify-center my-1 min-h-[65px]">
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

                      {/* Login Button (Full Width) */}
                      <div className="pt-1 space-y-3">
                        <button
                          type="submit"
                          disabled={isLoading || isPasskeyLoading || !captchaToken}
                          className="w-full h-12 px-8 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-bold text-sm tracking-wider uppercase rounded-lg shadow-md hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Login"
                          )}
                        </button>

                        {/* Passkey Sign In Option (Desktop) */}
                        <div className="relative my-2">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-300 dark:border-slate-700/80"></div>
                          </div>
                          <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-[#F1F5FB] dark:bg-[#0f172a] px-2 text-slate-400 font-bold tracking-wider">OR</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handlePasskeySignIn}
                          disabled={isLoading || isPasskeyLoading || !captchaToken}
                          className="w-full h-11 bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isPasskeyLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Fingerprint className="h-4 w-4 text-primary" />
                          )}
                          <span>Sign in with Passkey / Biometrics</span>
                        </button>
                      </div>

                      {/* Open Main App Link */}
                      <div className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span>If you want to visit, </span>
                        <a
                          href="http://localhost:8080/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline ml-1"
                        >
                          Open Main App
                        </a>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    {/* Forgot Password Header */}
                    <div className="text-center mb-6">
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                        Reset Password
                      </h2>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        Enter your email to receive recovery instructions
                      </p>
                    </div>

                    {/* Reset Error Message */}
                    {resetErrorMsg && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{resetErrorMsg}</span>
                      </div>
                    )}

                    {resetStatus === "success" ? (
                      <div className="space-y-4 text-center py-2 animate-in fade-in">
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                          <h3 className="font-bold text-sm">Reset Link Dispatched</h3>
                          <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-400 font-medium">
                            We've sent recovery instructions to <strong>{resetEmail}</strong>. Please check your inbox and follow the secure link.
                          </p>
                        </div>

                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setViewMode("login");
                              setResetStatus("idle");
                            }}
                            className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm tracking-wider uppercase rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Return to Login</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleResetPassword}
                            disabled={isResetting}
                            className="text-xs font-semibold text-slate-500 hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors py-1 cursor-pointer"
                          >
                            {isResetting ? "Resending..." : "Didn't receive email? Resend"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        {/* Email Input */}
                        <div>
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Registered Email Address"
                            className="w-full h-12 px-4 rounded-lg bg-white dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 focus:border-[#2563eb] dark:focus:border-blue-500 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all shadow-sm"
                            required
                          />
                        </div>

                        {/* Cloudflare Turnstile CAPTCHA Protection */}
                        <div className="flex justify-center my-2 min-h-[65px]">
                          <Turnstile
                            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                            options={{
                              theme: currentTheme === "dark" ? "dark" : "light",
                              size: "normal",
                            }}
                            onSuccess={(token) => setResetCaptchaToken(token)}
                            onExpire={() => setResetCaptchaToken(undefined)}
                            onError={() => setResetCaptchaToken(undefined)}
                          />
                        </div>

                        {/* Send Reset Link Button */}
                        <div className="pt-1">
                          <button
                            type="submit"
                            disabled={isResetting || !resetCaptchaToken}
                            className="w-full h-12 px-8 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-bold text-sm tracking-wider uppercase rounded-lg shadow-md hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {isResetting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Send Reset Link"
                            )}
                          </button>
                        </div>

                        {/* Back to Login Link */}
                        <div className="flex items-center justify-center pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setViewMode("login");
                              setResetErrorMsg("");
                            }}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Login</span>
                          </button>
                        </div>

                        {/* Open Main App Link */}
                        <div className="flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                          <span>If you want to visit, </span>
                          <a
                            href="http://localhost:8080/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline ml-1"
                          >
                            Open Main App
                          </a>
                        </div>
                      </form>
                    )}
                  </>
                )}

                {/* Disclaimer / Terms & Conditions */}
                <div className="mt-4 text-center text-[9.5px] text-slate-400 dark:text-slate-500 leading-normal max-w-[350px] mx-auto font-normal">
                  By signing in you accept all our{" "}
                  <Link
                    to="/terms"
                    className="text-slate-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 underline underline-offset-2 transition-colors font-medium"
                  >
                    terms and conditions
                  </Link>
                  ,{" "}
                  <Link
                    to="/privacy"
                    className="text-slate-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 underline underline-offset-2 transition-colors font-medium"
                  >
                    privacy policy
                  </Link>{" "}
                  and cookie policy. We however do not use any third party vendor to share your data and it's safe with us.
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Page Bottom Footer */}
        <footer className="w-full max-w-[1140px] text-center pt-2 pb-1 z-10">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-bold text-white/95 dark:text-slate-400 drop-shadow-sm">
            <a href="https://www.eduspaceacademy.online" target="_blank" rel="noreferrer" className="hover:underline">
              www.eduspaceacademy.online
            </a>
            <span className="text-white/60 dark:text-slate-600">|</span>
            <span>call: +91-7670895485</span>
          </div>
        </footer>

      </div>
    </>
  );
};
