import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import SEO from "@/components/SEO";
import { Mail, Lock, Eye, EyeOff, Loader2, Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth";
import { isPasskeySupported } from "@/services/passkey.service";
import { mfaService } from "@/services/mfa.service";
import { MfaChallengeView } from "@/components/auth/MfaChallengeView";
import { TotpOnboardingModal } from "@/components/auth/TotpOnboardingModal";
import { supabase } from "@/integrations/supabase/client";

export default function LecturerLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signInWithPasskey, isAuthenticated, role } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string>();
    const isCaptchaVerified = Boolean(captchaToken);

    // 2FA Challenge & Onboarding State
    const [mfaChallenge, setMfaChallenge] = useState<{ factorId: string; factorName: string } | null>(null);
    const [showTotpOnboarding, setShowTotpOnboarding] = useState(false);

    const { register, handleSubmit: hookFormSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onSubmit",
        defaultValues: { email: "", password: "" }
    });

    // Check if user came from registration (persists across reloads/redirects)
    const isNewUser = Boolean(
        location.state?.registered ||
        location.state?.isNewUser ||
        sessionStorage.getItem("eduspace_new_registration") === "true"
    );

    // Show registration success message if redirected from registration
    useEffect(() => {
        if (location.state?.registered) {
            toast.success("Your account has been successfully created. Please log in to continue.");
        }
    }, [location]);

    // Handle authenticated state (MFA challenge, TOTP onboarding, or dashboard redirect)
    useEffect(() => {
        if (!isAuthenticated || !role) return;

        // If currently in a challenge or onboarding modal, do not auto-navigate away
        if (showTotpOnboarding || mfaChallenge) return;

        let isCancelled = false;

        const checkSecurityAndRedirect = async () => {
            try {
                const { currentLevel, nextLevel } = await mfaService.getAssuranceLevel();
                if (isCancelled) return;

                if (currentLevel === "aal1" && nextLevel === "aal2") {
                    const { totpFactors } = await mfaService.listFactors();
                    if (isCancelled) return;
                    const activeFactor = totpFactors.find((f) => f.status === "verified") || totpFactors[0];
                    if (activeFactor) {
                        setMfaChallenge({
                            factorId: activeFactor.id,
                            factorName: activeFactor.friendly_name || "Android Authenticator",
                        });
                        return;
                    }
                }

                // If new registration without verified 2FA, trigger onboarding modal
                if (isNewUser) {
                    const { totpFactors } = await mfaService.listFactors();
                    if (isCancelled) return;
                    const hasVerified = totpFactors.some((f) => f.status === "verified");
                    if (!hasVerified) {
                        setShowTotpOnboarding(true);
                        return;
                    }
                }

                // Default redirect to dashboard
                navigate("/lecturer-dashboard", { replace: true });
            } catch {
                if (!isCancelled) {
                    navigate("/lecturer-dashboard", { replace: true });
                }
            }
        };

        checkSecurityAndRedirect();

        return () => {
            isCancelled = true;
        };
    }, [isAuthenticated, role, isNewUser, showTotpOnboarding, mfaChallenge, navigate]);

    const handleTotpOnboardingSuccess = () => {
        try {
            sessionStorage.removeItem("eduspace_new_registration");
        } catch {}
        setShowTotpOnboarding(false);
        toast.success("Welcome to Eduspace Lecturer Portal!");
        navigate("/lecturer-dashboard", { replace: true });
    };

    const handleTotpOnboardingSkip = () => {
        try {
            sessionStorage.removeItem("eduspace_new_registration");
        } catch {}
        setShowTotpOnboarding(false);
        toast.info("You can enable 2FA anytime in your Profile settings.");
        navigate("/lecturer-dashboard", { replace: true });
    };

    const onValidSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);

        const result = await signIn(data.email, data.password, captchaToken);

        if (result.success) {
            // Note: The useEffect above will handle MFA challenge, TOTP onboarding, or dashboard redirect
            setIsLoading(false);
        } else {
            toast.error(result.error || "Login failed");
            setIsLoading(false);
        }
    };

    const handlePasskeySignIn = async () => {
        if (!isPasskeySupported()) {
            toast.error("WebAuthn / Passkeys are not supported by this browser.");
            return;
        }
        if (!captchaToken) {
            toast.error("Please complete the security verification check first.");
            return;
        }
        try {
            setIsPasskeyLoading(true);
            const result = await signInWithPasskey(captchaToken);
            if (result.success) {
                // The useEffect will handle MFA challenge, TOTP onboarding, or redirect
                setIsPasskeyLoading(false);
            } else {
                toast.error(result.error || "Passkey sign-in failed");
                setIsPasskeyLoading(false);
            }
        } catch (err: any) {
            toast.error(err.message || "Passkey sign-in error");
            setIsPasskeyLoading(false);
        }
    };

    const handleVerifyMfa = async (code: string) => {
        if (!mfaChallenge) return { success: false, error: "No active 2FA challenge." };
        const res = await mfaService.challengeAndVerify(mfaChallenge.factorId, code);
        if (res.success) {
            toast.success("Two-Factor Authentication verified!");
            setMfaChallenge(null);
            navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard", { replace: true });
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

    return (
        <AuthLayout title="Lecturer Sign In" subtitle="Access your portal to manage your courses and students">
            <SEO
                title="Lecturer Login"
                description="Access the EduSpace Lecturer Portal. Manage your courses, grade assignments, and communicate with students."
                keywords={["Lecturer Login", "Teacher Portal", "EduSpace for Educators", "LMS Login", "Grading System"]}
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [{
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://eduspaceacademy.online"
                    }, {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Lecturer Login",
                        "item": "https://eduspaceacademy.online/lecturer/login"
                    }]
                }}
            />
            <div>
                {mfaChallenge ? (
                    <MfaChallengeView
                        factorName={mfaChallenge.factorName}
                        onVerify={handleVerifyMfa}
                        onCancel={handleCancelMfa}
                    />
                ) : (
                    <form className="space-y-4" onSubmit={hookFormSubmit(onValidSubmit)}>
                        {/* Email Field */}
                        <div className="space-y-1">
                            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                                Institutional Email
                            </label>
                            <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-200 dark:border-slate-800 focus-within:border-[#2563eb] transition-colors">
                                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                                <input
                                    type="email"
                                    placeholder="lecturer@institution.edu"
                                    {...register("email")}
                                    className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-medium"
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.email.message}</p>}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1">
                            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-200 dark:border-slate-800 focus-within:border-[#2563eb] transition-colors relative">
                                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    {...register("password")}
                                    className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-medium pr-8"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.password.message}</p>}
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex items-center justify-end text-xs font-semibold pt-0.5">
                            <Link
                                to="/forgot-password"
                                className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline cursor-pointer"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Turnstile CAPTCHA */}
                        <div className="flex justify-center my-1.5 min-h-[65px]">
                            <Turnstile
                                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAACoSjniwSUdeJX0r"}
                                options={{
                                    theme: "auto",
                                    size: "normal",
                                }}
                                onSuccess={(token) => setCaptchaToken(token)}
                                onExpire={() => setCaptchaToken(undefined)}
                                onError={() => setCaptchaToken(undefined)}
                            />
                        </div>

                        {/* Submit Button & Passkey */}
                        <div className="pt-1 space-y-2.5">
                            <button
                                type="submit"
                                disabled={!isCaptchaVerified || isLoading || isPasskeyLoading}
                                className="w-full h-11 sm:h-12 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                            </button>

                            <div className="relative my-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-white dark:bg-[#0B0F1A] lg:bg-[#F1F5FB] lg:dark:bg-[#0f172a] px-2 text-slate-400 dark:text-slate-500 font-bold tracking-wider">OR</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handlePasskeySignIn}
                                disabled={!isCaptchaVerified || isLoading || isPasskeyLoading}
                                className="w-full h-11 bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isPasskeyLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                ) : (
                                    <Fingerprint className="h-4 w-4 text-blue-600" />
                                )}
                                <span>Sign in with Passkey / Biometrics</span>
                            </button>
                        </div>

                        {/* Switch Links */}
                        <div className="space-y-1.5 text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                            <div>
                                <span>Don't have an account? </span>
                                <Link to="/lecturer/register" className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline">
                                    Create Account
                                </Link>
                            </div>
                            <div>
                                <span>Looking for Student Portal? </span>
                                <Link to="/student/login" className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline">
                                    Sign In as Student
                                </Link>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Post-Registration Optional TOTP Setup Modal */}
            <TotpOnboardingModal
                open={showTotpOnboarding}
                onOpenChange={setShowTotpOnboarding}
                onSuccess={handleTotpOnboardingSuccess}
                onSkip={handleTotpOnboardingSkip}
            />
        </AuthLayout>
    );
}
