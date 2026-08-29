import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePinLock } from "@/hooks/usePinLock";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Delete,
  RefreshCw,
  LogOut,
  AlertCircle,
  ShieldAlert,
  Fingerprint,
  Sun,
  Moon,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { PinSetupModal } from "./PinSetupModal";
import { Turnstile } from "@marsidev/react-turnstile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

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

export const UserLockScreen: React.FC = () => {
  const {
    isLocked,
    unlockWithPin,
    unlockWithBiometrics,
    unlockWithPassword,
    setupPin,
    isBiometricsSupported,
    settings,
    cooldown,
  } = usePinLock();
  const { user, profile, role, signOut } = useAuth();
  const { actualTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [pin, setPin] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSuccessUnlocked, setIsSuccessUnlocked] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const [pressedKey, setPressedKey] = useState<number | string | null>(null);
  const [keypadLayout, setKeypadLayout] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  const [tamperTrigger, setTamperTrigger] = useState<number>(0);

  // Forgot PIN / Password verification states
  const [forgotModalOpen, setForgotModalOpen] = useState<boolean>(false);
  const [accountPassword, setAccountPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [passwordShake, setPasswordShake] = useState<boolean>(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const [setupModalOpen, setSetupModalOpen] = useState<boolean>(false);
  const [resolvedEmail, setResolvedEmail] = useState<string>(user?.email || "");

  useEffect(() => {
    if (user?.email) {
      setResolvedEmail(user.email);
    }
  }, [user?.email]);

  // Synchronous verification lock to prevent double-submitting and burning 2 attempts at once
  const isVerifyingRef = useRef<boolean>(false);
  const autoBiometricPromptedRef = useRef<boolean>(false);

  // 🛡️ Anti-Tamper DevTools MutationObserver & DOM Watchdog Shield
  useEffect(() => {
    if (!isLocked) {
      document.body.classList.remove("eduspace-tamper-blackout");
      return;
    }

    const checkTampering = () => {
      if (!isLocked) return;

      const overlayEl = document.getElementById("eduspace-lock-screen-root");

      // 1. Element deleted/detached from body
      if (!overlayEl || !document.body.contains(overlayEl)) {
        document.body.classList.add("eduspace-tamper-blackout");
        setTamperTrigger((prev) => prev + 1);
        return;
      }

      // 2. Element hidden via inline CSS or style mutation
      const computed = window.getComputedStyle(overlayEl);
      const isTampered =
        computed.display === "none" ||
        computed.visibility === "hidden" ||
        parseFloat(computed.opacity || "1") < 0.5 ||
        computed.pointerEvents === "none";

      if (isTampered) {
        document.body.classList.add("eduspace-tamper-blackout");
        overlayEl.style.setProperty("display", "flex", "important");
        overlayEl.style.setProperty("visibility", "visible", "important");
        overlayEl.style.setProperty("opacity", "1", "important");
        overlayEl.style.setProperty("pointer-events", "auto", "important");
        setTamperTrigger((prev) => prev + 1);
      } else {
        document.body.classList.remove("eduspace-tamper-blackout");
      }
    };

    const observer = new MutationObserver(() => {
      checkTampering();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "hidden"],
    });

    // 400ms Heartbeat Watchdog
    const interval = setInterval(checkTampering, 400);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      document.body.classList.remove("eduspace-tamper-blackout");
    };
  }, [isLocked]);

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
      settings.biometricsEnabled &&
      isBiometricsSupported &&
      !cooldown.isCooldown &&
      !autoBiometricPromptedRef.current &&
      !isSuccessUnlocked
    ) {
      autoBiometricPromptedRef.current = true;
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLocked, settings.biometricsEnabled, isBiometricsSupported, cooldown.isCooldown, isSuccessUnlocked, handleBiometricUnlock]);

  // Handle Number click
  const handleNumberClick = async (num: number) => {
    if (isVerifyingRef.current || isVerifying || cooldown.isCooldown || isSuccessUnlocked || pin.length >= 4) {
      return;
    }

    triggerHaptic(12);
    setErrorMessage("");
    setPressedKey(num);
    setTimeout(() => setPressedKey(null), 180);

    const nextPin = pin + num.toString();
    setPin(nextPin);

    // If 4 digits entered, automatically verify
    if (nextPin.length === 4) {
      isVerifyingRef.current = true;
      setIsVerifying(true);

      try {
        const res = await unlockWithPin(nextPin);
        if (res.success) {
          setIsSuccessUnlocked(true);
          triggerHaptic([20, 30, 20]);
        } else {
          triggerHaptic([40, 60, 40]);
          setShake(true);
          setErrorMessage(res.error || "Incorrect PIN");
          setTimeout(() => {
            setShake(false);
            setPin("");
            isVerifyingRef.current = false;
            setIsVerifying(false);
          }, 500);
        }
      } catch (err: any) {
        triggerHaptic([40, 60, 40]);
        setShake(true);
        setErrorMessage(err.message || "Verification failed");
        setTimeout(() => {
          setShake(false);
          setPin("");
          isVerifyingRef.current = false;
          setIsVerifying(false);
        }, 500);
      }
    }
  };

  // Backspace key handler
  const handleBackspace = () => {
    if (isVerifyingRef.current || isVerifying || cooldown.isCooldown || isSuccessUnlocked) return;
    triggerHaptic(10);
    setErrorMessage("");
    setPressedKey("backspace");
    setTimeout(() => setPressedKey(null), 180);
    setPin((prev) => prev.slice(0, -1));
  };

  // Clear key handler
  const handleClear = () => {
    if (isVerifyingRef.current || isVerifying || cooldown.isCooldown || isSuccessUnlocked) return;
    triggerHaptic(15);
    setErrorMessage("");
    setPressedKey("clear");
    setTimeout(() => setPressedKey(null), 180);
    setPin("");
  };

  // Open Forgot PIN Drawer
  const handleOpenForgotPin = () => {
    triggerHaptic(10);
    setPasswordError("");
    setAccountPassword("");
    setPasswordShake(false);
    setCaptchaToken(undefined);
    setForgotModalOpen(true);
  };

  // Handle Account Password Verification for Forgot PIN
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountPassword || accountPassword.length === 0) {
      triggerHaptic([40, 60, 40]);
      setPasswordError("Please enter your account password.");
      setPasswordShake(true);
      setTimeout(() => setPasswordShake(false), 500);
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordError("");
    setPasswordShake(false);

    try {
      const res = await unlockWithPassword(accountPassword, captchaToken);
      if (res.success) {
        triggerHaptic([20, 30, 20]);
        toast.success("Account verified! Please create your new 4-digit PIN.");
        setForgotModalOpen(false);
        setAccountPassword("");
        setCaptchaToken(undefined);
        setSetupModalOpen(true);
      } else {
        triggerHaptic([40, 60, 40]);
        setPasswordShake(true);
        setPasswordError(res.error || "Incorrect account password. Please try again.");
        setTimeout(() => setPasswordShake(false), 500);
      }
    } catch (err: any) {
      triggerHaptic([40, 60, 40]);
      setPasswordShake(true);
      setPasswordError(err.message || "Failed to verify password.");
      setTimeout(() => setPasswordShake(false), 500);
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  // Safe Sign Out Handler
  const handleSignOut = async () => {
    triggerHaptic(20);
    try {
      await signOut();
      navigate("/login");
    } catch {
      window.location.href = "/login";
    }
  };

  // Physical Keyboard listener
  useEffect(() => {
    if (!isLocked || forgotModalOpen || setupModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVerifyingRef.current || isVerifying || cooldown.isCooldown || isSuccessUnlocked) return;

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

  if (!isLocked && !setupModalOpen) return null;

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "EduSpace User");

  const displayEmail = user?.email || "";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials =
    displayName
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "U";

  const content = (
    <div
      id="eduspace-lock-screen-root"
      key={`user-lock-root-${tamperTrigger}`}
      className="fixed inset-0 top-0 left-0 w-screen h-[100dvh] max-h-[100dvh] z-[999999] bg-background dark:bg-[#060709] text-foreground select-none flex flex-col justify-between overflow-hidden animate-in fade-in duration-200"
    >
      {/* Mobile Frame Container */}
      <div className="w-full max-w-sm mx-auto h-full flex flex-col justify-between px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:py-8">
        {/* Top Bar: Brand Logo & User Profile with Theme Toggle */}
        <div className="w-full flex items-center justify-between shrink-0">
          {/* App Logo & Role */}
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

          {/* Theme Toggle & Avatar */}
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

        {/* Center/Top Section: Greeting & 4 Squircle Slots */}
        <div className="w-full flex flex-col items-center pt-3 sm:pt-5">
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
              const isCurrent = pin.length === index && !cooldown.isCooldown;

              return (
                <div
                  key={index}
                  className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] sm:rounded-[22px] flex items-center justify-center transition-all duration-200 relative",
                    "bg-transparent",
                    isSuccessUnlocked
                      ? "border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-500/10"
                      : isCurrent
                      ? "border-2 border-foreground dark:border-white shadow-xs"
                      : isFilled
                      ? "border-2 border-foreground/70 dark:border-white/80"
                      : "border border-border/80 dark:border-zinc-800",
                    errorMessage && "border-destructive dark:border-red-500 bg-destructive/10"
                  )}
                >
                  {isSuccessUnlocked ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-in zoom-in-50 duration-200" />
                  ) : (
                    isFilled && (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-foreground dark:bg-white animate-in zoom-in-75 duration-150 shadow-xs" />
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Chance & Attempt Tracker */}
          {!cooldown.isCooldown && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground/80">
                Chance {cooldown.currentChance} of 3
              </span>
              <span>•</span>
              <span>
                Attempt {cooldown.attemptInChance + 1} of 3
              </span>
            </div>
          )}

          {/* Feedback & Error / Cooldown Area */}
          <div className="min-h-[28px] flex items-center justify-center mt-2 px-2 text-center">
            {cooldown.isCooldown ? (
              <div className="flex items-center justify-center gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full font-semibold animate-pulse">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>
                  Locked: Try again in {formatCountdown(cooldown.remainingSeconds)}
                </span>
              </div>
            ) : errorMessage ? (
              <div className="flex items-center justify-center gap-1.5 text-xs text-destructive dark:text-red-400 font-semibold animate-in fade-in">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : isVerifying ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground animate-pulse">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Verifying PIN...</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Flexible spacer to push keypad down to bottom thumb zone */}
        <div className="flex-1 min-h-[16px] max-h-[80px]" />

        {/* Lower Ergonomic Section: Biometric prompt + Mobile Keypad */}
        <div className="w-full max-w-[310px] sm:max-w-[330px] mx-auto shrink-0 flex flex-col items-center">
          {/* Biometric Button: Positioned directly above keypad in emerald green like Groww */}
          {settings.biometricsEnabled && isBiometricsSupported && !cooldown.isCooldown && !isSuccessUnlocked && (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={isBiometricScanning || isVerifying}
              className="mb-5 sm:mb-7 flex items-center gap-1.5 text-sm font-semibold text-emerald-500 hover:text-emerald-400 active:scale-95 transition-all cursor-pointer select-none"
            >
              <Fingerprint className={cn("w-4 h-4", isBiometricScanning && "animate-pulse")} />
              <span>Use fingerprint</span>
            </button>
          )}

          {/* Clean Frameless Keypad */}
          <div className="grid grid-cols-3 gap-y-7 sm:gap-y-8 gap-x-12 sm:gap-x-14 justify-items-center w-full">
            {keypadLayout.slice(0, 9).map((num) => {
              const isPressed = pressedKey === num;
              return (
                <button
                  key={num}
                  type="button"
                  disabled={isVerifyingRef.current || isVerifying || cooldown.isCooldown || isSuccessUnlocked}
                  onClick={() => handleNumberClick(num)}
                  className={cn(
                    "w-16 h-12 flex items-center justify-center transition-all duration-100",
                    "text-foreground text-[28px] sm:text-[30px] font-medium tracking-tight",
                    "cursor-pointer select-none active:opacity-30 active:scale-90",
                    "disabled:opacity-30 disabled:pointer-events-none",
                    isPressed && "opacity-30 scale-90"
                  )}
                >
                  <span>{num}</span>
                </button>
              );
            })}

            {/* Row 4: Left Slot (Dot bullet • or Clear) */}
            <button
              type="button"
              disabled={isVerifyingRef.current || isVerifying || cooldown.isCooldown || pin.length === 0}
              onClick={handleClear}
              className={cn(
                "w-16 h-12 flex items-center justify-center transition-all duration-100",
                "text-muted-foreground/60 text-2xl font-bold",
                "cursor-pointer select-none active:opacity-30 active:scale-90",
                "disabled:opacity-20 disabled:pointer-events-none",
                pressedKey === "clear" && "opacity-30 scale-90"
              )}
              title="Clear entered PIN"
            >
              <span className="leading-none select-none">.</span>
            </button>

            {/* Row 4: Center Slot (10th digit, 0) */}
            {(() => {
              const centerDigit = keypadLayout[9] ?? 0;
              return (
                <button
                  key={centerDigit}
                  type="button"
                  disabled={isVerifyingRef.current || isVerifying || cooldown.isCooldown || isSuccessUnlocked}
                  onClick={() => handleNumberClick(centerDigit)}
                  className={cn(
                    "w-16 h-12 flex items-center justify-center transition-all duration-100",
                    "text-foreground text-[28px] sm:text-[30px] font-medium tracking-tight",
                    "cursor-pointer select-none active:opacity-30 active:scale-90",
                    "disabled:opacity-30 disabled:pointer-events-none",
                    pressedKey === centerDigit && "opacity-30 scale-90"
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
                "w-16 h-12 flex items-center justify-center transition-all duration-100",
                "text-foreground",
                "cursor-pointer select-none active:opacity-30 active:scale-90",
                "disabled:opacity-20 disabled:pointer-events-none",
                pressedKey === "backspace" && "opacity-30 scale-90"
              )}
              title="Backspace"
            >
              <Delete className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" />
            </button>
          </div>

          {/* Bottom Actions: Forgot PIN & Sign Out */}
          <div className="flex items-center justify-center gap-3 pt-6 sm:pt-7">
            <button
              type="button"
              onClick={handleOpenForgotPin}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground transition-all cursor-pointer py-1 flex items-center gap-1 font-medium"
            >
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              <span>Forgot PIN?</span>
            </button>

            <span className="text-muted-foreground/30 select-none text-xs">•</span>

            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-destructive transition-all cursor-pointer py-1 flex items-center gap-1 font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot PIN: Ultra-Smooth Bottom Drawer (Mobile) & Centered Modal (Desktop) */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-[1000000] flex items-end sm:items-center justify-center select-none">
            {/* Smooth Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (!isVerifyingPassword) {
                  setForgotModalOpen(false);
                  setAccountPassword("");
                  setPasswordError("");
                  setPasswordShake(false);
                }
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer pointer-events-auto"
            />

            {/* Smooth Slide-up Drawer (Mobile) / Scale-in Modal (Desktop) */}
            <motion.div
              initial={{ y: "100%", opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className={cn(
                "relative z-10 w-full bg-card border-border shadow-2xl overflow-hidden pointer-events-auto",
                // Mobile: Anchored to bottom, rounded top corners, safe-area touch padding
                "max-w-full rounded-t-[1.75rem] rounded-b-none border-t border-x-0 border-b-0 p-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] max-h-[88dvh] overflow-y-auto",
                // Desktop: Centered modal card
                "sm:max-w-sm sm:rounded-2xl sm:border sm:p-6 sm:my-auto"
              )}
            >
              {/* Mobile Drag Pill Indicator */}
              <div className="sm:hidden w-11 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

              <div className="text-left space-y-1.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1 shadow-2xs">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold text-foreground">
                  Verify Account Password
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your EduSpace account password to unlock your active session and set a new 4-digit PIN.
                </p>
              </div>

              <form onSubmit={handleVerifyPassword} className="space-y-4">
                <div className={cn("space-y-1.5 transition-transform duration-200", passwordShake && "animate-shake")}>
                  <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Account Email</span>
                    <span className="font-mono text-foreground font-medium truncate max-w-[200px]">
                      {resolvedEmail || displayEmail}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your account password"
                      value={accountPassword}
                      onChange={(e) => {
                        setAccountPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      disabled={isVerifyingPassword}
                      autoFocus
                      className={cn(
                        "h-10 text-xs pr-9 rounded-xl transition-colors",
                        passwordError && "border-destructive focus-visible:ring-destructive"
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {passwordError && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive font-medium animate-in fade-in">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                </div>

                {/* Cloudflare Turnstile CAPTCHA Protection */}
                <div className="flex justify-center my-1.5 min-h-[65px]">
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAACoSjniwSUdeJX0r"}
                    options={{
                      theme: actualTheme === "dark" ? "dark" : "light",
                      size: "normal",
                    }}
                    onSuccess={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(undefined)}
                    onError={() => setCaptchaToken(undefined)}
                  />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={isVerifyingPassword || !accountPassword.trim() || !captchaToken}
                    className="w-full h-9.5 text-xs font-semibold rounded-xl gap-2 cursor-pointer shadow-sm"
                  >
                    {isVerifyingPassword ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Verifying Password...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Verify & Set New PIN</span>
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      disabled={isVerifyingPassword}
                      onClick={() => {
                        setForgotModalOpen(false);
                        setAccountPassword("");
                        setPasswordError("");
                        setPasswordShake(false);
                        setCaptchaToken(undefined);
                      }}
                      className="text-muted-foreground hover:text-foreground cursor-pointer py-1"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isVerifyingPassword}
                      onClick={() => {
                        setForgotModalOpen(false);
                        setCaptchaToken(undefined);
                        handleSignOut();
                      }}
                      className="text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer py-1"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>Or sign out</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PIN Reset / Setup Modal */}
      <PinSetupModal
        open={setupModalOpen}
        onOpenChange={setSetupModalOpen}
        onPinConfigured={setupPin}
        isUpdating={true}
      />
    </div>
  );

  return createPortal(
    <div id="eduspace-lock-screen-portal">{content}</div>,
    document.body
  );
};
