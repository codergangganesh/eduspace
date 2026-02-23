import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SEO from "@/components/SEO";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    const result = await resetPassword(email);

    if (result.success) {
      setIsSubmitted(true);
      toast.success("Reset link sent! Please check your email.");
    } else {
      toast.error(result.error || "Failed to send reset link");
    }

    setIsLoading(false);
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a password reset link"
    >
      <SEO
        title="Forgot Password"
        description="Reset your EduSpace account password. Enter your email address to receive a secure password reset link."
        keywords={["Reset Password", "Forgot Password", "EduSpace Account Recovery", "Secure Login"]}
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
            "name": "Forgot Password",
            "item": "https://eduspaceacademy.online/forgot-password"
          }]
        }}
      />
      <div className="bg-background lg:rounded-xl lg:border lg:border-border p-0 lg:p-8 lg:shadow-sm">
        {!isSubmitted ? (
          <>
            <div className="mb-8 lg:hidden">
              <h2 className="text-3xl font-black text-foreground tracking-tight">Reset</h2>
              <p className="text-blue-600 font-bold text-lg -mt-1">Password</p>
            </div>

            <form className="space-y-4 lg:space-y-5" onSubmit={handleSubmit}>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 lg:h-11 lg:pl-10 lg:pr-10 rounded-2xl lg:rounded-xl border-border/50 bg-secondary/30 lg:bg-background"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 lg:h-11 rounded-2xl lg:rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 mt-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-5 mr-2 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="flex justify-center pt-2">
                <Link
                  to="/"
                  className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="flex justify-center mb-6">
              <div className="size-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-10" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Check your email</h3>
            <p className="text-muted-foreground mb-8">
              We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
            </p>
            <Button asChild variant="outline" className="w-full h-11">
              <Link to="/">Back to Sign In</Link>
            </Button>
          </div>
        )}
      </div>
      {/* Desktop Divider - Optional for forgot password but consistent with other pages */}
      {!isSubmitted && (
        <div className="hidden lg:block mt-6 px-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
