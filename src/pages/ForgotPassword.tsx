import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Turnstile } from "@marsidev/react-turnstile";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();
  const isCaptchaVerified = Boolean(captchaToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    const result = await resetPassword(email.trim(), captchaToken);

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
      subtitle="Enter your email to receive recovery instructions"
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
      <div>
        {!isSubmitted ? (
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="flex items-center gap-2.5 pb-2 border-b-2 border-slate-200 dark:border-slate-800 focus-within:border-[#2563eb] transition-colors">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-300 dark:text-slate-700 font-light select-none">|</span>
                <input
                  type="email"
                  placeholder="Registered Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none font-medium"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* CAPTCHA Protection */}
            <div className="flex justify-center my-1.5 min-h-[65px]">
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAACoSjniwSUdeJX0r"}
                options={{
                  theme: "auto",
                  size: "normal",
                }}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(undefined)}
                onError={() => setCaptchaToken(undefined)}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={!isCaptchaVerified || isLoading}
                className="w-full h-11 sm:h-12 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Link...</span>
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </div>

            {/* Back to Sign In Link */}
            <div className="text-center pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563eb] dark:text-blue-400 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Recovery Link Sent</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
                Instructions have been sent to <strong>{email}</strong>. Please check your inbox.
              </p>
            </div>

            <Link
              to="/"
              className="w-full h-11 sm:h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm uppercase rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
