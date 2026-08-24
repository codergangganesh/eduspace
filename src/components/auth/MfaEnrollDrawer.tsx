import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw, AlertCircle } from "lucide-react";
import { mfaService, TotpEnrollmentData } from "@/services/mfa.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MfaEnrollDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrollmentSuccess: () => void;
}

// Sleek Official Android Bugdroid Icon
export const AndroidIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.156-.2701.0633-.6159-.2068-.7719-.2698-.1561-.6159-.0633-.7719.2069l-2.0227 3.5034c-1.3916-.6337-2.9439-.9939-4.5761-.9939s-3.1845.3602-4.5761.9939L5.7011 5.3025c-.156-.2702-.5021-.363-.7719-.2069-.2701.156-.3628.5018-.2068.7719l1.996 3.4572C3.0458 11.238 0 15.5397 0 20.6128h24c0-5.0731-3.0458-9.3748-6.1185-11.2914" />
  </svg>
);

export const MfaEnrollDrawer: React.FC<MfaEnrollDrawerProps> = ({
  open,
  onOpenChange,
  onEnrollmentSuccess,
}) => {
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
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [open]);

  const startEnrollment = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await mfaService.enrollTOTP("Android Authenticator");
      if (error || !data) {
        setErrorMessage(error || "Failed to initialize 2FA setup.");
      } else {
        setEnrollmentData(data);
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
    if (!enrollmentData?.id || verificationCode.length !== 6) return;

    setIsVerifying(true);
    setErrorMessage("");

    try {
      const res = await mfaService.verifyEnrollment(enrollmentData.id, verificationCode);
      if (res.success) {
        toast.success("Two-factor authentication activated successfully!");
        onEnrollmentSuccess();
        onOpenChange(false);
      } else {
        setErrorMessage(res.error || "Incorrect 6-digit code. Please check your authenticator app.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const qrCodeSrc = enrollmentData?.totp?.qr_code;
  const isSvgString = qrCodeSrc && qrCodeSrc.startsWith("<svg");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg bg-card border-border shadow-2xl p-6 sm:p-7 overflow-y-auto flex flex-col justify-between"
      >
        <div className="space-y-6">
          {/* Header (Centered) */}
          <SheetHeader className="text-center space-y-1 pb-2 border-b border-border/40">
            <SheetTitle className="text-lg sm:text-xl font-bold text-foreground tracking-tight text-center">
              Two-factor authentication
            </SheetTitle>
          </SheetHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Generating 2FA pairing key...</p>
            </div>
          ) : errorMessage && !enrollmentData ? (
            <div className="space-y-4 py-4 text-center">
              {errorMessage.toLowerCase().includes("disabled for totp") ||
              errorMessage.toLowerCase().includes("mfa_factor_type_not_allowed") ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>TOTP is currently Disabled in Supabase</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    To allow Google / Microsoft Authenticator enrollments, enable TOTP in your project dashboard:
                  </p>
                  <ol className="text-[11px] text-muted-foreground list-decimal list-inside space-y-1 bg-background/50 p-2.5 rounded-lg font-mono">
                    <li>Open <strong>Supabase Dashboard</strong></li>
                    <li>Go to <strong>Authentication ➔ Multi-Factor (MFA)</strong></li>
                    <li>Set <strong>TOTP (App Authenticator)</strong> to <strong>Enabled</strong></li>
                    <li>Click <strong>Save changes</strong></li>
                  </ol>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-center gap-2 text-center">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button size="sm" onClick={startEnrollment} className="text-xs h-8 gap-1.5 shadow-sm">
                <RefreshCw className="h-3.5 w-3.5" />
                Check Again / Retry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleVerifyAndActivate} className="space-y-6">
              {/* QR CODE (CENTERED AT TOP) */}
              <div className="flex justify-center pt-1">
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-sm inline-block">
                  {isSvgString ? (
                    <div
                      className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: qrCodeSrc }}
                    />
                  ) : (
                    <img
                      src={qrCodeSrc}
                      alt="Two-factor authentication QR Code"
                      className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
                    />
                  )}
                </div>
              </div>

              {/* STEP 1: Scan QR or enter code (CENTERED) */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                    1
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Step 1</span>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed max-w-sm">
                  Scan the QR code using any authentication application on your phone (e.g.{" "}
                  <span className="text-[#2F80ED] hover:underline cursor-pointer">Google Authenticator</span>,{" "}
                  <span className="text-[#2F80ED] hover:underline cursor-pointer">Duo Mobile</span>,{" "}
                  <span className="text-[#2F80ED] hover:underline cursor-pointer">Authy</span>) or enter the following code:
                </p>

                <div className="flex items-center justify-center gap-2 pt-0.5 bg-muted/40 px-3.5 py-1.5 rounded-lg border border-border/60 max-w-full">
                  <span className="font-mono font-bold text-xs sm:text-sm text-foreground tracking-wider select-all break-all">
                    {enrollmentData?.totp?.secret || "••••••••••••••••••••••••••••"}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md hover:bg-muted shrink-0 transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* STEP 2: Enter 6-digit confirmation code (CENTERED) */}
              <div className="flex flex-col items-center text-center space-y-3 pt-1">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                    2
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Step 2</span>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300">
                  Enter the 6 figure confirmation code shown on the app:
                </p>

                {/* 6 Digit Input Boxes (CENTERED) */}
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className={cn(
                        "w-10 h-12 sm:w-11 sm:h-13 text-center text-xl font-bold rounded-lg border transition-all outline-none bg-background",
                        digit
                          ? "border-[#2F80ED] text-foreground bg-[#2F80ED]/5"
                          : "border-slate-300 dark:border-slate-700 text-foreground",
                        "focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/20"
                      )}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium animate-in fade-in text-center">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Footer Actions (CENTERED) */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isVerifying}
                  className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-4 py-2 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Activating...
                    </>
                  ) : (
                    "Activate"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
