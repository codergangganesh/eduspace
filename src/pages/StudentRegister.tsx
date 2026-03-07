import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Mail, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { toast } from "sonner";

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
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && role) {
            navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard", { replace: true });
        }
    }, [isAuthenticated, role, navigate]);

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

        const result = await signUp(formData.email, formData.password, formData.fullName, "student");

        if (result.success) {
            toast.success("Account created successfully! Please sign in to continue.");
            navigate("/student/login", { state: { registered: true } });
        } else {
            toast.error(result.error || "Registration failed");
        }

        setIsLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        const result = await signInWithGoogle("student");

        if (!result.success) {
            toast.error(result.error || "Google sign in failed");
            setIsGoogleLoading(false);
        }
    };

    const handleGitHubSignIn = async () => {
        setIsGitHubLoading(true);
        const result = await signInWithGitHub("student");

        if (!result.success) {
            toast.error(result.error || "GitHub sign in failed");
            setIsGitHubLoading(false);
        }
    };

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <AuthLayout title="Student Registration" subtitle="Join Eduspace and start your learning journey" contentMaxWidth="lg:max-w-xl">
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
            <div className="bg-background lg:rounded-xl lg:border lg:border-border p-0 lg:p-7 lg:shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* OAuth Buttons - Top on mobile, Bottom on desktop */}
                <div className="flex flex-col lg:hidden mb-8">
                    <div className="flex justify-center gap-4 lg:grid lg:grid-cols-2 lg:gap-3">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isGoogleLoading || isLoading || isGitHubLoading}
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
                            disabled={isGitHubLoading || isLoading || isGoogleLoading}
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
                <form className="space-y-4 lg:space-y-4" onSubmit={handleSubmit}>
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

                    {/* Password Fields in a row on desktop, stacked on mobile */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        Already have an account? <Link to="/student/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
                    </p>
                </div>

                {/* Desktop Divider & OAuth */}
                <div className="hidden lg:block mt-6">
                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">OR</span>
                        </div>
                    </div>

                    <Button variant="outline" asChild className="w-full h-11">
                        <Link to="/student/login">Sign In</Link>
                    </Button>

                    <div className="mt-5 pt-5 border-t border-border">
                        <p className="text-center text-[10px] lg:text-xs text-muted-foreground mb-3">Or continue with</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="gap-2 h-11" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                                <svg className="size-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </Button>
                            <Button variant="outline" className="gap-2 h-11" onClick={handleGitHubSignIn} disabled={isGitHubLoading || isLoading}>
                                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
