import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { Delete, AlertCircle, ArrowLeft, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PinSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPinConfigured: (pin: string) => Promise<{ success: boolean; error?: string }>;
  isUpdating?: boolean;
}

// Mobile Haptic Vibration Helper
const triggerHaptic = (pattern: number | number[] = 12) => {
  if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors if unsupported
    }
  }
};

// Detects weak/predictable 4-digit PIN combinations
function checkWeakPin(pin: string): { isWeak: boolean; message?: string } {
  if (pin.length < 4) return { isWeak: false };

  // Repeating digits: e.g. 0000, 1111, 2222, ...
  if (/^(\d)\1{3}$/.test(pin)) {
    return { isWeak: true, message: "Avoid repeating digits (e.g. 0000, 1111)." };
  }

  // Sequential digits
  const sequential = [
    "0123", "1234", "2345", "3456", "4567", "5678", "6789",
    "9876", "8765", "7654", "6543", "5432", "4321", "3210",
  ];
  if (sequential.includes(pin)) {
    return { isWeak: true, message: "Avoid sequential numbers (e.g. 1234, 4321)." };
  }

  // Common patterns
  const common = ["1212", "1313", "6969", "2580", "0852", "2024", "2025", "2026"];
  if (common.includes(pin)) {
    return { isWeak: true, message: "Easily guessable PIN. Please choose a stronger PIN." };
  }

  return { isWeak: false };
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  open,
  onOpenChange,
  onPinConfigured,
  isUpdating = false,
}) => {
  const { user, profile, role } = useAuth();
  const { actualTheme, setTheme } = useTheme();

  const [step, setStep] = useState<1 | 2>(1);
  const [firstPin, setFirstPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [shake, setShake] = useState<boolean>(false);
  const [pressedKey, setPressedKey] = useState<number | string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setFirstPin("");
      setConfirmPin("");
      setShowPin(false);
      setErrorMessage("");
      setShake(false);
      setIsSubmitting(false);
      setPressedKey(null);
    }
  }, [open]);

  const activePin = step === 1 ? firstPin : confirmPin;

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "EduSpace User");

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials =
    displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  const handleNumberClick = (num: number) => {
    if (isSubmitting || activePin.length >= 4) return;
    triggerHaptic(12);
    setErrorMessage("");
    setPressedKey(num);
    setTimeout(() => setPressedKey(null), 180);

    if (step === 1) {
      const next = firstPin + num.toString();
      setFirstPin(next);
      if (next.length === 4) {
        const weakCheck = checkWeakPin(next);
        if (weakCheck.isWeak) {
          triggerHaptic([40, 60, 40]);
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
      const next = confirmPin + num.toString();
      setConfirmPin(next);
      if (next.length === 4) {
        handleSubmit(firstPin, next);
      }
    }
  };

  const handleBackspace = () => {
    if (isSubmitting) return;
    triggerHaptic(10);
    setErrorMessage("");
    setPressedKey("backspace");
    setTimeout(() => setPressedKey(null), 180);
    if (step === 1) {
      setFirstPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (isSubmitting) return;
    triggerHaptic(15);
    setErrorMessage("");
    setPressedKey("clear");
    setTimeout(() => setPressedKey(null), 180);
    if (step === 1) {
      setFirstPin("");
    } else {
      setConfirmPin("");
    }
  };

  const handleSubmit = async (p1: string, p2: string) => {
    if (p1 !== p2) {
      triggerHaptic([40, 60, 40]);
      setErrorMessage("PINs do not match. Please try again.");
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setConfirmPin("");
      }, 500);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await onPinConfigured(p1);
      if (res.success) {
        triggerHaptic([20, 30, 20]);
        toast.success(isUpdating ? "4-Digit PIN updated successfully!" : "4-Digit PIN Lock activated!");
        onOpenChange(false);
      } else {
        triggerHaptic([40, 60, 40]);
        setErrorMessage(res.error || "Failed to set up PIN.");
        setConfirmPin("");
      }
    } catch (err: any) {
      triggerHaptic([40, 60, 40]);
      setErrorMessage(err.message || "An error occurred.");
      setConfirmPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Physical keyboard listener
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;

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
  });

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 top-0 left-0 w-screen h-[100dvh] max-h-[100dvh] z-[999999] bg-background dark:bg-[#08090C] text-foreground select-none flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Mobile Frame */}
      <div className="w-full max-w-sm mx-auto h-full flex flex-col justify-between px-6 py-6 sm:py-8">
        {/* Top Header: Application Logo & User Profile Image with Theme Switcher */}
        <div className="w-full flex items-center justify-between shrink-0">
          {/* App Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border/80 shadow-xs bg-card p-0.5">
              <img
                src="/favicon.png"
                alt="EduSpace Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground leading-none">
                EduSpace
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
                {role === "lecturer" ? "Lecturer" : "Student"}
              </span>
            </div>
          </div>

          {/* Theme Toggle & User Profile Avatar */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setTheme(actualTheme === "dark" ? "light" : "dark");
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-border/80 bg-card/80 hover:bg-accent text-foreground transition-all active:scale-90 cursor-pointer shadow-2xs"
              title={actualTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {actualTheme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            <div className="relative">
              <Avatar className="h-9 w-9 border border-border shadow-xs">
                <AvatarImage src={avatarUrl || ""} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Center-Top Section: Greeting, Subtitle, Step Badges & 4 Squircle Slots */}
        <div className="w-full flex flex-col items-center pt-2 sm:pt-4">
          {/* Personalized Greeting */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground text-center">
            Hi, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium text-center mt-1">
            {step === 1
              ? isUpdating
                ? "Enter your new 4-digit PIN"
                : "Enter your Eduspace PIN"
              : "Confirm your 4-digit Eduspace PIN"}
          </p>

          {/* Step Indicator Badges */}
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

          {/* 4 Rounded Squircle Outline Boxes */}
          <div
            className={cn(
              "flex items-center justify-center gap-3.5 sm:gap-4 mt-6 sm:mt-7 transition-transform duration-200",
              shake && "animate-shake"
            )}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = activePin.length > index;
              const isCurrent = activePin.length === index;

              return (
                <div
                  key={index}
                  className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] flex items-center justify-center transition-all duration-200 relative",
                    "bg-transparent",
                    isCurrent
                      ? "border-2 border-foreground dark:border-white shadow-xs"
                      : isFilled
                      ? "border-2 border-foreground/70 dark:border-white/80"
                      : "border border-border/80 dark:border-zinc-800",
                    errorMessage && "border-destructive dark:border-red-500 bg-destructive/10"
                  )}
                >
                  {/* Filled indicator: Digit if Peek enabled, otherwise solid dot */}
                  {isFilled && (
                    showPin ? (
                      <span className="text-xl sm:text-2xl font-bold text-foreground animate-in zoom-in-75 duration-150">
                        {activePin[index]}
                      </span>
                    ) : (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-foreground dark:bg-white animate-in zoom-in-75 duration-150 shadow-xs" />
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* PIN Peek / Reveal Toggle Button */}
          <div className="flex items-center justify-center mt-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setShowPin(!showPin);
              }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2.5 rounded-lg hover:bg-muted/40 cursor-pointer select-none"
              title={showPin ? "Hide PIN digits" : "Show PIN digits"}
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

          {/* Error Feedback */}
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

          {/* If on Step 2: Option to re-enter PIN */}
          {step === 2 && (
            <div className="mt-0.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  triggerHaptic(10);
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
        </div>

        {/* Clean Frameless Keypad with Reference Spacing */}
        <div className="w-full max-w-[270px] sm:max-w-[290px] mx-auto shrink-0 pb-3 sm:pb-4">
          <div className="grid grid-cols-3 gap-y-7 sm:gap-y-8 gap-x-6 sm:gap-x-8 justify-items-center w-full">
            {/* Numbers 1 to 9 */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const isPressed = pressedKey === num;
              return (
                <button
                  key={num}
                  type="button"
                  disabled={isSubmitting}
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

            {/* Row 4: Left Slot (Clear Option) */}
            <button
              type="button"
              disabled={isSubmitting || activePin.length === 0}
              onClick={handleClear}
              className={cn(
                "w-16 h-10 flex items-center justify-center transition-all duration-100",
                "text-foreground text-sm sm:text-base font-bold",
                "cursor-pointer select-none active:opacity-40 active:scale-90",
                "disabled:opacity-20 disabled:pointer-events-none",
                pressedKey === "clear" && "opacity-40 scale-90"
              )}
              title="Clear entered PIN (Esc)"
            >
              <span>Clear</span>
            </button>

            {/* Row 4: Center Slot (Number 0) */}
            <button
              type="button"
              disabled={isSubmitting}
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

            {/* Row 4: Right Slot (Backspace Key) */}
            <button
              type="button"
              disabled={isSubmitting || activePin.length === 0}
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

          {/* Simple Underlined Cancel Setup Text */}
          <div className="flex justify-center pt-5 sm:pt-6">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onOpenChange(false);
              }}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground transition-all cursor-pointer py-1"
            >
              Cancel setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
