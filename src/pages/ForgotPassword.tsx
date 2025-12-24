import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { BackgroundDecoration } from "@/components/auth/BackgroundDecoration";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Password reset request for:", email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <AuthHeader />

      <main className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">
          {/* Back Link */}
          <Link
            to="/login"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium w-fit animate-fade-in"
          >
            <ArrowLeft className="size-4" />
            Back to Sign In
          </Link>

          {!isSubmitted ? (
            <>
              {/* Page Heading */}
              <div className="flex flex-col gap-2 text-center sm:text-left animate-fade-in">
                <h1 className="text-foreground text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                  Forgot Password?
                </h1>
                <p className="text-muted-foreground text-base font-normal leading-normal">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-surface rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-none border border-border p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                  {/* Email Field */}
                  <label className="flex flex-col gap-2">
                    <span className="text-foreground text-sm font-medium leading-normal">
                      Institutional Email
                    </span>
                    <div className="relative flex items-center">
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pr-10"
                      />
                      <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center">
                        <Mail className="size-5" />
                      </div>
                    </div>
                  </label>

                  {/* Submit Button */}
                  <Button type="submit" className="w-full">
                    Send Reset Link
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="bg-surface rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-none border border-border p-6 sm:p-8 flex flex-col items-center gap-6 text-center animate-fade-in">
                <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-foreground text-2xl font-bold">Check Your Email</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We've sent password reset instructions to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <Button asChild className="w-full">
                    <a href={`mailto:${email}`}>Open Email App</a>
                  </Button>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Didn't receive the email?{" "}
                    <span className="text-primary hover:underline">Try again</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Footer Info */}
          <div className="text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <p className="text-xs text-muted-foreground/70">
              Remember your password?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>

      <BackgroundDecoration />
    </div>
  );
}
