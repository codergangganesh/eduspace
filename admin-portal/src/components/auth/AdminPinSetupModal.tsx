import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminPinLock } from "@/hooks/useAdminPinLock";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useTheme } from "next-themes";
import {
  Delete,
  AlertCircle,
  ArrowLeft,
  Sun,
  Moon,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { numpadFeedback } from "@/lib/numpadFeedback";
import { validateLockPassword } from "@/services/pinLock.service";

interface AdminPinSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPinConfigured: (secret: string, lockType?: "pin" | "password") => Promise<{ success: boolean; error?: string }>;
  isUpdating?: boolean;
  initialLockType?: "pin" | "password";
  currentLockType?: "pin" | "password";
}

// Detects weak/predictable 4-digit PIN combinations
function checkWeakPin(pin: string): { isWeak: boolean; message?: string } {
  if (pin.length < 4) return { isWeak: false };

  if (/^(\d)\1{3}$/.test(pin)) {
    return { isWeak: true, message: "Avoid repeating digits (e.g. 0000, 1111)." };
  }

  const sequential = [
    "0123", "1234", "2345", "3456", "4567", "5678", "6789",
    "9876", "8765", "7654", "6543", "5432", "4321", "3210",
  ];
  if (sequential.includes(pin)) {
    return { isWeak: true, message: "Avoid sequential numbers (e.g. 1234, 4321)." };
  }

  const common = ["1212", "1313", "6969", "2580", "0852", "2024", "2025", "2026"];
  if (common.includes(pin)) {
    return { isWeak: true, message: "Easily guessable PIN. Please choose a stronger PIN." };
  }

  return { isWeak: false };
}

export const AdminPinSetupModal: React.FC<AdminPinSetupModalProps> = ({
  open,
  onOpenChange,
  onPinConfigured,
  isUpdating = false,
  initialLockType = "pin",
  currentLockType,
}) => {
  const { user, profile } = useAdminAuth();
  const { verifyCurrentSecret, settings } = useAdminPinLock();
  const { setTheme, resolvedTheme } = useTheme();

  const activeCurrentLockType = currentLockType || settings.lockType || "pin";

  // Step 0 = Verification of Current Secret (only if isUpdating), Step 1 = Enter New Secret, Step 2 = Confirm New Secret
  const [step, setStep] = useState<0 | 1 | 2>(isUpdating ? 0 : 1);
  const [targetLockType, setTargetLockType] = useState<"pin" | "password">(initialLockType);

  // Step 0 (Current Secret Verification) States
  const [currentEnteredPin, setCurrentEnteredPin] = useState<string>("");
  const [currentEnteredPassword, setCurrentEnteredPassword] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [isVerifyingCurrent, setIsVerifyingCurrent] = useState<boolean>(false);

  // Step 1 & 2 (New PIN Mode) States
  const [firstPin, setFirstPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pressedKey, setPressedKey] = useState<number | string | null>(null);

  // Step 1 & 2 (New Password Mode) States
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Common States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [shake, setShake] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setStep(isUpdating ? 0 : 1);
      setTargetLockType(initialLockType);
      setCurrentEnteredPin("");
      setCurrentEnteredPassword("");
      setShowCurrentPassword(false);
      setIsVerifyingCurrent(false);
      setFirstPin("");
      setConfirmPin("");
      setShowPin(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setShowNewPassword(false);
      setErrorMessage("");
      setShake(false);
      setIsSubmitting(false);
      setPressedKey(null);
    }
  }, [open, isUpdating, initialLockType]);

  const activeNewPin = step === 1 ? firstPin : confirmPin;

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Mannam Ganesh Babu");

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  // --- Step 0: Verify Current Secret ---
  const handleVerifyCurrentPin = useCallback(async (entered: string) => {
    if (isVerifyingCurrent) return;
    setIsVerifyingCurrent(true);
    setErrorMessage("");

    try {
      const isValid = await verifyCurrentSecret(entered);
      if (isValid) {
        numpadFeedback.playSuccess();
        setErrorMessage("");
        setIsVerifyingCurrent(false);
        setStep(1);
      } else {
        numpadFeedback.playError();
        setShake(true);
        setErrorMessage("Incorrect current PIN. Please try again.");
        setTimeout(() => {
          setShake(false);
          setCurrentEnteredPin("");
          setIsVerifyingCurrent(false);
        }, 500);
      }
    } catch {
      numpadFeedback.playError();
      setShake(true);
      setErrorMessage("Verification failed.");
      setTimeout(() => {
        setShake(false);
        setCurrentEnteredPin("");
        setIsVerifyingCurrent(false);
      }, 500);
    }
  }, [isVerifyingCurrent, verifyCurrentSecret]);

  const handleVerifyCurrentPassword = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isVerifyingCurrent || !currentEnteredPassword.trim()) return;

    setIsVerifyingCurrent(true);
    setErrorMessage("");

    try {
      const isValid = await verifyCurrentSecret(currentEnteredPassword);
      if (isValid) {
        numpadFeedback.playSuccess();
        setErrorMessage("");
        setIsVerifyingCurrent(false);
        setStep(1);
      } else {
        numpadFeedback.playError();
        setShake(true);
        setErrorMessage("Incorrect current password. Please try again.");
        setTimeout(() => {
          setShake(false);
          setIsVerifyingCurrent(false);
        }, 500);
      }
    } catch {
      numpadFeedback.playError();
      setShake(true);
      setErrorMessage("Verification failed.");
      setTimeout(() => {
        setShake(false);
        setIsVerifyingCurrent(false);
      }, 500);
    }
  }, [isVerifyingCurrent, currentEnteredPassword, verifyCurrentSecret]);

  const handleFinalPinSubmit = useCallback(async (p1: string, p2: string) => {
    if (p1 !== p2) {
      numpadFeedback.playError();
      setErrorMessage("PINs do not match. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setConfirmPin("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await onPinConfigured(p1, "pin");
      if (res.success) {
        numpadFeedback.playSuccess();
        toast.success(isUpdating ? "4-Digit PIN updated successfully!" : "4-Digit PIN Lock activated!");
        onOpenChange(false);
      } else {
        numpadFeedback.playError();
        setErrorMessage(res.error || "Failed to set up PIN.");
        setConfirmPin("");
      }
    } catch (err: any) {
      numpadFeedback.playError();
      setErrorMessage(err.message || "An error occurred.");
      setConfirmPin("");
    } finally {
      setIsSubmitting(false);
    }
  }, [onPinConfigured, isUpdating, onOpenChange]);

  // --- Step 1 & 2: PIN Mode Handlers ---
  const handleNumberClick = useCallback((num: number) => {
    if (isSubmitting || isVerifyingCurrent) return;

    numpadFeedback.playKeypress(num);
    setErrorMessage("");
    setPressedKey(num);
    setTimeout(() => setPressedKey(null), 180);

    // If on Step 0 (Verify Current PIN)
    if (step === 0) {
      if (currentEnteredPin.length >= 4) return;
      const next = currentEnteredPin + num.toString();
      setCurrentEnteredPin(next);
      if (next.length === 4) {
        handleVerifyCurrentPin(next);
      }
      return;
    }

    // Step 1: Set New PIN
    if (step === 1) {
      if (firstPin.length >= 4) return;
      const next = firstPin + num.toString();
      setFirstPin(next);
      if (next.length === 4) {
        const weakCheck = checkWeakPin(next);
        if (weakCheck.isWeak) {
          numpadFeedback.playError();
          setErrorMessage(weakCheck.message || "Weak PIN: Choose a stronger 4-digit code.");
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setFirstPin("");
          }, 600);
          return;
        }

        setTimeout(() => {
          setStep(2);
        }, 180);
      }
    } else {
      // Step 2: Confirm New PIN
      if (confirmPin.length >= 4) return;
      const next = confirmPin + num.toString();
      setConfirmPin(next);
      if (next.length === 4) {
        handleFinalPinSubmit(firstPin, next);
      }
    }
  }, [
    isSubmitting,
    isVerifyingCurrent,
    step,
    currentEnteredPin,
    firstPin,
    confirmPin,
    handleVerifyCurrentPin,
    handleFinalPinSubmit,
  ]);

  const handleBackspace = useCallback(() => {
    if (isSubmitting || isVerifyingCurrent) return;
    numpadFeedback.playDelete();
    setErrorMessage("");
    setPressedKey("backspace");
    setTimeout(() => setPressedKey(null), 180);

    if (step === 0) {
      setCurrentEnteredPin((prev) => prev.slice(0, -1));
    } else if (step === 1) {
      setFirstPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  }, [isSubmitting, isVerifyingCurrent, step]);

  const handleClear = useCallback(() => {
    if (isSubmitting || isVerifyingCurrent) return;
    numpadFeedback.playDelete();
    setErrorMessage("");
    setPressedKey("clear");
    setTimeout(() => setPressedKey(null), 180);

    if (step === 0) {
      setCurrentEnteredPin("");
    } else if (step === 1) {
      setFirstPin("");
    } else {
      setConfirmPin("");
    }
  }, [isSubmitting, isVerifyingCurrent, step]);

  // --- Step 1 & 2: Password Mode Handler ---
  const handleFinalPasswordSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const validation = validateLockPassword(newPassword);
    if (!validation.isValid) {
      numpadFeedback.playError();
      setErrorMessage(validation.reason || "Password does not meet complexity requirements.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      numpadFeedback.playError();
      setErrorMessage("Passwords do not match. Please re-enter.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await onPinConfigured(newPassword, "password");
      if (res.success) {
        numpadFeedback.playSuccess();
        toast.success(isUpdating ? "Lock Password updated successfully!" : "Screen Lock Password activated!");
        onOpenChange(false);
      } else {
        numpadFeedback.playError();
        setErrorMessage(res.error || "Failed to set up password.");
      }
    } catch (err: any) {
      numpadFeedback.playError();
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, newPassword, confirmNewPassword, onPinConfigured, isUpdating, onOpenChange]);

  // Physical keyboard listener for PIN mode
  useEffect(() => {
    const isPinActive = (step === 0 && activeCurrentLockType === "pin") || (step > 0 && targetLockType === "pin");
    if (!open || !isPinActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || isVerifyingCurrent) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumberClick(parseInt(e.key, 10));
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    step,
    activeCurrentLockType,
    targetLockType,
    isSubmitting,
    isVerifyingCurrent,
    handleNumberClick,
    handleBackspace,
    handleClear,
  ]);

  if (!open) return null;

  const isPasswordView = (step === 0 && activeCurrentLockType === "password") || (step > 0 && targetLockType === "password");

  const content = (
    <div className="fixed inset-0 top-0 left-0 w-screen h-[100dvh] max-h-[100dvh] z-[999999] bg-background dark:bg-[#08090C] text-foreground select-none flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200">
      {/* Frame Container */}
      <div className={cn("w-full mx-auto min-h-full flex flex-col justify-between px-5 sm:px-6 py-6 sm:py-8 transition-all duration-300", isPasswordView ? "max-w-md" : "max-w-sm")}>
        {/* Top Header */}
        <div className="w-full flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border/80 shadow-xs bg-card p-0.5">
              <img
                src="/favicon.png"
                alt="Eduspace Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Eduspace Admin
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                numpadFeedback.playKeypress();
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-border/80 bg-card/80 hover:bg-accent text-foreground transition-all active:scale-90 cursor-pointer shadow-2xs"
              title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            <div className="relative">
              <UserAvatar
                name={displayName}
                avatarUrl={avatarUrl}
                size="sm"
                className="h-9 w-9 rounded-full border border-border shadow-xs object-cover"
              />
            </div>
          </div>
        </div>

        {/* Center Section */}
        <div className="w-full flex flex-col items-center pt-2 sm:pt-4 my-auto">
          {/* If on Step 0: Verification Header */}
          {step === 0 ? (
            <div className="flex flex-col items-center w-full">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3 shadow-2xs">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground text-center">
                Verify Identity
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium text-center mt-1">
                Enter your current {activeCurrentLockType === "password" ? "password" : "4-digit PIN"} to confirm changes
              </p>

              {/* Badges */}
              <div className="flex items-center justify-center gap-2 mt-2.5">
                <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 bg-amber-500 text-slate-950">
                  Step 0: Verification
                </Badge>
                <span className="text-muted-foreground/40 text-xs">→</span>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5">
                  Set New Lock
                </Badge>
              </div>

              {activeCurrentLockType === "pin" ? (
                /* Step 0: Current PIN 4 Squircle Slots */
                <div
                  className={cn(
                    "flex items-center justify-center gap-3.5 sm:gap-4 mt-6 sm:mt-7 transition-transform duration-200",
                    shake && "animate-shake"
                  )}
                >
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = currentEnteredPin.length > index;
                    const isCurrent = currentEnteredPin.length === index;

                    return (
                      <div
                        key={index}
                        className={cn(
                          "w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] flex items-center justify-center transition-all duration-200 relative bg-transparent",
                          isCurrent
                            ? "border-2 border-amber-500 shadow-xs"
                            : isFilled
                            ? "border-2 border-foreground/70 dark:border-white/80"
                            : "border border-border/80 dark:border-zinc-800",
                          errorMessage && "border-destructive dark:border-red-500 bg-destructive/10"
                        )}
                      >
                        {isFilled && (
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-foreground dark:bg-white animate-in zoom-in-75 duration-150 shadow-xs" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Step 0: Current Password Form */
                <form onSubmit={handleVerifyCurrentPassword} className="w-full max-w-[320px] flex flex-col gap-3 mt-5">
                  <div className={cn("relative transition-transform duration-200", shake && "animate-shake")}>
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentEnteredPassword}
                      onChange={(e) => {
                        setCurrentEnteredPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="Enter current password"
                      autoFocus
                      disabled={isVerifyingCurrent}
                      className={cn(
                        "h-11 text-sm pr-10 rounded-xl bg-card border-border/80",
                        errorMessage && "border-destructive dark:border-red-500 bg-destructive/10"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isVerifyingCurrent || !currentEnteredPassword.trim()}
                    className="h-10 rounded-xl font-semibold gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Verify & Continue</span>
                  </Button>
                </form>
              )}

              {/* Error Message */}
              <div className="min-h-[22px] flex items-center justify-center mt-2">
                {errorMessage && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-destructive dark:text-red-400 font-medium animate-in fade-in">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                {isVerifyingCurrent && !errorMessage && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground animate-pulse">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Verifying current credentials...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Step 1 & 2: Configure New Secret */
            <>
              {/* Lock Type Segmented Pill Toggle */}
              <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    numpadFeedback.playKeypress();
                    setTargetLockType("pin");
                    setStep(1);
                    setFirstPin("");
                    setConfirmPin("");
                    setErrorMessage("");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    targetLockType === "pin"
                      ? "bg-card text-foreground shadow-xs border border-border/40"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  <span>4-Digit PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    numpadFeedback.playKeypress();
                    setTargetLockType("password");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setErrorMessage("");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    targetLockType === "password"
                      ? "bg-card text-foreground shadow-xs border border-border/40"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Custom Password</span>
                </button>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground text-center">
                Hi, {displayName}
              </h1>

              {targetLockType === "pin" ? (
                /* PIN Mode Setup */
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium text-center mt-1">
                    {step === 1
                      ? isUpdating
                        ? "Enter your new 4-digit PIN"
                        : "Enter your Eduspace PIN"
                      : "Confirm your 4-digit Eduspace PIN"}
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge
                      variant={step === 1 ? "default" : "outline"}
                      className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5"
                    >
                      Step 1: Set PIN
                    </Badge>
                    <span className="text-muted-foreground/40 text-xs">→</span>
                    <Badge
                      variant={step === 2 ? "default" : "outline"}
                      className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5"
                    >
                      Step 2: Confirm
                    </Badge>
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-center gap-3.5 sm:gap-4 mt-6 sm:mt-7 transition-transform duration-200",
                      shake && "animate-shake"
                    )}
                  >
                    {[0, 1, 2, 3].map((index) => {
                      const isFilled = activeNewPin.length > index;
                      const isCurrent = activeNewPin.length === index;

                      return (
                        <div
                          key={index}
                          className={cn(
                            "w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] flex items-center justify-center transition-all duration-200 relative bg-transparent",
                            isCurrent
                              ? "border-2 border-foreground dark:border-white shadow-xs"
                              : isFilled
                              ? "border-2 border-foreground/70 dark:border-white/80"
                              : "border border-border/80 dark:border-zinc-800",
                            errorMessage && "border-destructive dark:border-red-500 bg-destructive/10"
                          )}
                        >
                          {isFilled && (
                            showPin ? (
                              <span className="text-xl sm:text-2xl font-bold text-foreground animate-in zoom-in-75 duration-150">
                                {activeNewPin[index]}
                              </span>
                            ) : (
                              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-foreground dark:bg-white animate-in zoom-in-75 duration-150 shadow-xs" />
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        numpadFeedback.playKeypress();
                        setShowPin(!showPin);
                      }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2.5 rounded-lg hover:bg-muted/40 cursor-pointer select-none"
                    >
                      {showPin ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium text-primary">Hide digits</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Peek PIN</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="min-h-[22px] flex items-center justify-center mt-1">
                    {errorMessage && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-destructive dark:text-red-400 font-medium animate-in fade-in">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                    {isSubmitting && !errorMessage && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground animate-pulse">
                        <span>Saving PIN...</span>
                      </div>
                    )}
                  </div>

                  {step === 2 && (
                    <div className="mt-0.5">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          numpadFeedback.playKeypress();
                          setStep(1);
                          setConfirmPin("");
                          setErrorMessage("");
                        }}
                        className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer py-0.5 px-2.5 transition-colors"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Re-enter Step 1 PIN</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Password Mode Setup */
                (() => {
                  const passValidation = validateLockPassword(newPassword);
                  const isMatch = Boolean(newPassword && confirmNewPassword && newPassword === confirmNewPassword);

                  return (
                    <div className="w-full max-w-[390px] mx-auto flex flex-col items-center">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium text-center mb-4">
                        {isUpdating ? "Enter your new custom lock password" : "Create a high-security lock password"}
                      </p>

                      <form onSubmit={handleFinalPasswordSubmit} className="w-full bg-card/60 backdrop-blur-sm border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 text-left">
                        {/* 1. New Password Field */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-foreground/90 flex items-center justify-between">
                            <span>New Lock Password</span>
                            <span className="text-[10px] text-muted-foreground font-normal font-mono">
                              {newPassword.length}/64
                            </span>
                          </Label>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Min 8 chars (Uppercase, Number, Symbol)"
                              className="pr-10 text-sm h-11 rounded-xl bg-background/90 border-border text-foreground transition-all focus-visible:ring-2 focus-visible:ring-primary shadow-2xs"
                              autoFocus
                              disabled={isSubmitting}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                              tabIndex={-1}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>

                          {/* 4-Segment Strength Bar */}
                          {newPassword.length > 0 && (
                            <div className="space-y-1 pt-1 animate-in fade-in duration-150">
                              <div className="grid grid-cols-4 gap-1.5">
                                {[1, 2, 3, 4].map((bar) => (
                                  <div
                                    key={bar}
                                    className={cn(
                                      "h-1.5 rounded-full transition-all duration-300",
                                      passValidation.score >= bar
                                        ? passValidation.score === 4
                                          ? "bg-emerald-500 shadow-xs shadow-emerald-500/30"
                                          : passValidation.score === 3
                                          ? "bg-blue-500"
                                          : passValidation.score === 2
                                          ? "bg-amber-500"
                                          : "bg-red-500"
                                        : "bg-muted"
                                    )}
                                  />
                                ))}
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                <span>Password Strength:</span>
                                <span
                                  className={cn(
                                    "font-bold uppercase tracking-wider",
                                    passValidation.score === 4
                                      ? "text-emerald-500"
                                      : passValidation.score === 3
                                      ? "text-blue-500"
                                      : passValidation.score === 2
                                      ? "text-amber-500"
                                      : "text-red-500"
                                  )}
                                >
                                  {passValidation.score === 4
                                    ? "Strong (Pass)"
                                    : passValidation.score === 3
                                    ? "Good"
                                    : passValidation.score === 2
                                    ? "Fair"
                                    : "Weak"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. Live Security Requirements Checklist */}
                        <div className="p-3 rounded-xl border border-border/70 bg-muted/30 space-y-2 text-left">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            <span>Security Requirements</span>
                            <span className={cn("text-[9px] font-bold uppercase", passValidation.isValid ? "text-emerald-500" : "text-muted-foreground")}>
                              {passValidation.isValid ? "✓ All 4 Met" : "Required"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                            <div className={cn("flex items-center gap-1.5 transition-colors", passValidation.hasMinLength ? "text-emerald-500 font-semibold" : "text-muted-foreground")}>
                              <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0 transition-transform", passValidation.hasMinLength ? "text-emerald-500 scale-110" : "opacity-30")} />
                              <span>8+ characters</span>
                            </div>
                            <div className={cn("flex items-center gap-1.5 transition-colors", passValidation.hasUpper ? "text-emerald-500 font-semibold" : "text-muted-foreground")}>
                              <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0 transition-transform", passValidation.hasUpper ? "text-emerald-500 scale-110" : "opacity-30")} />
                              <span>1 Uppercase (A-Z)</span>
                            </div>
                            <div className={cn("flex items-center gap-1.5 transition-colors", passValidation.hasNumber ? "text-emerald-500 font-semibold" : "text-muted-foreground")}>
                              <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0 transition-transform", passValidation.hasNumber ? "text-emerald-500 scale-110" : "opacity-30")} />
                              <span>1 Number (0-9)</span>
                            </div>
                            <div className={cn("flex items-center gap-1.5 transition-colors", passValidation.hasSpecial ? "text-emerald-500 font-semibold" : "text-muted-foreground")}>
                              <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0 transition-transform", passValidation.hasSpecial ? "text-emerald-500 scale-110" : "opacity-30")} />
                              <span>1 Symbol (!@#$...)</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Confirm Password Field */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-foreground/90 flex items-center justify-between">
                            <span>Confirm Lock Password</span>
                            {confirmNewPassword.length > 0 && (
                              <span className={cn("text-[10px] font-bold uppercase", isMatch ? "text-emerald-500" : "text-destructive")}>
                                {isMatch ? "✓ Passwords Match" : "✕ Does Not Match"}
                              </span>
                            )}
                          </Label>
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className={cn(
                              "text-sm h-11 rounded-xl bg-background/90 border-border text-foreground transition-all shadow-2xs",
                              confirmNewPassword.length > 0 && (isMatch ? "border-emerald-500/80 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive")
                            )}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Encrypted locally with PBKDF2 (100,000 iterations).</span>
                        </div>

                        {errorMessage && (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-destructive dark:text-red-400 font-medium animate-in fade-in py-0.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{errorMessage}</span>
                          </div>
                        )}

                        <Button
                          type="submit"
                          disabled={isSubmitting || !passValidation.isValid || !isMatch}
                          className="w-full h-11 rounded-xl font-bold text-xs sm:text-sm tracking-wide gap-2 mt-2 cursor-pointer shadow-sm"
                        >
                          <Lock className="w-4 h-4" />
                          <span>{isSubmitting ? "Saving Password..." : isUpdating ? "Update Lock Password" : "Save & Enable Password"}</span>
                        </Button>
                      </form>
                    </div>
                  );
                })()
              )}
            </>
          )}
        </div>

        {/* Bottom Section: Numpad if (step === 0 && current is PIN) or (step > 0 && target is PIN) */}
        {((step === 0 && activeCurrentLockType === "pin") || (step > 0 && targetLockType === "pin")) ? (
          <div className="w-full max-w-[270px] sm:max-w-[290px] mx-auto shrink-0 pb-3 sm:pb-4">
            <div className="grid grid-cols-3 gap-y-7 sm:gap-y-8 gap-x-6 sm:gap-x-8 justify-items-center w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const isPressed = pressedKey === num;
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isSubmitting || isVerifyingCurrent}
                    onClick={() => handleNumberClick(num)}
                    className={cn(
                      "w-16 h-10 flex items-center justify-center transition-all duration-100",
                      "text-foreground text-2xl sm:text-[28px] font-bold tracking-tight",
                      "cursor-pointer select-none active:opacity-40 active:scale-90",
                      "disabled:opacity-30 disabled:pointer-events-none",
                      isPressed && "opacity-40 scale-90"
                    )}
                  >
                    <span>{num}</span>
                  </button>
                );
              })}

              {/* Clear */}
              <button
                type="button"
                disabled={isSubmitting || isVerifyingCurrent || (step === 0 ? currentEnteredPin.length === 0 : activeNewPin.length === 0)}
                onClick={handleClear}
                className={cn(
                  "w-16 h-10 flex items-center justify-center transition-all duration-100",
                  "text-foreground text-sm sm:text-base font-bold",
                  "cursor-pointer select-none active:opacity-40 active:scale-90",
                  "disabled:opacity-20 disabled:pointer-events-none",
                  pressedKey === "clear" && "opacity-40 scale-90"
                )}
                title="Clear"
              >
                <span>Clear</span>
              </button>

              {/* 0 */}
              <button
                type="button"
                disabled={isSubmitting || isVerifyingCurrent}
                onClick={() => handleNumberClick(0)}
                className={cn(
                  "w-16 h-10 flex items-center justify-center transition-all duration-100",
                  "text-foreground text-2xl sm:text-[28px] font-bold tracking-tight",
                  "cursor-pointer select-none active:opacity-40 active:scale-90",
                  "disabled:opacity-30 disabled:pointer-events-none",
                  pressedKey === 0 && "opacity-40 scale-90"
                )}
              >
                <span>0</span>
              </button>

              {/* Backspace */}
              <button
                type="button"
                disabled={isSubmitting || isVerifyingCurrent || (step === 0 ? currentEnteredPin.length === 0 : activeNewPin.length === 0)}
                onClick={handleBackspace}
                className={cn(
                  "w-16 h-10 flex items-center justify-center transition-all duration-100",
                  "text-foreground",
                  "cursor-pointer select-none active:opacity-40 active:scale-90",
                  "disabled:opacity-20 disabled:pointer-events-none",
                  pressedKey === "backspace" && "opacity-40 scale-90"
                )}
                title="Backspace"
              >
                <Delete className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
              </button>
            </div>

            <div className="flex justify-center pt-5 sm:pt-6">
              <button
                type="button"
                onClick={() => {
                  numpadFeedback.playKeypress();
                  onOpenChange(false);
                }}
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground transition-all cursor-pointer py-1"
              >
                Cancel setup
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-4 pb-2">
            <button
              type="button"
              onClick={() => {
                numpadFeedback.playKeypress();
                onOpenChange(false);
              }}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground transition-all cursor-pointer py-1"
            >
              Cancel setup
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
