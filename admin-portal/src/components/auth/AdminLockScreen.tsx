import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAdminPinLock } from "@/hooks/useAdminPinLock";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { UserAvatar } from "@/components/users/UserAvatar";
import { Delete, RefreshCw, LogOut, AlertCircle, ShieldAlert, Fingerprint, Sun, Moon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";

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

// Formats countdown seconds into clean mm:ss or hh:mm:ss
const formatCountdown = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

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
  const { setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const [pin, setPin] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSuccessUnlocked, setIsSuccessUnlocked] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const [pressedKey, setPressedKey] = useState<number | string | null>(null);
  const [keypadLayout, setKeypadLayout] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

  // Synchronous verification lock to prevent double-submitting and burning 2 attempts at once
  const isVerifyingRef = useRef<boolean>(false);
  const autoBiometricPromptedRef = useRef<boolean>(false);

  // Clear PIN, errors and generate randomized keypad on lock state change
  useEffect(() => {
    if (isLocked) {
      setPin("");
      setErrorMessage("");
      setShake(false);
      setIsVerifying(false);
      setIsSuccessUnlocked(false);
      isVerifyingRef.current = false;
      setPressedKey(null);

      // Randomize digits if anti-shoulder surfing is enabled
      if (settings.randomizeKeypad) {
        const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = digits.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [digits[i], digits[j]] = [digits[j], digits[i]];
        }
        setKeypadLayout(digits);
      } else {
        setKeypadLayout([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
      }
    } else {
      autoBiometricPromptedRef.current = false;
    }
  }, [isLocked, settings.randomizeKeypad]);

  // Handle Biometric Unlock
  const handleBiometricUnlock = useCallback(async () => {
    if (isVerifyingRef.current || isVerifying || isBiometricScanning || cooldown.isCooldown) return;

    triggerHaptic(15);
    setIsBiometricScanning(true);
    setErrorMessage("");

    try {
      const res = await unlockWithBiometrics();
      if (res.success) {
        setIsSuccessUnlocked(true);
        triggerHaptic([20, 30, 20]);
      } else {
        if (!res.error?.includes("cancelled")) {
          triggerHaptic([40, 60, 40]);
          setErrorMessage(res.error || "Biometric unlock failed.");
        }
      }
    } catch (err: any) {
      if (!err.message?.includes("cancelled")) {
        triggerHaptic([40, 60, 40]);
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
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLocked, isBiometricsSupported, settings.biometricsEnabled, cooldown.isCooldown, handleBiometricUnlock]);

  // Handle PIN verification (protected by isVerifyingRef)
  const handleVerify = useCallback(
    async (pinToVerify: string) => {
      if (pinToVerify.length !== 4 || isVerifyingRef.current || cooldown.isCooldown) return;

      isVerifyingRef.current = true;
      setIsVerifying(true);
      setErrorMessage("");

      try {
        const res = await unlockWithPin(pinToVerify);
        if (!res.success) {
          triggerHaptic([40, 60, 40]);
          setErrorMessage(res.error || "Incorrect PIN. Please try again.");
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setPin("");
        } else {
          setIsSuccessUnlocked(true);
          triggerHaptic([20, 30, 20]);
        }
      } catch (err: any) {
        triggerHaptic([40, 60, 40]);
        setErrorMessage(err.message || "Failed to unlock.");
        setPin("");
      } finally {
        setIsVerifying(false);
        isVerifyingRef.current = false;
      }
    },
    [cooldown.isCooldown, unlockWithPin]
  );

  // Keypad click handlers
  const handleNumberClick = (num: number) => {
    if (pin.length >= 4 || isVerifyingRef.current || isVerifying || cooldown.isCooldown) return;

    triggerHaptic(12);
    setPressedKey(num);
    setTimeout(() => setPressedKey(null), 180);

    const nextPin = pin + num.toString();
    setPin(nextPin);

    if (nextPin.length === 4) {
      handleVerify(nextPin);
    }
  };

  const handleBackspace = () => {
    if (isVerifyingRef.current || isVerifying || cooldown.isCooldown) return;
    triggerHaptic(10);
    setErrorMessage("");
    setPressedKey("backspace");
    setTimeout(() => setPressedKey(null), 180);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isVerifyingRef.current || isVerifying || cooldown.isCooldown || pin.length === 0) return;
    triggerHaptic(15);
    setErrorMessage("");
    setPressedKey("clear");
    setTimeout(() => setPressedKey(null), 180);
    setPin("");
  };

  // Physical keyboard listener (0-9, Backspace, Escape)
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (cooldown.isCooldown || isVerifyingRef.current || isVerifying) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        const num = parseInt(e.key, 10);
        handleNumberClick(num);
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
  }, [isLocked, cooldown.isCooldown, isVerifying, pin, handleVerify]);

  const handleSignOut = async () => {
    try {
      triggerHaptic(15);
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      window.location.href = "/login";
    }
  };

  if (!isLocked) return null;

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Mannam Ganesh Babu");

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const currentAttemptDisplay = Math.min(3, (cooldown.attemptInChance || 0) + 1);

  const content = (
    <div className="fixed inset-0 top-0 left-0 w-screen h-[100dvh] max-h-[100dvh] z-[999999] bg-background/80 dark:bg-[#08090C]/85 backdrop-blur-2xl text-foreground select-none flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Mobile Screen Wrapper */}
      <div className="w-full max-w-sm mx-auto h-full flex flex-col justify-between px-6 py-6 sm:py-8">
        {/* Top Header: Application Logo & User Profile Image with Theme Switcher */}
        <div className="w-full flex items-center justify-between shrink-0">
          {/* App Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border/80 shadow-xs bg-card p-0.5">
              <img
                src="/favicon.png"
                alt="Eduspace Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Eduspace
            </span>
          </div>

          {/* Theme Toggle & User Profile Avatar */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
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

        {/* Center Section: Greeting, Subtitle, 4 Squircle Slots & Progress Text */}
        <div className="w-full flex flex-col items-center pt-2 sm:pt-4">
          {/* Personalized Greeting */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground text-center">
            Hi, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium text-center mt-1">
            Enter your Eduspace PIN
          </p>

          {/* 4 Rounded Squircle Outline Boxes */}
          <div
            className={cn(
              "flex items-center justify-center gap-3.5 sm:gap-4 mt-6 sm:mt-8 transition-transform duration-200",
              shake && "animate-shake"
            )}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              const isCurrent = pin.length === index;

              return (
                <div
                  key={index}
                  className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] flex items-center justify-center transition-all duration-300 relative",
                    "bg-transparent",
                    isSuccessUnlocked
                      ? "border-2 border-emerald-500 bg-emerald-500/15 shadow-[0_0_24px_rgba(16,185,129,0.35)] scale-105"
                      : isCurrent
                        ? "border-2 border-foreground dark:border-white shadow-xs"
                        : isFilled
                          ? "border-2 border-foreground/70 dark:border-white/80"
                          : "border border-border/80 dark:border-zinc-800",
                    (errorMessage || cooldown.isCooldown) && "border-destructive dark:border-red-500 bg-destructive/10"
                  )}
                >
                  {/* Filled indicator dot inside box or Checkmark on success */}
                  {isSuccessUnlocked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in-50 duration-200" />
                  ) : isFilled ? (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-foreground dark:bg-white animate-in zoom-in-75 duration-150 shadow-xs" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Below Number Inputs Area: Small Underlined Chance & Attempt Progress / Cooldown Banner */}
          <div className="min-h-[46px] flex flex-col items-center justify-center mt-3 sm:mt-4 px-3 text-center w-full">
            {isSuccessUnlocked ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Verified! Welcome back.</span>
              </div>
            ) : !cooldown.isCooldown ? (
              <div className="flex flex-col items-center justify-center gap-1.5">
                {/* Smallest Underlined Progress Text */}
                <span className="text-[10px] text-muted-foreground/80 font-medium underline underline-offset-3 decoration-muted-foreground/30 tracking-wide select-none">
                  Chance {cooldown.currentChance} of 3 · Attempt {currentAttemptDisplay} of 3
                </span>

                {/* Error Message if any */}
                {errorMessage && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-destructive dark:text-red-400 font-medium animate-in fade-in text-center max-w-xs">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive dark:text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {isVerifying && !errorMessage && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground animate-pulse">
                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    <span>Verifying PIN...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 animate-in fade-in w-full">
                {/* Dedicated Countdown Display */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-500 dark:text-amber-300 text-xs font-semibold whitespace-nowrap shadow-2xs">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500 animate-pulse" />
                  <span>
                    Try again in{" "}
                    <strong className="tabular-nums font-bold text-foreground dark:text-white underline decoration-amber-500/50">
                      {formatCountdown(cooldown.remainingSeconds)}
                    </strong>
                  </span>
                </div>

                {/* Subtext description according to Chance tier */}
                {cooldown.lockDurationType === "24h" ? (
                  <p className="text-[11px] text-destructive dark:text-red-400 font-medium">
                    All 3 chances have been used. Please try again after 24 hours.
                  </p>
                ) : cooldown.lockDurationType === "5m" ? (
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Too Many Attempts · Keypad locked for 5 minutes.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Chance 1 exhausted · Keypad locked for 1 minute.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Area: Use Fingerprint + Clean Frameless Keypad */}
        <div className="w-full max-w-[270px] sm:max-w-[290px] mx-auto shrink-0 pb-3 sm:pb-4">
          {/* "Use fingerprint" Dedicated Action (Reference Style) */}
          {isBiometricsSupported && settings.biometricsEnabled && (
            <div className="mb-5 sm:mb-7 flex justify-center w-full">
              <button
                type="button"
                disabled={isVerifyingRef.current || isVerifying || isBiometricScanning || cooldown.isCooldown}
                onClick={handleBiometricUnlock}
                className={cn(
                  "text-emerald-500 dark:text-emerald-400 font-medium text-sm flex items-center justify-center gap-2",
                  "transition-all active:opacity-60 cursor-pointer disabled:opacity-50"
                )}
              >
                <Fingerprint className={cn("w-4 h-4 text-emerald-500 dark:text-emerald-400", isBiometricScanning && "animate-pulse")} />
                <span>{isBiometricScanning ? "Scanning Fingerprint..." : "Use fingerprint"}</span>
              </button>
            </div>
          )}

          {/* Clean Frameless Keypad with Reference Spacing */}
          <div className="grid grid-cols-3 gap-y-7 sm:gap-y-8 gap-x-6 sm:gap-x-8 justify-items-center w-full">
            {/* Grid Digits: First 9 numbers from keypadLayout */}
            {keypadLayout.slice(0, 9).map((num) => {
              const isPressed = pressedKey === num;
              return (
                <button
                  key={num}
                  type="button"
                  disabled={isVerifyingRef.current || isVerifying || cooldown.isCooldown}
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
              disabled={isVerifyingRef.current || isVerifying || cooldown.isCooldown || pin.length === 0}
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

            {/* Row 4: Center Slot (10th digit, default 0 or shuffled) */}
            {(() => {
              const centerDigit = keypadLayout[9] ?? 0;
              return (
                <button
                  key={centerDigit}
                  type="button"
                  disabled={isVerifyingRef.current || isVerifying || cooldown.isCooldown}
                  onClick={() => handleNumberClick(centerDigit)}
                  className={cn(
                    "w-16 h-10 flex items-center justify-center transition-all duration-100",
                    "text-foreground text-2xl sm:text-[28px] font-bold tracking-tight",
                    "cursor-pointer select-none active:opacity-40 active:scale-90",
                    "disabled:opacity-30 disabled:pointer-events-none",
                    pressedKey === centerDigit && "opacity-40 scale-90"
                  )}
                >
                  <span>{centerDigit}</span>
                </button>
              );
            })()}

            {/* Row 4: Right Slot (Backspace Key) */}
            <button
              type="button"
              disabled={isVerifyingRef.current || isVerifying || cooldown.isCooldown || pin.length === 0}
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

          {/* Forgot PIN / Sign Out option */}
          <div className="flex justify-center pt-5 sm:pt-6">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground transition-all cursor-pointer py-1 flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" />
              <span>Forgot PIN? Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
