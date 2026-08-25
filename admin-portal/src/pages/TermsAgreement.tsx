import * as React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  recordAgreementConsent,
  hasAcceptedCurrentAgreements,
  LEGAL_VERSIONS,
} from "@/services/legal.service";
import { Sun, Moon, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const TermsAgreement: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, profile, signOut, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [acceptedAgreements, setAcceptedAgreements] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme || theme) : "dark";

  // If returning user already accepted, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (hasAcceptedCurrentAgreements(user.id)) {
        const destination = (location.state as any)?.from || "/dashboard";
        navigate(destination, { replace: true });
      }
    }
  }, [user, isLoading, navigate, location.state]);

  const handleAcceptAndContinue = async () => {
    if (!acceptedAgreements) {
      toast.error("Please check the agreement checkbox to continue.");
      return;
    }

    if (!user) {
      toast.error("Session expired. Please log in again.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      setIsSubmitting(true);
      const consent = recordAgreementConsent(
        user.id,
        user.email || profile?.email || "admin@eduspaceacademy.online"
      );

      toast.success("Legal agreements accepted! Redirecting to Dashboard...");

      const destination = (location.state as any)?.from || "/dashboard";
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 400);
    } catch (err: any) {
      toast.error(err.message || "Failed to record consent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (window.confirm("Declining the legal agreements will sign you out. Are you sure?")) {
      await signOut();
      toast.info("Signed out.");
      navigate("/login", { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Clean Header with Logo, Theme Switcher & Sign out */}
      <header className="border-b border-border bg-card px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="Eduspace Logo" className="w-7 h-7 rounded object-contain" />
          <span className="font-bold text-base text-foreground">Eduspace</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded border border-border bg-muted/60 hover:bg-muted text-foreground cursor-pointer"
            aria-label="Toggle theme"
          >
            {currentTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <button
            type="button"
            onClick={handleDecline}
            className="text-xs text-destructive hover:underline cursor-pointer flex items-center gap-1 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8">

        {/* Page Title */}
        <div className="border-b border-border pb-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Institutional Legal Agreements</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Mandatory Review &bull; Version {LEGAL_VERSIONS.TERMS} &bull; Last updated: {LEGAL_VERSIONS.LAST_UPDATED}
          </p>
        </div>

        {/* Informational Intro */}
        <p className="text-xs text-muted-foreground mb-8">
          Please review the Institutional Terms of Service and Privacy Policy below. You must read and agree to both documents to access the Eduspace Administration Portal.
        </p>

        <div className="space-y-12 text-xs sm:text-sm text-muted-foreground leading-relaxed">

          {/* Section 1: Terms of Service */}
          <div className="space-y-6">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-2">
              1. Terms of Service (v{LEGAL_VERSIONS.TERMS})
            </h2>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">1.1 Overview and Acceptance</h3>
              <p>
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("Administrator" or "Institution") and Eduspace Inc. By accessing the Eduspace Administration Portal, you confirm that you possess the institutional authority to administer educational tools, courses, students, and faculty on behalf of your institution.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">1.2 Account Responsibility & Security</h3>
              <p>
                Administrative accounts have elevated privileges. You agree to safeguard all login credentials, passkeys, and two-factor authentication tokens. You must promptly notify Eduspace of any unauthorized access at security@eduspaceacademy.online.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">1.3 Acceptable Use Policy</h3>
              <p>
                You agree not to reverse engineer the platform, deploy unauthorized automated scrapers, tamper with academic records, upload malicious code, or harass users.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">1.4 Educational Records & FERPA Compliance</h3>
              <p>
                All student data and institutional records remain the exclusive property of your institution. Eduspace processes educational data strictly as a School Official with legitimate educational interests under FERPA (34 CFR Part 99) and GDPR Article 28.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">1.5 Disclaimers & Liability</h3>
              <p>
                The platform is provided "as is". Eduspace and its suppliers shall not be liable for indirect, consequential, or punitive damages. Total liability is limited to fees paid in the preceding 12 months.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">1.6 Contact Information</h3>
              <p>
                For legal notices, contract inquiries, or institutional governance questions, please contact:
                <br />
                <strong>Eduspace Inc. — Legal Affairs</strong>
                <br />
                <strong>Email:</strong> <a href="mailto:eduspacelearning8@gmail.com" className="text-primary hover:underline">eduspacelearning8@gmail.com</a>
                <br />
                <strong>Phone:</strong> +91-7670895485
                <br />
                <strong>Address:</strong> 1-194, Mannam Bazar, SN Padu Mandal, Endluru, Prakasam District, Andhra Pradesh - 523225, India
                <br />
                <strong>Website:</strong> <a href="https://www.eduspaceacademy.online" target="_blank" rel="noreferrer" className="text-primary hover:underline">https://www.eduspaceacademy.online</a>
              </p>
            </section>
          </div>

          {/* Section 2: Privacy Policy */}
          <div className="space-y-6 pt-4 border-t border-border">
            <h2 className="text-base sm:text-lg font-bold text-foreground border-b border-border/60 pb-2">
              2. Privacy Policy (v{LEGAL_VERSIONS.PRIVACY})
            </h2>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">2.1 Privacy Commitment</h3>
              <p>
                Eduspace is committed to protecting student and educator privacy. We do not sell student data, do not serve third-party ads, and do not profile students for commercial purposes.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">2.2 Data Collected & Processed</h3>
              <p>
                We collect only information necessary for academic management: administrator and user contact information, course enrollments, attendance, grades, and security audit logs.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">2.3 Data Security & Storage</h3>
              <p>
                All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Backups and server infrastructure are managed under strict Data Processing Addendums.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">2.4 Data Subject Rights & Deletion</h3>
              <p>
                Institutions may request exports, corrections, or deletions of student records at any time by contacting privacy@eduspaceacademy.online.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">2.5 Contact Information and DPO</h3>
              <p>
                For privacy inquiries or Data Protection Officer requests:
                <br />
                <strong>Eduspace Inc. — Data Protection Office</strong>
                <br />
                <strong>Email:</strong> <a href="mailto:eduspacelearning8@gmail.com" className="text-primary hover:underline">eduspacelearning8@gmail.com</a>
                <br />
                <strong>Phone:</strong> +91-7670895485
                <br />
                <strong>Address:</strong> 1-194, Mannam Bazar, SN Padu Mandal, Endluru, Prakasam District, Andhra Pradesh - 523225, India
                <br />
                <strong>Website:</strong> <a href="https://www.eduspaceacademy.online" target="_blank" rel="noreferrer" className="text-primary hover:underline">https://www.eduspaceacademy.online</a>
              </p>
            </section>
          </div>

        </div>

        {/* Single Checkbox with unified text & Action buttons */}
        <div className="mt-10 pt-6 border-t border-border space-y-4">
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer text-xs sm:text-sm font-medium text-foreground select-none">
              <input
                type="checkbox"
                checked={acceptedAgreements}
                onChange={(e) => setAcceptedAgreements(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
              <span>
                I have read, understood, and agree to both the{" "}
                <Link to="/terms" target="_blank" className="text-primary underline font-medium">Terms of Service (v{LEGAL_VERSIONS.TERMS})</Link>
                {" "}and{" "}
                <Link to="/privacy" target="_blank" className="text-primary underline font-medium">Privacy Policy (v{LEGAL_VERSIONS.PRIVACY})</Link>
                .
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 pt-3">
            <button
              type="button"
              onClick={handleDecline}
              className="text-xs text-muted-foreground hover:text-destructive hover:underline cursor-pointer py-2"
            >
              Decline & Sign out
            </button>

            <Button
              type="button"
              onClick={handleAcceptAndContinue}
              disabled={!acceptedAgreements || isSubmitting}
              className="px-6 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Accept and Continue to Dashboard"}
            </Button>
          </div>
        </div>

      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground mt-auto">
        <p>&copy; {new Date().getFullYear()} Eduspace Inc. &bull; <Link to="/terms" target="_blank" className="hover:underline">Terms</Link> &bull; <Link to="/privacy" target="_blank" className="hover:underline">Privacy</Link></p>
      </footer>
    </div>
  );
};
