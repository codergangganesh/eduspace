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

export default function LecturerRegister() {
    const navigate = useNavigate();
    const { signUp, isAuthenticated, role } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
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

        const result = await signUp(formData.email, formData.password, formData.fullName, "lecturer");

        if (result.success) {
            toast.success("Account created successfully! Welcome to Eduspace.");
            navigate("/lecturer-dashboard");
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
                    <Link to="/lecturer/login">Sign In</Link>
                </Button>
            </div>
        </AuthLayout>
    );
}
