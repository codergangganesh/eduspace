import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Eye, EyeOff, User, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { BackgroundDecoration } from "@/components/auth/BackgroundDecoration";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LecturerRegister() {
    const navigate = useNavigate();
    const { signUp, isAuthenticated, role } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            toast.success("Account created successfully! Welcome to EduSpace.");
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
        <div className="min-h-screen flex flex-col overflow-x-hidden">
            <AuthHeader />

            <main className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">
                    {/* Page Heading */}
                    <div className="flex flex-col gap-2 text-center sm:text-left animate-fade-in">
                        <div className="flex items-center gap-3 justify-center sm:justify-start">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users className="size-6 text-primary" />
                            </div>
                            <h1 className="text-foreground text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                                Lecturer Registration
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-base font-normal leading-normal">
                            Join EduSpace and start teaching.
                        </p>
                    </div>

                    {/* Registration Form Card */}
                    <div className="bg-surface rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-none border border-border p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
                        {/* Form */}
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            {/* Full Name Field */}
                            <label className="flex flex-col gap-2">
                                <span className="text-foreground text-sm font-medium leading-normal">
                                    Full Name
                                </span>
                                <div className="relative flex items-center">
                                    <Input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={formData.fullName}
                                        onChange={handleChange("fullName")}
                                        className="pr-10"
                                        disabled={isLoading}
                                    />
                                    <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center">
                                        <User className="size-5" />
                                    </div>
                                </div>
                            </label>

                            {/* Email Field */}
                            <label className="flex flex-col gap-2">
                                <span className="text-foreground text-sm font-medium leading-normal">
                                    Email Address
                                </span>
                                <div className="relative flex items-center">
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange("email")}
                                        className="pr-10"
                                        disabled={isLoading}
                                    />
                                    <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center">
                                        <Mail className="size-5" />
                                    </div>
                                </div>
                            </label>

                            {/* Password Field */}
                            <label className="flex flex-col gap-2">
                                <span className="text-foreground text-sm font-medium leading-normal">
                                    Password
                                </span>
                                <div className="relative flex items-center">
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
                            </label>

                            {/* Confirm Password Field */}
                            <label className="flex flex-col gap-2">
                                <span className="text-foreground text-sm font-medium leading-normal">
                                    Confirm Password
                                </span>
                                <div className="relative flex items-center">
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
                            </label>

                            {/* Terms Agreement */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-1 size-4 rounded border-border text-primary focus:ring-primary/20"
                                    disabled={isLoading}
                                />
                                <label htmlFor="terms" className="text-sm text-muted-foreground">
                                    I agree to the{" "}
                                    <a href="#" className="text-primary hover:underline">Terms of Service</a>
                                    {" "}and{" "}
                                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                                </label>
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

                        {/* Sign In Link */}
                        <div className="flex flex-col gap-3 text-center">
                            <p className="text-muted-foreground text-sm">Already have an account?</p>
                            <Button variant="outline" asChild className="w-full">
                                <Link to="/lecturer/login">Sign In</Link>
                            </Button>
                        </div>

                        {/* Back to Role Selection */}
                        <div className="text-center pt-2 border-t border-border">
                            <Link
                                to="/"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← Back to role selection
                            </Link>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
                        <p className="text-xs text-muted-foreground/70">
                            Protected by reCAPTCHA and subject to the{" "}
                            <a className="underline hover:text-muted-foreground" href="#">
                                Privacy Policy
                            </a>{" "}
                            and{" "}
                            <a className="underline hover:text-muted-foreground" href="#">
                                Terms of Service
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </main>

            <BackgroundDecoration />
        </div>
    );
}
