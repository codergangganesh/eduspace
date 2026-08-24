import * as React from "react";
import { useState } from "react";
import { Smartphone, ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AdminMfaChallengeViewProps {
  factorName?: string;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

// Sleek Official Android Bugdroid Icon
const AndroidIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.156-.2701.0633-.6159-.2068-.7719-.2698-.1561-.6159-.0633-.7719.2069l-2.0227 3.5034c-1.3916-.6337-2.9439-.9939-4.5761-.9939s-3.1845.3602-4.5761.9939L5.7011 5.3025c-.156-.2702-.5021-.363-.7719-.2069-.2701.156-.3628.5018-.2068.7719l1.996 3.4572C3.0458 11.238 0 15.5397 0 20.6128h24c0-5.0731-3.0458-9.3748-6.1185-11.2914" />
  </svg>
);

export const AdminMfaChallengeView: React.FC<AdminMfaChallengeViewProps> = ({
  factorName = "Android Authenticator",
  onVerify,
  onCancel,
}) => {
  const [code, setCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/\s+/g, "").trim();
    if (cleanCode.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage("");

    try {
      const res = await onVerify(cleanCode);
      if (!res.success) {
        setErrorMessage(res.error || "Incorrect 6-digit code. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "2FA verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto py-2 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-[#3DDC84] border border-emerald-500/20 flex items-center justify-center shadow-inner mb-3">
          <AndroidIcon className="h-7 w-7" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#3DDC84] border-emerald-500/30 py-0.5 px-2">
            <AndroidIcon className="h-3 w-3 mr-1" />
            Android 2FA Verification
          </Badge>
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30 py-0.5 px-2">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Two-Factor Auth
          </Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
          Enter 2FA Code
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-xs mx-auto">
          Please enter the 6-digit rotating security code from <strong>{factorName}</strong>.
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 6-Digit Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setErrorMessage("");
                setCode(e.target.value.replace(/\D/g, ""));
              }}
              placeholder="••••••"
              className="text-center font-mono text-2xl tracking-[0.4em] font-bold h-14 bg-white dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 focus:border-primary rounded-xl shadow-xs"
              required
              autoFocus
            />
          </div>
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-medium">
            Codes regenerate every 30 seconds in your authenticator app
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            type="submit"
            disabled={isVerifying || code.length !== 6}
            className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Verify & Sign In</span>
              </>
            )}
          </button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isVerifying}
            className="w-full text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white h-9 cursor-pointer gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Cancel & Return to Login
          </Button>
        </div>
      </form>
    </div>
  );
};
