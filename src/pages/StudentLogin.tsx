import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { toast } from "sonner";

export default function StudentLogin() {
    const navigate = useNavigate();
    const { signIn, signInWithGoogle, signInWithGitHub, isAuthenticated, role } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isGitHubLoading, setIsGitHubLoading] = useState(false);

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
        } else {
            toast.error(result.error || "Login failed");
            setIsLoading(false);
        }
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

    return (
        <AuthLayout title="Sign In" subtitle="Please enter your details below">
            <SEO
                title="Student Login"
                description="Log in to your EduSpace student account to access your courses, assignments, and track your learning progress."
            />
            <div className="bg-background rounded-xl border border-border p-8 shadow-sm">
                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Institutional Email Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Institutional Email
                        </label>
                        <div className="relative">
                            <Input
                                type="email"
                                placeholder="student@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-primary hover:underline"
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

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">OR</span>
                    </div>
                </div>

                {/* Create Account Link */}
                <Button variant="outline" asChild className="w-full">
                    <Link to="/student/register">Create New Account</Link>
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
