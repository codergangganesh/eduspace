import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import SEO from "@/components/SEO";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (rest of the function)
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Add timeout wrapper to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000) // 10 second timeout
      );

      const resetPromise = supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      const { error } = await Promise.race([resetPromise, timeoutPromise]) as any;

      if (error) {
        // Check if it's an email service error or timeout
        if (
          error.message.includes("sending") ||
          error.message.includes("email") ||
          error.message.includes("timeout") ||
          error.message.includes("Gateway") ||
          error.status === 500 ||
          error.status === 504
        ) {
          // Email service issue - show success anyway for security
          setIsSubmitted(true);
          toast({
            title: "Request Received",
            description: "If this email is registered, you'll receive reset instructions shortly.",
          });
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast({
          title: "Reset Link Sent",
          description: "Check your email for password reset instructions",
        });
      }
    } catch (error: any) {
      console.error("Password reset error:", error);

      // For security, always show success message
      // This prevents email enumeration attacks and handles all errors gracefully
      setIsSubmitted(true);
      toast({
        title: "Request Received",
        description: "If this email is registered, you'll receive reset instructions shortly.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setIsSubmitted(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <SEO
        title="Forgot Password"
        description="Reset your Eduspace password. Enter your email to receive password reset instructions."
        keywords={["Forgot Password", "Reset Password", "EduSpace Account Recovery"]}
      />

      <AuthLayout
        title="Forgot Password"
        subtitle="No worries! Enter your email and we'll send you reset instructions."
        contentMaxWidth="max-w-md"
      >
        {!isSubmitted ? (
          <div className="bg-background lg:rounded-xl lg:border lg:border-border p-0 lg:p-8 lg:shadow-sm">
            <form className="space-y-4 lg:space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
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

              {/* Submit Button */}
              <Button type="submit" className="w-full h-14 lg:h-11 rounded-2xl lg:rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 mt-4" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm">
              <p className="text-muted-foreground">
                Remember your password?{" "}
                <Link to="/login" className="text-blue-600 font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-background lg:rounded-xl lg:border lg:border-border p-0 lg:p-8 lg:shadow-sm flex flex-col items-center gap-6 text-center animate-fade-in">
            <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-foreground text-2xl font-bold">Request Received</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                If an account exists for{" "}
                <span className="font-medium text-foreground">{email}</span>, you will receive password reset instructions shortly.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full mt-4">
              <Button asChild className="w-full h-14 lg:h-11 rounded-2xl lg:rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700">
                <Link to="/login">Back to Sign In</Link>
              </Button>
              <button
                onClick={handleResend}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                Didn't receive the email?{" "}
                <span className="text-blue-600 hover:underline">Try again</span>
              </button>
            </div>
          </div>
        )}
      </AuthLayout>
    </div>
  );
}
