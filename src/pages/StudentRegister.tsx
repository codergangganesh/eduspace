import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Mail, Lock, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";
import DOMPurify from "dompurify";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/lib/validations/auth";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { PrivacyPolicyDialog } from "@/components/legal/PrivacyPolicyDialog";

export default function StudentRegister() {
    const navigate = useNavigate();
    const { signUp, signInWithGoogle, signInWithGitHub, isAuthenticated, role } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isGitHubLoading, setIsGitHubLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string>();
    const [hasNavigated, setHasNavigated] = useState(false);
    const isCaptchaVerified = Boolean(captchaToken);

    const { register, handleSubmit: hookFormSubmit, formState: { errors }, watch } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: "onTouched",
        defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" }
    });

    const passwordWatch = watch("password");

    // Redirect if already authenticated (only after component has mounted)
    useEffect(() => {
        if (!hasNavigated && isAuthenticated && role) {
            navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard", { replace: true });
        }
    }, [isAuthenticated, role, navigate, hasNavigated]);

    const onValidSubmit = async (data: RegisterFormValues) => {
        if (!agreedToTerms) {
            toast.error("Please agree to the Terms of Service and Privacy Policy");
            return;
        }

        setIsLoading(true);

        const sanitizedFullName = DOMPurify.sanitize(data.fullName.trim());
        const sanitizedEmail = DOMPurify.sanitize(data.email.trim());

        if (!sanitizedFullName || !sanitizedEmail) {
            toast.error("Invalid input detected in required fields");
            setIsLoading(false);
            return;
        }

        const result = await signUp(sanitizedEmail, data.password, sanitizedFullName, "student", captchaToken);

        if (result.success) {
            setHasNavigated(true);
            toast.success("Account created successfully! Please sign in to continue.");
            navigate("/student/login", { state: { registered: true } });
        } else {
            toast.error(result.error || "Registration failed");
        }

        setIsLoading(false);
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
        <AuthLayout title="Student Registration" subtitle="Join Eduspace and start your learning journey" noScroll={true}>
            <SEO
                title="Student Registration"
                description="Join EduSpace and start your learning journey. Create a student account to access courses, submit assignments, and track your performance."
                keywords={["Student Registration", "Create Account", "EduSpace Sign Up", "Student Portal", "Join EduSpace"]}
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
                        "name": "Student Registration",
                        "item": "https://eduspaceacademy.online/student/register"
                    }]
                }}
            />
            <div>
                {/* Modals */}
                <TermsDialog
                    open={showTerms}
                    onOpenChange={setShowTerms}
                    showAgreeButton={true}
                    onAgree={() => setAgreedToTerms(true)}
                />
                <PrivacyPolicyDialog
                    open={showPrivacy}
                    onOpenChange={setShowPrivacy}
                    showAgreeButton={false}
                />

                {/* OAuth Buttons */}
                <div className="flex flex-col mb-3">
                    <div className="flex justify-center gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={!isCaptchaVerified || isGoogleLoading || isLoading || isGitHubLoading}
                            className="size-12 sm:size-14 flex items-center justify-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            title="Sign up with Google"
                        >
                            {isGoogleLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            ) : (
                                <div className="p-1.5 border border-slate-200 dark:border-slate-700/50 rounded-xl bg-white dark:bg-slate-900">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleGitHubSignIn}
                            disabled={!isCaptchaVerified || isGitHubLoading || isLoading || isGoogleLoading}
                            className="size-12 sm:size-14 flex items-center justify-center bg-[#181717] rounded-2xl border border-transparent shadow-xs hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            title="Sign up with GitHub"
                        >
                            {isGitHubLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                            ) : (
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <div className="relative mt-3 mb-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-[#F1F5FB] dark:bg-[#0f172a] px-3 text-slate-400 dark:text-slate-500 font-semibold tracking-wider">
                                or register with email
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form className="space-y-3 sm:space-y-3.5" onSubmit={hookFormSubmit(onValidSubmit)}>
                    {/* Full Name Field */}
                    <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                            Full Name
                        </label>
                        <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-200 dark:border-slate-800 focus-within:border-[#2563eb] transition-colors">
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                            <input
                                type="text"
                                placeholder="Jane Doe"
                                {...register("fullName")}
                                maxLength={100}
                                className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-medium"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        {errors.fullName && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.fullName.message}</p>}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                            Institutional Email Address
                        </label>
                        <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-200 dark:border-slate-800 focus-within:border-[#2563eb] transition-colors">
                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                            <input
                                type="email"
                                placeholder="demo@email.com"
                                {...register("email")}
                                maxLength={255}
                                className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-medium"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        {errors.email && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.email.message}</p>}
                    </div>

                    {/* Password & Confirm Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                                    maxLength={128}
                                    className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-medium pr-8"
                                    disabled={isLoading}
                                    required
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

                        <div className="space-y-1">
                            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                                Confirm Password
                            </label>
                            <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-200 dark:border-slate-800 focus-within:border-[#2563eb] transition-colors relative">
                                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    {...register("confirmPassword")}
                                    maxLength={128}
                                    className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-medium pr-8"
                                    disabled={isLoading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.confirmPassword.message}</p>}
                        </div>
                    </div>

                    {passwordWatch && <PasswordStrength password={passwordWatch} />}

                    {/* Terms Agreement */}
                    <div className="flex items-center gap-2.5 pt-0.5">
                        <input
                            type="checkbox"
                            id="terms-check"
                            checked={agreedToTerms}
                            onChange={() => {
                                if (!agreedToTerms) {
                                    setShowTerms(true);
                                } else {
                                    setAgreedToTerms(false);
                                }
                            }}
                            className="size-4.5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                            disabled={isLoading}
                        />
                        <label htmlFor="terms-check" className="text-xs text-slate-600 dark:text-slate-400 select-none">
                            I agree to the{" "}
                            <button
                                type="button"
                                onClick={() => setShowTerms(true)}
                                className="text-[#2563eb] dark:text-blue-400 font-semibold hover:underline"
                            >
                                Terms
                            </button>{" "}
                            &{" "}
                            <button
                                type="button"
                                onClick={() => setShowPrivacy(true)}
                                className="text-[#2563eb] dark:text-blue-400 font-semibold hover:underline"
                            >
                                Privacy Policy
                            </button>
                        </label>
                    </div>

                    {/* CAPTCHA Protection */}
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

                    {/* Submit Button */}
                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={!isCaptchaVerified || isLoading}
                            className="w-full h-11 sm:h-12 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </div>

                    {/* Footer Switch Links */}
                    <div className="space-y-1.5 text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                        <div>
                            <span>Already have an account? </span>
                            <Link to="/student/login" className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline">
                                Sign In
                            </Link>
                        </div>
                        <div>
                            <span>Looking for Lecturer Portal? </span>
                            <Link to="/lecturer/register" className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline">
                                Register as Lecturer
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
