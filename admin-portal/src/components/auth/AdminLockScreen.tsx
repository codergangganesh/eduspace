import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAdminPinLock } from "@/hooks/useAdminPinLock";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { UserAvatar } from "@/components/users/UserAvatar";
import { Shield, Lock, Delete, RefreshCw, LogOut, AlertCircle, ShieldAlert, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const AdminLockScreen: React.FC = () => {
  const {
    isLocked,
    unlockWithPin,
    unlockWithBiometrics,
    isBiometricsSupported,
    settings,
    cooldown,
  } = useAdminPinLock();
  const { user, profile, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const [pin, setPin] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [shake, setShake] = useState<boolean>(false);
  const autoBiometricPromptedRef = useRef<boolean>(false);

  // Clear PIN and errors on lock state change
  useEffect(() => {
    if (isLocked) {
      setPin("");
      setErrorMessage("");
      setShake(false);
      setIsVerifying(false);
    } else {
      autoBiometricPromptedRef.current = false;
    }
  }, [isLocked]);

  // Handle Biometric Unlock
  const handleBiometricUnlock = useCallback(async () => {
    if (isVerifying || isBiometricScanning || cooldown.isCooldown) return;

    setIsBiometricScanning(true);
    setErrorMessage("");

    try {
      const res = await unlockWithBiometrics();
      if (res.success) {
        toast.success("Unlocked with Biometrics! Welcome back.");
      } else {
        if (!res.error?.includes("cancelled")) {
          setErrorMessage(res.error || "Biometric unlock failed.");
        }
      }
    } catch (err: any) {
      if (!err.message?.includes("cancelled")) {
        setErrorMessage(err.message || "Biometric unlock failed.");
      }
    } finally {
      setIsBiometricScanning(false);
    }
  }, [isVerifying, isBiometricScanning, cooldown.isCooldown, unlockWithBiometrics]);

  // Auto-prompt biometrics once when lock screen appears (if enabled)
  useEffect(() => {
    if (
      isLocked &&
      isBiometricsSupported &&
      settings.biometricsEnabled &&
      !autoBiometricPromptedRef.current &&
      !cooldown.isCooldown
    ) {
      autoBiometricPromptedRef.current = true;
      // Slight delay to allow modal render animation
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLocked, isBiometricsSupported, settings.biometricsEnabled, cooldown.isCooldown, handleBiometricUnlock]);

  // Handle PIN verification
  const handleVerify = useCallback(
    async (pinToVerify: string) => {
      if (pinToVerify.length !== 4 || isVerifying || cooldown.isCooldown) return;

      setIsVerifying(true);
      setErrorMessage("");

      try {
        const res = await unlockWithPin(pinToVerify);
        if (!res.success) {
          setErrorMessage(res.error || "Incorrect PIN. Please try again.");
          setShake(true);
          setTimeout(() => setShake(false), 600);
          setPin("");
        } else {
          toast.success("Welcome back, Administrator!");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to unlock.");
        setPin("");
      } finally {
        setIsVerifying(false);
      }
    },
    [isVerifying, cooldown.isCooldown, unlockWithPin]
  );

  // Keypad click handlers
  const handleNumberClick = (num: number) => {
    if (pin.length >= 4 || isVerifying || cooldown.isCooldown) return;
    const nextPin = pin + num.toString();
    setPin(nextPin);

    if (nextPin.length === 4) {
      handleVerify(nextPin);
    }
  };

  const handleBackspace = () => {
    if (isVerifying || cooldown.isCooldown) return;
    setErrorMessage("");
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isVerifying || cooldown.isCooldown) return;
    setErrorMessage("");
    setPin("");
  };

  // Physical keyboard listener (0-9, Backspace, Escape)
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (cooldown.isCooldown || isVerifying) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        const num = parseInt(e.key, 10);
        setPin((prev) => {
          if (prev.length >= 4) return prev;
          const next = prev + num.toString();
          if (next.length === 4) {
            handleVerify(next);
          }
          return next;
        });
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setErrorMessage("");
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        setErrorMessage("");
        setPin("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, cooldown.isCooldown, isVerifying, handleVerify]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out of Admin Portal.");
      navigate("/login", { replace: true });
    } catch {
      window.location.href = "/login";
    }
  };

  if (!isLocked) return null;

  const displayName = profile?.full_name || user?.email || "System Administrator";

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-background/92 backdrop-blur-2xl text-foreground select-none overflow-y-auto animate-in fade-in duration-300">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-5 my-auto">
        {/* Admin Avatar & Security Badge */}
        <div className="relative group">
          <div className="relative">
            <UserAvatar
              name={displayName}
              avatarUrl={profile?.avatar_url}
              size="lg"
              className="h-20 w-20 border-4 border-card shadow-2xl ring-2 ring-primary/40"
            />
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg border-2 border-background">
              <Lock className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Identity & Portal Info */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30 bg-primary/5 py-0.5 px-2.5"
            >
              <Shield className="h-3 w-3 mr-1" />
              Eduspace Admin Security Shield
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">{displayName}</h2>
          <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">{user?.email}</p>
        </div>

        {/* 1-Touch Biometric Unlock Button (If Supported) */}
        {isBiometricsSupported && settings.biometricsEnabled && (
          <Button
            type="button"
            variant="outline"
            disabled={isVerifying || isBiometricScanning || cooldown.isCooldown}
            onClick={handleBiometricUnlock}
            className="w-full max-w-[280px] h-11 rounded-2xl border-primary/40 bg-primary/10 hover:bg-primary hover:text-primary-foreground text-foreground font-bold text-xs sm:text-sm gap-2.5 shadow-sm shadow-primary/20 transition-all cursor-pointer group"
          >
            <Fingerprint className={cn("h-5 w-5 text-primary group-hover:text-primary-foreground", isBiometricScanning && "animate-pulse")} />
            <span>{isBiometricScanning ? "Scan Fingerprint / Face ID..." : "Unlock with Fingerprint / Face ID"}</span>
          </Button>
        )}

        {/* PIN Entry Prompt & Dot Indicators */}
        <div className="space-y-3.5 w-full">
          <div className="flex items-center justify-center gap-2">
            <div className="h-px bg-border flex-1 max-w-[60px]" />
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {isBiometricsSupported && settings.biometricsEnabled ? "Or enter 4-digit PIN" : "Enter 4-digit PIN"}
            </p>
            <div className="h-px bg-border flex-1 max-w-[60px]" />
          </div>

          {/* 4 Glowing PIN Dots */}
          <div
            className={cn(
              "flex items-center justify-center gap-4 py-1.5 transition-transform duration-300",
              shake && "animate-shake"
            )}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={cn(
                    "w-4 h-4 rounded-full transition-all duration-200 border-2",
                    isFilled
                      ? "bg-primary border-primary shadow-md shadow-primary/40 scale-125"
                      : "border-muted-foreground/30 bg-muted/40",
                    errorMessage && "border-destructive bg-destructive/20"
                  )}
                />
              );
            })}
          </div>

          {/* Error / Cooldown Feedback */}
          {errorMessage && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-destructive font-medium animate-in fade-in">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {cooldown.isCooldown && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Retry in {cooldown.remainingSeconds} seconds</span>
            </div>
          )}
        </div>

        {/* Fintech-grade Numeric Keypad */}
        <div className="w-full grid grid-cols-3 gap-3 sm:gap-4 max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={isVerifying || cooldown.isCooldown}
              onClick={() => handleNumberClick(num)}
              className="h-13 sm:h-14 rounded-2xl bg-card/70 hover:bg-primary hover:text-primary-foreground border border-border/70 active:scale-95 transition-all text-xl font-bold shadow-sm flex flex-col items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none group"
            >
              <span>{num}</span>
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            disabled={isVerifying || cooldown.isCooldown || pin.length === 0}
            onClick={handleClear}
            className="h-13 sm:h-14 rounded-2xl bg-card/40 hover:bg-card/80 border border-border/40 active:scale-95 transition-all text-xs font-semibold text-muted-foreground hover:text-foreground shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
            title="Clear entered digits (Esc)"
          >
            Clear
          </button>

          {/* Zero Button */}
          <button
            type="button"
            disabled={isVerifying || cooldown.isCooldown}
            onClick={() => handleNumberClick(0)}
            className="h-13 sm:h-14 rounded-2xl bg-card/70 hover:bg-primary hover:text-primary-foreground border border-border/70 active:scale-95 transition-all text-xl font-bold shadow-sm flex flex-col items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>0</span>
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            disabled={isVerifying || cooldown.isCooldown || pin.length === 0}
            onClick={handleBackspace}
            className="h-13 sm:h-14 rounded-2xl bg-card/40 hover:bg-card/80 border border-border/40 active:scale-95 transition-all text-muted-foreground hover:text-foreground shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
            title="Backspace"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Verification Loading Indicator */}
        {isVerifying && (
          <div className="flex items-center gap-2 text-xs font-semibold text-primary animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Verifying PIN...</span>
          </div>
        )}

        {/* Emergency / Sign Out Option */}
        <div className="pt-1 flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Forgot PIN? Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
