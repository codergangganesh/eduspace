import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw, AlertCircle, KeyRound, HelpCircle, Sun, Moon } from "lucide-react";
import { mfaService, TotpEnrollmentData } from "@/services/mfa.service";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TotpOnboardingModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
  onSkip: () => void;
}

export const TotpOnboardingModal: React.FC<TotpOnboardingModalProps> = ({
  open,
  onSuccess,
  onSkip,
}) => {
  const { user, profile } = useAuth();
  const { actualTheme, setTheme } = useTheme();
  const [enrollmentData, setEnrollmentData] = useState<TotpEnrollmentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setOtp(["", "", "", "", "", ""]);
      setErrorMessage("");
      setCopied(false);
      startEnrollment();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const startEnrollment = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await mfaService.enrollTOTP("Authenticator App");
      if (error || !data) {
        setErrorMessage(error || "Failed to initialize 2FA setup.");
      } else {
        setEnrollmentData(data);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 300);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start 2FA enrollment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!enrollmentData?.totp?.secret) return;
    navigator.clipboard.writeText(enrollmentData.totp.secret);
    setCopied(true);
    toast.success("Secret key copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOtpChange = (index: number, val: string) => {
    setErrorMessage("");
    const cleanDigits = val.replace(/\D/g, "");
    if (!cleanDigits) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    if (cleanDigits.length > 1) {
      const digits = cleanDigits.slice(0, 6).split("");
      const nextOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) nextOtp[index + i] = d;
      });
      setOtp(nextOtp);
      const targetIdx = Math.min(index + digits.length, 5);
      inputRefs.current[targetIdx]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = cleanDigits[cleanDigits.length - 1];
    setOtp(nextOtp);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorMessage("");
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const digits = pasted.split("");
      const nextOtp = [...otp];
      digits.forEach((d, i) => {
        nextOtp[i] = d;
      });
      setOtp(nextOtp);
      const targetIdx = Math.min(digits.length, 5);
      inputRefs.current[targetIdx]?.focus();
    }
  };

  const verificationCode = otp.join("");

  const handleVerifyAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentData?.id) return;

    if (verificationCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit confirmation code.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");

    try {
      const res = await mfaService.verifyEnrollment(enrollmentData.id, verificationCode);
      if (res.success) {
        toast.success("Two-Factor Authentication activated successfully!");
        onSuccess();
      } else {
        setErrorMessage(res.error || "Incorrect 6-digit code. Please check your authenticator app.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSkip = async () => {
    try {
      await mfaService.cleanUnverifiedFactors();
    } catch {}
    onSkip();
  };

  const toggleTheme = () => {
    setTheme(actualTheme === "dark" ? "light" : "dark");
  };

  if (!open) return null;

  const qrCodeSrc = enrollmentData?.totp?.qr_code;
  const isSvgString = qrCodeSrc && qrCodeSrc.startsWith("<svg");
  const accountIdentifier = profile?.full_name || user?.email || "Student Account";

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-50 dark:bg-[#0B0F1A] text-slate-900 dark:text-slate-100 flex flex-col justify-between min-h-screen transition-colors duration-200">
      
      {/* Top Header Bar */}
      <header className="w-full bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="Eduspace Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-white/20"
          />
          <div className="flex items-baseline gap-2">
            <span className="font-black text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
              Eduspace
            </span>
          </div>
        </div>

        {/* Theme Toggle Button perfectly centered in nav area */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center shadow-xs"
            title={`Switch to ${actualTheme === "dark" ? "Light" : "Dark"} Mode`}
            aria-label="Toggle dark and light mode"
          >
            {actualTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </header>

      {/* Main Clean Unified Content Container */}
      <main className="w-full max-w-4xl mx-auto my-auto py-6 sm:py-8 px-4 sm:px-6">
        
        {/* Title & Subtitle */}
        <div className="text-center space-y-1.5 pb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Set up your Multifactor Authentication
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            One-time setup to make your Eduspace account secure and protected.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Generating your pairing QR code & security key...</p>
          </div>
        ) : errorMessage && !enrollmentData ? (
          <div className="space-y-4 py-8 text-center max-w-md mx-auto">
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={startEnrollment} className="h-9 px-4 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry Connection
              </Button>
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold underline hover:text-blue-700 cursor-pointer"
              >
                Cancel setup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifyAndActivate} className="space-y-6">
            
            {/* 2-Column Desktop Grid / Fluid Mobile Stack */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
              
              {/* Left Column: QR Code (Bigger on Desktop) & Copy Key */}
              <div className="md:col-span-5 lg:col-span-5 flex flex-col items-center justify-center space-y-3.5 text-center">
                <div className="p-3 sm:p-3.5 md:p-4 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md inline-block">
                  {isSvgString ? (
                    <div
                      className="w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-60 lg:h-60 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full transition-all"
                      dangerouslySetInnerHTML={{ __html: qrCodeSrc }}
                    />
                  ) : (
                    <img
                      src={qrCodeSrc}
                      alt="Two-Factor Authentication QR Code"
                      className="w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-60 lg:h-60 object-contain mx-auto transition-all"
                    />
                  )}
                </div>

                {/* Manual Secret Key Copy Button */}
                {enrollmentData?.totp?.secret && (
                  <div className="w-full max-w-[220px] sm:max-w-none md:max-w-xs space-y-1">
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-300/60 dark:border-slate-700/60"
                      title="Click to copy secret key"
                    >
                      <KeyRound className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate max-w-[130px] sm:max-w-[170px]">{enrollmentData.totp.secret}</span>
                      {copied ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                    </button>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Account: <strong className="text-slate-700 dark:text-slate-300 font-medium">{accountIdentifier}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Steps 1, 2, 3 & Centered Actions on Desktop */}
              <div className="md:col-span-7 lg:col-span-7 space-y-4">
                
                {/* Step 1 */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] shrink-0">1</span>
                    <h2 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Download an authenticator app
                    </h2>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                    Get <strong className="text-slate-900 dark:text-white font-semibold">Google Authenticator</strong>, <strong className="text-slate-900 dark:text-white font-semibold">Microsoft Authenticator</strong>, or <strong className="text-slate-900 dark:text-white font-semibold">Apple Keychain</strong> on your phone.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] shrink-0">2</span>
                    <h2 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Scan the QR code
                    </h2>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                    Open your app, tap <strong className="text-slate-900 dark:text-white font-semibold">Add Account (+)</strong>, and scan the QR code.
                  </p>
                </div>

                {/* Step 3: Verification Code Input */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] shrink-0">3</span>
                    <label className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Enter 6-digit confirmation code
                    </label>
                  </div>

                  <div className="pl-7 space-y-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          placeholder="•"
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          className={cn(
                            "w-9 h-11 sm:w-10 sm:h-12 text-center text-lg sm:text-xl font-bold rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all outline-none",
                            "focus:ring-2 focus:ring-blue-600 focus:border-blue-600",
                            digit
                              ? "border-blue-600 bg-blue-50/40 text-blue-600 dark:text-blue-400"
                              : "border-slate-300 dark:border-slate-700 hover:border-slate-400"
                          )}
                        />
                      ))}
                    </div>

                    {errorMessage && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1.5 pt-1 animate-in fade-in-0">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errorMessage}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Centered in its area on Desktop with Underlined Cancel setup directly below */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 w-full">
                  <Button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full sm:w-56 md:w-64 h-10 sm:h-11 bg-[#0066CC] hover:bg-[#0055AA] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>

                  {/* Single Small Underlined Cancel setup directly below Continue */}
                  <div className="w-full sm:w-56 md:w-64 flex justify-center pt-0.5">
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer text-center"
                    >
                      Cancel setup
                    </button>
                  </div>

                  <div className="text-center pt-1 w-full">
                    <a
                      href="mailto:support@eduspaceacademy.online"
                      className="inline-flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <HelpCircle className="w-3 h-3 text-blue-500" />
                      <span>Having trouble? Click here for help guides.</span>
                    </a>
                  </div>
                </div>

              </div>

            </div>

          </form>
        )}

      </main>

      {/* Bottom Footer Bar */}
      <footer className="w-full bg-white/80 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0 transition-colors">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-[11px] font-medium">
          <a href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</a>
          <a href="/help" className="hover:text-slate-900 dark:hover:text-white transition-colors">Help</a>
          <a href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact Us</a>
          <a href="/privacy-policy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy & Terms of Use</a>
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Eduspace Academy © {new Date().getFullYear()}
        </div>
      </footer>

    </div>,
    document.body
  );
};
