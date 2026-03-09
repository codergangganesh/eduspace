import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Mail, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";

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
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // Redirect if already authenticated (only after component has mounted)
    useEffect(() => {
        // Only redirect if we haven't just submitted the form
        // This prevents flickering after account creation
        if (!hasNavigated && isAuthenticated && role) {
            navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard", { replace: true });
        }
    }, [isAuthenticated, role, navigate, hasNavigated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (!agreedToTerms) {
            toast.error("Please agree to the Terms of Service and Privacy Policy");
            return;
        }

        setIsLoading(true);

        const result = await signUp(formData.email, formData.password, formData.fullName, "lecturer", captchaToken);

        if (result.success) {
            setHasNavigated(true); // Mark that we're about to navigate
            toast.success("Account created successfully! Please sign in to continue.");
            navigate("/lecturer/login", { state: { registered: true } });
        } else {
            toast.error(result.error || "Registration failed");
        }

        setIsLoading(false);
    };

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <AuthLayout title="Lecturer Registration" subtitle="Join Eduspace and start teaching">
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
            <div className="bg-background lg:rounded-xl lg:border lg:border-border p-0 lg:p-8 lg:shadow-sm">
                <div className="mb-8 lg:hidden">
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Lecturer</h2>
                    <p className="text-blue-600 font-bold text-lg -mt-1">Registration</p>
                </div>
                {/* Form */}
                <form className="space-y-4 lg:space-y-5" onSubmit={handleSubmit}>
                    {/* Full Name Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground lg:block hidden">
                            Full Name
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <User className="size-5" />
                            </div>
                            <Input
                                type="text"
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={handleChange("fullName")}
                                className="pl-12 h-14 lg:h-11 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground lg:block hidden">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <Mail className="size-5" />
                            </div>
                            <Input
                                type="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange("email")}
                                className="pl-12 h-14 lg:h-11 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
                                disabled={isLoading}
                            />
                        </div>
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
                                value={formData.password}
                                onChange={handleChange("password")}
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
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground lg:block hidden">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            </div>
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange("confirmPassword")}
                                className="pl-12 pr-12 h-14 lg:h-11 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
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
                    </div>

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
                                I agree to the <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => setShowTerms(true)}>Terms</span> & <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => setShowPrivacy(true)}>Privacy Policy</span>
                            </label>
                        </div>
                    </div>

                    {/* CAPTCHA Protection */}
                    <div className="flex justify-center my-2">
                        <Turnstile
                            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ""}
                            onSuccess={(token) => setCaptchaToken(token)}
                            onExpire={() => setCaptchaToken(undefined)}
                        />
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" className="w-full h-14 lg:h-11 rounded-2xl lg:rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 mt-4" disabled={isLoading}>
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

                {/* Footer - Only on mobile */}
                <div className="mt-8 text-center lg:hidden">
                    <p className="text-muted-foreground text-sm">
                        Already have an account? <Link to="/lecturer/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
                    </p>
                </div>

                {/* Desktop Divider & Sign In */}
                <div className="hidden lg:block mt-6">
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">OR</span>
                        </div>
                    </div>

                    <Button variant="outline" asChild className="w-full h-11">
                        <Link to="/lecturer/login">Sign In</Link>
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}
