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

export default function LecturerRegister() {
    const navigate = useNavigate();
    const { signUp, isAuthenticated, role } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string>();
    const [hasNavigated, setHasNavigated] = useState(false);
    const isCaptchaVerified = Boolean(captchaToken);

    const { register, handleSubmit: hookFormSubmit, formState: { errors }, watch } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
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

        const result = await signUp(sanitizedEmail, data.password, sanitizedFullName, "lecturer", captchaToken);

        if (result.success) {
            setHasNavigated(true);
            toast.success("Account created successfully! Please sign in to continue.");
            navigate("/lecturer/login", { state: { registered: true } });
        } else {
            toast.error(result.error || "Registration failed");
        }

        setIsLoading(false);
    };

    return (
        <AuthLayout title="Lecturer Registration" subtitle="Join Eduspace and start teaching" noScroll={true}>
            <SEO
                title="Lecturer Registration"
                description="Join EduSpace and start teaching. Create a lecturer account to manage classes, assignments, and track student success."
                keywords={["Lecturer Registration", "Teacher Sign Up", "EduSpace for Lecturers", "LMS for Teachers", "Online Teaching Platform"]}
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
                        "name": "Lecturer Registration",
                        "item": "https://eduspaceacademy.online/lecturer/register"
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
                                placeholder="Professor Jane Doe"
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
                                placeholder="lecturer@institution.edu"
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
                            id="terms-lecturer"
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
                        <label htmlFor="terms-lecturer" className="text-xs text-slate-600 dark:text-slate-400 select-none">
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
                            <Link to="/lecturer/login" className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline">
                                Sign In
                            </Link>
                        </div>
                        <div>
                            <span>Looking for Student Portal? </span>
                            <Link to="/student/register" className="text-[#2563eb] dark:text-blue-400 font-bold hover:underline">
                                Register as Student
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
