import * as React from "react";
import { useState } from "react";
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AndroidIcon } from "./MfaEnrollDrawer";

interface MfaChallengeViewProps {
  factorName?: string;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export const MfaChallengeView: React.FC<MfaChallengeViewProps> = ({
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
        <div className="mx-auto size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-[#3DDC84] border border-emerald-500/20 flex items-center justify-center shadow-inner mb-3">
          <AndroidIcon className="size-7" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-[#3DDC84] border-emerald-500/30 py-0.5 px-2">
            <AndroidIcon className="size-3 mr-1" />
            Android 2FA Verification
          </Badge>
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30 py-0.5 px-2">
            <ShieldCheck className="size-3 mr-1" />
            Two-Factor Auth
          </Badge>
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Enter 2FA Code
        </h2>
        <p className="text-xs text-muted-foreground mt-1 font-medium max-w-xs mx-auto">
          Please enter the 6-digit rotating security code from <strong>{factorName}</strong>.
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
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
              className="text-center font-mono text-2xl tracking-[0.4em] font-bold h-14 bg-background border-2 border-border focus:border-emerald-500 rounded-xl shadow-xs"
              required
              autoFocus
            />
          </div>
          <p className="text-[11px] text-center text-muted-foreground font-medium">
            Codes regenerate every 30 seconds in your authenticator app
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <Button
            type="submit"
            disabled={isVerifying || code.length !== 6}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                <span>Verify & Sign In</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isVerifying}
            className="w-full text-xs text-muted-foreground hover:text-foreground h-9 cursor-pointer gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            Cancel & Return to Login
          </Button>
        </div>
      </form>
    </div>
  );
};
