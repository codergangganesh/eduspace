import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Mail, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordStrength, getPasswordRules } from "@/components/auth/PasswordStrength";
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
    const [hasNavigated, setHasNavigated] = useState(false); // Prevent multiple navigations
    const { register, handleSubmit: hookFormSubmit, formState: { errors }, watch } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
        defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" }
    });

    const passwordWatch = watch("password");

    // Redirect if already authenticated (only after component has mounted)
    useEffect(() => {
        // Only redirect if we haven't just submitted the form
        // This prevents flickering after account creation
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
            setHasNavigated(true); // Mark that we're about to navigate
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
            <div className="bg-background lg:rounded-xl lg:border lg:border-border p-0 lg:p-4 lg:shadow-sm">
                {/* Form */}
                <form className="space-y-2 lg:space-y-2.5" onSubmit={hookFormSubmit(onValidSubmit)}>
                    {/* Full Name Field */}
                    <div className="space-y-1">
                        <label className="text-[12px] font-bold text-foreground lg:block hidden">
                            Full Name
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <User className="size-5" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Full Name"
                                {...register("fullName")}
                                maxLength={100}
                                className="pl-12 h-12 lg:h-10 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
                                disabled={isLoading}
                            />
                        </div>
                        {errors.fullName && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.fullName.message}</p>}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-1">
                        <label className="text-[12px] font-bold text-foreground lg:block hidden">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <Mail className="size-5" />
                            </div>
                            <Input
                                type="email"
                                placeholder="Email Address"
                                {...register("email")}
                                maxLength={255}
                                className="pl-12 h-12 lg:h-10 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
                                disabled={isLoading}
                            />
                        </div>
                        {errors.email && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.email.message}</p>}
                    </div>

                    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-2 lg:gap-3">
                        {/* Password Field */}
                        <div className="space-y-1">
                            <label className="text-[12px] font-bold text-foreground lg:block hidden">
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
                                    maxLength={128}
                                    className="pl-12 pr-12 h-12 lg:h-10 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
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

                        {/* Confirm Password Field */}
                        <div className="space-y-1">
                            <label className="text-[12px] font-bold text-foreground lg:block hidden">
                                Confirm Pwd
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    {...register("confirmPassword")}
                                    maxLength={128}
                                    className="pl-12 pr-12 h-12 lg:h-10 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-0 top-0 h-full px-4 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                                >
                                    {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.confirmPassword.message}</p>}
                        </div>
                    </div>

                    {passwordWatch && <PasswordStrength password={passwordWatch} />}

                    {/* Terms Agreement */}
                    <div className="flex items-start gap-3 mt-2">
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

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={(e) => {
                                    if (!agreedToTerms) {
                                        setShowTerms(true);
                                    } else {
                                        setAgreedToTerms(false);
                                    }
                                }}
                                className="size-5 rounded-lg border-border/50 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                disabled={isLoading}
                            />
                            <label htmlFor="terms" className="text-[13px] text-muted-foreground/80 select-none">
                                I agree to the <Link to="/terms-of-service" target="_blank" className="text-blue-600 font-semibold hover:underline">Terms</Link> & <Link to="/privacy-policy" target="_blank" className="text-blue-600 font-semibold hover:underline">Privacy Policy</Link>
                            </label>
                        </div>
                    </div>

                    {/* CAPTCHA Protection */}
                    <div className="flex justify-center my-1.5">
                        <Turnstile
                            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ""}
                            onSuccess={(token) => setCaptchaToken(token)}
                            onExpire={() => setCaptchaToken(undefined)}
                        />
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" className="w-full h-12 lg:h-10 rounded-2xl lg:rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 mt-1 lg:mt-0" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="size-5 mr-2 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </Button>
                </form>

                {/* Footer */}
                <div className="mt-3 lg:mt-2 text-center">
                    <p className="text-muted-foreground text-sm lg:text-xs">
                        Already have an account? <Link to="/lecturer/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
                    </p>
                </div>

                {/* Desktop Switcher */}
                <div className="hidden lg:block mt-4 pt-2 border-t border-border">
                    <div className="text-center">
                        <p className="text-muted-foreground text-[11px]">
                            Already have an account? <Link to="/lecturer/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
