import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
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
        } else {
            toast.error(result.error || "Login failed");
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Sign In" subtitle="Please enter your details below">
            <SEO
                title="Lecturer Login"
                description="Log in to your EduSpace lecturer account to manage classes, assignments, and track student performance."
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
                                placeholder="lecturer@university.edu"
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
                    <Link to="/lecturer/register">Create New Account</Link>
                </Button>
            </div>
        </AuthLayout>
    );
}
