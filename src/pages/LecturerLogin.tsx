import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import SEO from "@/components/SEO";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";

export default function LecturerLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, isAuthenticated, role } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string>();

    // Show registration success message if redirected from registration
    useEffect(() => {
        if (location.state?.registered) {
            toast.success("Your account has been successfully created. Please log in to continue.");
            // Clear location state to prevent toast on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

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

        const result = await signIn(email, password, captchaToken);

        if (result.success) {
            toast.success("Welcome back!");
        } else {
            toast.error(result.error || "Login failed");
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Lecturer Sign In" subtitle="Access your portal to manage your courses and students">
            <SEO
                title="Lecturer Login"
                description="Access the EduSpace Lecturer Portal. Manage your courses, grade assignments, and communicate with students."
                keywords={["Lecturer Login", "Teacher Portal", "EduSpace for Educators", "LMS Login", "Grading System"]}
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
                        "name": "Lecturer Login",
                        "item": "https://eduspaceacademy.online/lecturer/login"
                    }]
                }}
            />
            <div className="bg-background lg:rounded-xl lg:border lg:border-border p-0 lg:p-8 lg:shadow-sm">
                <div className="mb-8 lg:hidden">
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Lecturer</h2>
                    <p className="text-blue-600 font-bold text-lg -mt-1">Login</p>
                </div>
                {/* Form */}
                <form className="space-y-4 lg:space-y-5" onSubmit={handleSubmit}>
                    {/* Institutional Email Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground lg:block hidden">
                            Institutional Email
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                <Mail className="size-5" />
                            </div>
                            <Input
                                type="email"
                                placeholder="Institutional Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-12 h-14 lg:h-11 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
                                disabled={isLoading}
                                required
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-12 pr-12 h-14 lg:h-11 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
                                disabled={isLoading}
                                required
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

                    {/* Forgot Password Link */}
                    <div className="flex justify-end pt-1">
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-blue-600 hover:underline"
                        >
                            Forgot Password?
                        </Link>
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
                                Signing In...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>

                {/* Footer - Only on mobile */}
                <div className="mt-8 text-center lg:hidden">
                    <p className="text-muted-foreground text-sm">
                        Don't have an account? <Link to="/lecturer/register" className="text-blue-600 font-bold hover:underline">Create Account</Link>
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
                        <Link to="/lecturer/register">Create New Account</Link>
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}
