import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Eye, EyeOff, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { BackgroundDecoration } from "@/components/auth/BackgroundDecoration";
import { toast } from "sonner";

export default function LecturerLogin() {
    const navigate = useNavigate();
    const { signIn, isAuthenticated, role } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && role) {
            navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard", { replace: true });
        }
    }, [isAuthenticated, role, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);

        const result = await signIn(email, password);

        if (result.success) {
            toast.success("Welcome back!");
            // Navigation will be handled by the useEffect above when auth state updates
        } else {
            toast.error(result.error || "Login failed");
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden">
            <AuthHeader />

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">
                    {/* Page Heading */}
                    <div className="flex flex-col gap-2 text-center sm:text-left animate-fade-in">
                        <div className="flex items-center gap-3 justify-center sm:justify-start">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users className="size-6 text-primary" />
                            </div>
                            <h1 className="text-foreground text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                                Lecturer Login
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-base font-normal leading-normal">
                            Please enter your details to sign in.
                        </p>
                    </div>

                    {/* Login Form Card */}
                    <div className="bg-surface rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-none border border-border p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
                        {/* Form */}
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            {/* Email Field */}
                            <label className="flex flex-col gap-2">
                                <span className="text-foreground text-sm font-medium leading-normal">
                                    Email Address
                                </span>
                                <div className="relative flex items-center">
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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

                            {/* Forgot Password Link */}
                            <div className="flex justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-primary hover:text-primary-hover hover:underline decoration-primary/30 underline-offset-4 transition-all"
                                >
                                    Forgot Password?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Signing In...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>

                        {/* Create Account */}
                        <div className="flex flex-col gap-3 text-center">
                            <p className="text-muted-foreground text-sm">Don't have an account yet?</p>
                            <Button variant="outline" asChild className="w-full">
                                <Link to="/lecturer/register">Create New Account</Link>
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
