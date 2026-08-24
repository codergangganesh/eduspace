import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import SEO from "@/components/SEO";
import { Mail, Eye, EyeOff, Loader2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";

export default function StudentLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signInWithPasskey, signInWithGoogle, signInWithGitHub, isAuthenticated, role } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isGitHubLoading, setIsGitHubLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string>();
    const isCaptchaVerified = Boolean(captchaToken);

    // 2FA Challenge State
    const [mfaChallenge, setMfaChallenge] = useState<{ factorId: string; factorName: string } | null>(null);

    const { register, handleSubmit: hookFormSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
        defaultValues: { email: "", password: "" }
    });

    // Show registration success message if redirected from registration
    useEffect(() => {
        if (location.state?.registered) {
            toast.success("Your account has been successfully created. Please log in to continue.");
            // Clear location state to prevent toast on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Redirect if already authenticated, verifying 2FA AAL2 requirement first
    useEffect(() => {
        if (isAuthenticated && role) {
            mfaService.getAssuranceLevel().then(({ currentLevel, nextLevel }) => {
                if (currentLevel === "aal1" && nextLevel === "aal2") {
                    mfaService.listFactors().then(({ totpFactors }) => {
                        const activeFactor = totpFactors.find((f) => f.status === "verified") || totpFactors[0];
                        if (activeFactor) {
                            setMfaChallenge({
                                factorId: activeFactor.id,
                                factorName: activeFactor.friendly_name || "Android Authenticator",
                            });
                            return;
                        }
                    });
                } else {
                    navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard", { replace: true });
                }
            });
        }
    }, [isAuthenticated, role, navigate]);

    const onValidSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);

        const result = await signIn(data.email, data.password, captchaToken);

        if (result.success) {
            // Check if 2FA (AAL2) challenge is required
            const { currentLevel, nextLevel } = await mfaService.getAssuranceLevel();
            if (currentLevel === "aal1" && nextLevel === "aal2") {
                const { totpFactors } = await mfaService.listFactors();
                const activeFactor = totpFactors.find((f) => f.status === "verified") || totpFactors[0];
                if (activeFactor) {
                    setMfaChallenge({
                        factorId: activeFactor.id,
                        factorName: activeFactor.friendly_name || "Android Authenticator",
                    });
                    setIsLoading(false);
                    return;
                }
            }

            toast.success("Welcome back!");
            navigate("/dashboard", { replace: true });
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
                // Check if 2FA (AAL2) challenge is required
                const { currentLevel, nextLevel } = await mfaService.getAssuranceLevel();
                if (currentLevel === "aal1" && nextLevel === "aal2") {
                    const { totpFactors } = await mfaService.listFactors();
                    const activeFactor = totpFactors.find((f) => f.status === "verified") || totpFactors[0];
                    if (activeFactor) {
                        setMfaChallenge({
                            factorId: activeFactor.id,
                            factorName: activeFactor.friendly_name || "Android Authenticator",
                        });
                        setIsPasskeyLoading(false);
                        return;
                    }
                }

                toast.success("Welcome back!");
                navigate("/dashboard", { replace: true });
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

    const handleGoogleSignIn = async () => {
        if (!isCaptchaVerified) return;
        setIsGoogleLoading(true);
        const result = await signInWithGoogle("student");

        if (!result.success) {
            toast.error(result.error || "Google sign in failed");
            setIsGoogleLoading(false);
        }
    };

    const handleGitHubSignIn = async () => {
        if (!isCaptchaVerified) return;
        setIsGitHubLoading(true);
        const result = await signInWithGitHub("student");

        if (!result.success) {
            toast.error(result.error || "GitHub sign in failed");
            setIsGitHubLoading(false);
        }
    };

    return (
        <AuthLayout title="Sign In" subtitle="Please enter your details below" contentMaxWidth="lg:max-w-xl">
            <SEO
                title="Student Login"
                description="Log in to your EduSpace student account to access your courses, assignments, and track your learning progress."
                keywords={["Student Login", "EduSpace Login", "LMS Login", "Student Portal", "Online Learning"]}
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
                        "name": "Student Login",
                        "item": "https://eduspaceacademy.online/student/login"
                    }]
                }}
            />
            <div className="bg-background lg:rounded-xl lg:border lg:border-border p-0 lg:p-5 lg:shadow-sm">
                {mfaChallenge ? (
                    <MfaChallengeView
                        factorName={mfaChallenge.factorName}
                        onVerify={handleVerifyMfa}
                        onCancel={handleCancelMfa}
                    />
                ) : (
                    <>
                        {/* OAuth Buttons - Top on mobile, Bottom on desktop */}
                        <div className="flex flex-col lg:hidden mb-8">
                            <div className="flex justify-center gap-4 lg:grid lg:grid-cols-2 lg:gap-3">
                                <button
                                    onClick={handleGoogleSignIn}
                                    disabled={!isCaptchaVerified || isGoogleLoading || isLoading || isGitHubLoading}
                                    className="size-[72px] flex items-center justify-center bg-background rounded-2xl border border-border shadow-sm hover:bg-accent transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isGoogleLoading ? (
                                        <Loader2 className="size-6 animate-spin" />
                                    ) : (
                                        <div className="p-3 border border-border/50 rounded-lg">
                                            <svg className="size-6" viewBox="0 0 24 24">
                                                <path
                                                    fill="#4285F4"
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                />
                                                <path
                                                    fill="#34A853"
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                />
                                                <path
                                                    fill="#FBBC05"
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                />
                                                <path
                                                    fill="#EA4335"
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </button>

                                <button
                                    onClick={handleGitHubSignIn}
                                    disabled={!isCaptchaVerified || isGitHubLoading || isLoading || isGoogleLoading}
                                    className="size-[72px] flex items-center justify-center bg-[#181717] rounded-2xl border border-transparent shadow-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isGitHubLoading ? (
                                        <Loader2 className="size-6 animate-spin text-white" />
                                    ) : (
                                        <svg className="size-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <div className="relative mt-8 mb-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border/50"></div>
                                </div>
                                <div className="relative flex justify-center text-[13px]">
                                    <span className="bg-background px-4 text-muted-foreground/70 font-medium">or continue with email</span>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form className="space-y-4" onSubmit={hookFormSubmit(onValidSubmit)}>
                            {/* Institutional Email Field */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground lg:block hidden">
                                    Institutional Email
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                        <Mail className="size-5" />
                                    </div>
                                    <Input
                                        type="email"
                                        placeholder="Institutional Email"
                                        {...register("email")}
                                        className="pl-12 h-14 lg:h-11 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.email.message}</p>}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground lg:block hidden">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    </div>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        {...register("password")}
                                        className="pl-12 pr-12 h-14 lg:h-11 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-0 h-full px-4 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                                    >
                                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.password.message}</p>}
                            </div>

                            {/* Forgot Password */}
                            <div className="flex justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-semibold text-blue-600 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Security Verification (Cloudflare Turnstile) */}
                            <div className="flex justify-center my-2 min-h-[65px]">
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

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={!isCaptchaVerified || isLoading || isPasskeyLoading}
                                className="w-full h-12 lg:h-11 rounded-2xl lg:rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                            >
                                {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Sign In"}
                            </Button>

                            {/* Passkey Sign-In Option */}
                            <div className="relative my-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border/60"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-background px-2 text-muted-foreground font-semibold">OR PASSKEY</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePasskeySignIn}
                                disabled={!isCaptchaVerified || isLoading || isPasskeyLoading}
                                className="w-full h-11 rounded-xl border-border/80 hover:bg-accent font-semibold text-xs gap-2"
                            >
                                {isPasskeyLoading ? (
                                    <Loader2 className="size-4 animate-spin text-blue-600" />
                                ) : (
                                    <Fingerprint className="size-4 text-blue-600" />
                                )}
                                <span>Sign In with Passkey / Biometrics</span>
                            </Button>
                        </form>

                        {/* Desktop OAuth Buttons */}
                        <div className="hidden lg:block mt-6">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">OR</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <Button variant="outline" className="gap-2 h-10 text-xs" onClick={handleGoogleSignIn} disabled={!isCaptchaVerified || isGoogleLoading || isLoading}>
                                    <svg className="size-4" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google
                                </Button>
                                <Button variant="outline" className="gap-2 h-10 text-xs" onClick={handleGitHubSignIn} disabled={!isCaptchaVerified || isGitHubLoading || isLoading}>
                                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </Button>
                            </div>

                            <div className="mt-4 text-center">
                                <p className="text-muted-foreground text-[11px]">
                                    Don't have an account? <Link to="/student/register" className="text-blue-600 font-bold hover:underline">Create Account</Link>
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}
