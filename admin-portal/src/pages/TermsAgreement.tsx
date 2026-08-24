import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  recordAgreementConsent,
  hasAcceptedCurrentAgreements,
  LEGAL_VERSIONS
} from "@/services/legal.service";
import {
  Shield,
  FileText,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  ExternalLink,
  Printer,
  Scale
} from "lucide-react";
import { toast } from "sonner";

export const TermsAgreement: React.FC = () => {
  const { user, signOut, isAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If returning user already accepted, redirect directly to dashboard or return url
  useEffect(() => {
    if (!isLoading && user) {
      if (hasAcceptedCurrentAgreements(user.id)) {
        const destination = (location.state as any)?.from || "/dashboard";
        navigate(destination, { replace: true });
      }
    }
  }, [user, isLoading, navigate, location.state]);

  const handleAcceptAndContinue = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      toast.error("Please read and check both agreements before continuing.");
      return;
    }

    if (!user) {
      toast.error("Session expired. Please log in again.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      setIsSubmitting(true);
      const consent = recordAgreementConsent(user.id, user.email || "admin@eduspaceacademy.online");
      
      toast.success("Agreements accepted successfully! Redirecting to Dashboard...", {
        description: `Consent recorded at ${new Date(consent.acceptedAt).toLocaleTimeString()}`
      });

      const destination = (location.state as any)?.from || "/dashboard";
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 500);
    } catch (err: any) {
      toast.error(err.message || "Failed to record consent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (confirm("Declining the legal agreements will sign you out. Are you sure?")) {
      await signOut();
      toast.info("Signed out. You may review our terms again at any time.");
      navigate("/login", { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#93c5fd]/50 to-[#1e3a8a]/90 dark:from-[#0B0F1A] dark:via-[#0F172A] dark:to-[#020617] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 font-sans">
      
      <div className="w-full max-w-4xl bg-white dark:bg-[#0F172A] rounded-[32px] shadow-[0_25px_70px_-15px_rgba(30,58,138,0.4)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8)] border border-white/50 dark:border-slate-800/80 overflow-hidden flex flex-col transition-colors duration-300 my-auto">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#1d4ed8] p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-sm shrink-0">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Mandatory Review</span>
                <span className="text-[10px] bg-blue-500/40 text-blue-100 px-2 py-0.5 rounded-full font-bold">v{LEGAL_VERSIONS.TERMS}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Institutional Legal Agreements
              </h1>
            </div>
          </div>

          <div className="text-xs font-medium text-blue-100/90 text-left sm:text-right">
            <p>Authenticated as: <strong className="text-white">{user?.email || "Admin"}</strong></p>
            <p className="text-[11px] text-blue-200">Effective: {LEGAL_VERSIONS.LAST_UPDATED}</p>
          </div>
        </div>

        {/* Informational Prompt */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Welcome to the Eduspace Administration Portal. Before entering the institutional dashboard, please review and accept our updated <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>. Your consent guarantees platform compliance with educational data standards (FERPA, GDPR, and COPPA).
          </p>

          {/* Interactive Document Preview Box */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-[#F8FAFC] dark:bg-slate-900/60 shadow-xs">
            
            {/* Tab Controls */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("terms")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "terms"
                      ? "bg-[#2563eb] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Terms of Service</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("privacy")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "privacy"
                      ? "bg-[#0d9488] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Privacy Policy</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={activeTab === "terms" ? "/terms" : "/privacy"}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                >
                  <span>Open Full Document</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Scrollable Summary Box */}
            <div className="p-5 max-h-56 sm:max-h-64 overflow-y-auto text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed font-sans scrollbar-thin">
              {activeTab === "terms" ? (
                <>
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>Summary of Key Terms:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Institutional Authority:</strong> You confirm authorization to administer academic tools on behalf of your designated educational entity.</li>
                    <li><strong>Account Security:</strong> You agree to safeguard administrative credentials, MFA devices, and avoid unauthorized role delegation.</li>
                    <li><strong>Acceptable Conduct:</strong> Absolute prohibition of automated scraping, reverse engineering, academic tampering, harassment, or malicious injection.</li>
                    <li><strong>FERPA & GDPR Compliance:</strong> Educational records belong to your institution; Eduspace processes data under strict School Official mandates.</li>
                    <li><strong>Limitation of Liability:</strong> Disclaimers of indirect damages and established standard liability caps.</li>
                  </ul>
                  <p className="text-[11px] text-slate-400 italic">
                    Refer to the full <Link to="/terms" target="_blank" className="text-blue-500 underline font-semibold">Terms of Service</Link> for detailed legal provisions on governing law, arbitration, and indemnification.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <Shield className="w-4 h-4 text-teal-500" />
                    <span>Summary of Privacy Practices:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Zero Data Monetization:</strong> We never sell, rent, or lease personal student or educator records to third parties.</li>
                    <li><strong>Encryption by Default:</strong> Data is secured using AES-256 at rest and TLS 1.3 in transit with strict RBAC access policies.</li>
                    <li><strong>Controlled Sub-Processors:</strong> Hosting and transactional services (AWS, Supabase) operate under enforceable DPAs.</li>
                    <li><strong>Enforceable Rights:</strong> Data subjects may exercise access, rectification, portability, and deletion rights at any time.</li>
                    <li><strong>Minimal Cookie Usage:</strong> Strict usage of necessary session and theme cookies with zero commercial tracking pixels.</li>
                  </ul>
                  <p className="text-[11px] text-slate-400 italic">
                    Refer to the full <Link to="/privacy" target="_blank" className="text-teal-500 underline font-semibold">Privacy Policy</Link> for international transfers, DPO contacts, and regulatory disclosures.
                  </p>
                </>
              )}
            </div>

          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3.5 bg-white dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-[#2563eb]"
              />
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors font-medium">
                I have read, understood, and agree to be bound by the{" "}
                <Link to="/terms" target="_blank" className="text-[#2563eb] dark:text-blue-400 underline font-bold hover:text-blue-600">
                  Eduspace Terms of Service (v{LEGAL_VERSIONS.TERMS})
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-[#2563eb]"
              />
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors font-medium">
                I have reviewed and acknowledge the data practices described in the{" "}
                <Link to="/privacy" target="_blank" className="text-[#0d9488] dark:text-teal-400 underline font-bold hover:text-teal-600">
                  Eduspace Privacy Policy (v{LEGAL_VERSIONS.PRIVACY})
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleDecline}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Decline & Sign Out</span>
            </button>

            <button
              type="button"
              onClick={handleAcceptAndContinue}
              disabled={!acceptedTerms || !acceptedPrivacy || isSubmitting}
              className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording Consent...</span>
                </>
              ) : (
                <>
                  <span>Accept & Continue to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      <p className="text-center text-[11px] text-white/80 dark:text-slate-500 mt-6 font-medium">
        Eduspace Institutional Governance &bull; Questions? Contact <a href="mailto:legal@eduspaceacademy.online" className="underline hover:text-white">legal@eduspaceacademy.online</a>
      </p>

    </div>
  );
};
