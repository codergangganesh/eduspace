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
            toast.success("Account created successfully! Welcome to Eduspace.");
            navigate("/dashboard");
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
        <AuthLayout title="Student Registration" subtitle="Join Eduspace and start your learning journey">
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
            <div className="bg-background rounded-xl border border-border p-8 shadow-sm">
                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Full Name Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Full Name
                        </label>
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Enter your full name"
                                value={formData.fullName}
                                onChange={handleChange("fullName")}
                                className="pr-10"
                                disabled={isLoading}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <User className="size-5" />
                            </div>
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Email Address
                        </label>
                        <div className="relative">
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange("email")}
                                className="pr-10"
                                disabled={isLoading}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <Mail className="size-5" />
                            </div>
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={handleChange("password")}
                                className="pr-12"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                            >
                                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange("confirmPassword")}
                                className="pr-12"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                            >
                                {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Terms Agreement */}
                    <div className="flex items-start gap-3">
                        <TermsDialog
                            open={showTerms}
                            onOpenChange={setShowTerms}
                            showAgreeButton={true}
                            onAgree={() => setAgreedToTerms(true)}
                        />
                        <PrivacyPolicyDialog
                            open={showPrivacy}
                            onOpenChange={setShowPrivacy}
                            showAgreeButton={false} // Privacy is usually informational, but can be strict too. sticking to Terms for the "Agree" action for now to avoid double hurdles unless requested.
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
                                className="mt-1 size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                                disabled={isLoading}
                            />
                            <label htmlFor="terms" className="text-sm text-muted-foreground select-none">
                                I agree to the{" "}
                                <button
                                    type="button"
                                    onClick={() => setShowTerms(true)}
                                    className="text-primary hover:underline font-medium focus:outline-none"
                                >
                                    Terms of Service
                                </button>
                                {" "}and{" "}
                                <button
                                    type="button"
                                    onClick={() => setShowPrivacy(true)}
                                    className="text-primary hover:underline font-medium focus:outline-none"
                                >
                                    Privacy Policy
                                </button>
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">OR</span>
                    </div>
                </div>

                {/* Sign In Link */}
                <Button variant="outline" asChild className="w-full">
                    <Link to="/student/login">Sign In</Link>
                </Button>

                {/* OAuth Buttons */}
                <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-center text-sm text-muted-foreground mb-3">Or continue with</p>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Google Sign In */}
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleGoogleSignIn}
                            disabled={isGoogleLoading || isLoading || isGitHubLoading}
                        >
                            {isGoogleLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <svg className="size-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            )}
                            Google
                        </Button>

                        {/* GitHub Sign In */}
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleGitHubSignIn}
                            disabled={isGitHubLoading || isLoading || isGoogleLoading}
                        >
                            {isGitHubLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            )}
                            GitHub
                        </Button>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
