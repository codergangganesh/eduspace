import * as React from "react";
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useAdminAuth } from "./useAdminAuth";
import { pinLockService, PinLockSettings, CooldownStatus, PinRotationStatus, BROADCAST_CHANNEL_NAME } from "@/services/pinLock.service";
import { auditService } from "@/services/audit.service";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AdminPinLockContextType {
  isLocked: boolean;
  isPinSetup: boolean;
  isPinLockEnabled: boolean;
  isBiometricsSupported: boolean;
  settings: PinLockSettings;
  cooldown: CooldownStatus;
  pinRotation: PinRotationStatus;
  lockScreen: () => void;
  unlockWithPin: (pin: string) => Promise<{
    success: boolean;
    error?: string;
    remainingAttemptsInChance?: number;
    currentChance?: number;
    lockedUntil?: number;
    lockDurationType?: "1m" | "5m" | "24h" | null;
  }>;
  unlockWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  unlockWithPassword: (password: string, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  enableBiometrics: () => Promise<{ success: boolean; error?: string }>;
  setupPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  removePin: () => void;
  updateSettings: (updates: Partial<PinLockSettings>) => void;
  refreshStatus: () => void;
}

const AdminPinLockContext = createContext<AdminPinLockContextType | null>(null);

export function AdminPinLockProvider({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin } = useAdminAuth();
  const userId = user?.id || "";

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isPinSetup, setIsPinSetup] = useState<boolean>(false);
  const [isPinLockEnabled, setIsPinLockEnabled] = useState<boolean>(false);
  const [isBiometricsSupported, setIsBiometricsSupported] = useState<boolean>(false);
  const [settings, setSettings] = useState<PinLockSettings>(() => pinLockService.getSettings(""));
  const [cooldown, setCooldown] = useState<CooldownStatus>({
    isCooldown: false,
    remainingSeconds: 0,
    currentChance: 1,
    attemptInChance: 0,
    remainingAttemptsInChance: 3,
    lockDurationType: null,
  });
  const [pinRotation, setPinRotation] = useState<PinRotationStatus>(() =>
    pinLockService.getPinRotationStatus("")
  );

  const lastActivityRef = useRef<number>(Date.now());
  const hiddenTimeRef = useRef<number | null>(null);

  // Check hardware biometric capability once on mount
  useEffect(() => {
    pinLockService.isBiometricsSupported().then((supported) => {
      setIsBiometricsSupported(supported);
    });
  }, []);

  // Sync state with storage for active admin user
  const refreshStatus = useCallback(() => {
    if (!userId || !isAdmin) {
      setIsLocked(false);
      setIsPinSetup(false);
      setIsPinLockEnabled(false);
      setPinRotation(pinLockService.getPinRotationStatus(""));
      return;
    }

    const hasPin = pinLockService.hasPin(userId);
    const isEnabled = pinLockService.isPinLockEnabled(userId);
    const currentSettings = pinLockService.getSettings(userId);
    const locked = pinLockService.isSessionLocked(userId);
    const currentCooldown = pinLockService.getCooldownStatus(userId);
    const rotation = pinLockService.getPinRotationStatus(userId);

    setIsPinSetup(hasPin);
    setIsPinLockEnabled(isEnabled);
    setSettings(currentSettings);
    setIsLocked(isEnabled && locked);
    setCooldown(currentCooldown);
    setPinRotation(rotation);
  }, [userId, isAdmin]);

  // Real-time Multi-Tab BroadcastChannel Synchronization
  useEffect(() => {
    if (!userId || typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    const handleBroadcastMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.userId !== userId) return;

      if (data.type === "LOCK") {
        setIsLocked(true);
        setCooldown(pinLockService.getCooldownStatus(userId));
      } else if (data.type === "UNLOCK") {
        setIsLocked(false);
        setCooldown(pinLockService.getCooldownStatus(userId));
      } else if (data.type === "CONFIG_UPDATED") {
        refreshStatus();
      } else if (data.type === "LOCKOUT") {
        setCooldown(pinLockService.getCooldownStatus(userId));
      }
    };

    channel.addEventListener("message", handleBroadcastMessage);
    return () => {
      channel.removeEventListener("message", handleBroadcastMessage);
      channel.close();
    };
  }, [userId, refreshStatus]);

  // Initial load when user changes: check local and sync with cloud
  useEffect(() => {
    refreshStatus();
    lastActivityRef.current = Date.now();

    if (userId && isAdmin) {
      pinLockService.syncFromCloudIfNewer(userId).then((didUpdate) => {
        if (didUpdate) {
          refreshStatus();
        }
      });
    }
  }, [userId, isAdmin, refreshStatus]);

  // Cooldown countdown interval
  useEffect(() => {
    if (!userId || !cooldown.isCooldown) return;

    const interval = setInterval(() => {
      const status = pinLockService.getCooldownStatus(userId);
      setCooldown(status);
      if (!status.isCooldown) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userId, cooldown.isCooldown]);

  // Lock Screen action
  const lockScreen = useCallback(() => {
    if (!userId) return;
    const isSetup = pinLockService.hasPin(userId);
    const isEnabled = pinLockService.isPinLockEnabled(userId);

    if (!isSetup) {
      toast.error("Please create your lock screen PIN first", {
        description: "You haven't set up an in-app lock PIN yet. Navigate to Settings → In-App Lock to create your 4-digit PIN.",
        duration: 4500,
      });
      return;
    }

    if (!isEnabled) {
      toast.error("PIN Lock is disabled", {
        description: "Please enable PIN lock in Settings → In-App Lock to lock your screen.",
        duration: 4000,
      });
      return;
    }

    pinLockService.setSessionLocked(userId, true);
    setCooldown(pinLockService.getCooldownStatus(userId));
    setIsLocked(true);

    auditService.logAction({
      action: "ADMIN_SCREEN_LOCKED",
      details: {
        trigger: "manual_or_shortcut",
        timestamp: new Date().toISOString(),
      },
    });
  }, [userId]);

  // Global Alt + L keyboard shortcut to instantly lock screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.altKey && (e.key === "l" || e.key === "L")) ||
        (e.ctrlKey && e.altKey && (e.key === "l" || e.key === "L")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "l" || e.key === "L"))
      ) {
        e.preventDefault();
        lockScreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lockScreen]);

  // Unlock with PIN
  const unlockWithPin = useCallback(
    async (pin: string) => {
      if (!userId) return { success: false, error: "No active user session." };
      const res = await pinLockService.verifyPin(userId, (pin || "").trim());
      if (res.success) {
        setIsLocked(false);
        setCooldown(pinLockService.getCooldownStatus(userId));
        lastActivityRef.current = Date.now();
        try {
          localStorage.setItem(`eduspace_admin_last_act_${userId}`, String(Date.now()));
        } catch (_) {}
      } else {
        const cd = pinLockService.getCooldownStatus(userId);
        setCooldown(cd);
      }
      return res;
    },
    [userId]
  );

  // Unlock with Biometrics (Fingerprint / Touch ID / Windows Hello)
  const unlockWithBiometrics = useCallback(async () => {
    if (!userId) return { success: false, error: "No active user session." };
    const res = await pinLockService.verifyBiometrics(userId);
    if (res.success) {
      setIsLocked(false);
      setCooldown(pinLockService.getCooldownStatus(userId));
      lastActivityRef.current = Date.now();
      try {
        localStorage.setItem(`eduspace_admin_last_act_${userId}`, String(Date.now()));
      } catch (_) {}
    }
    return res;
  }, [userId]);

  // Unlock with Account Password (Forgot PIN Recovery)
  const unlockWithPassword = useCallback(
    async (password: string, captchaToken?: string) => {
      let activeEmail = user?.email || "";
      let activeId = userId;

      if (!activeEmail || !activeId) {
        try {
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();
          if (currentSession?.user) {
            activeEmail = activeEmail || currentSession.user.email || "";
            activeId = activeId || currentSession.user.id || "";
          }
        } catch (_) {}
      }

      if (!activeId && !activeEmail) {
        try {
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();
          if (currentUser) {
            activeEmail = activeEmail || currentUser.email || "";
            activeId = activeId || currentUser.id || "";
          }
        } catch (_) {}
      }

      const res = await pinLockService.unlockWithPassword(activeId, activeEmail, password, captchaToken);
      if (res.success && activeId) {
        setIsLocked(false);
        setCooldown(pinLockService.getCooldownStatus(activeId));
        lastActivityRef.current = Date.now();
        try {
          localStorage.setItem(`eduspace_admin_last_act_${activeId}`, String(Date.now()));
        } catch (_) {}
      }
      return res;
    },
    [userId, user?.email]
  );

  // Enable / Enroll Biometrics
  const enableBiometrics = useCallback(async () => {
    if (!userId) return { success: false, error: "No active user session." };
    const email = user?.email || "";
    const displayName = profile?.full_name || "Administrator";
    const res = await pinLockService.registerBiometrics(userId, email, displayName);
    if (res.success) {
      refreshStatus();
    }
    return res;
  }, [userId, user?.email, profile?.full_name, refreshStatus]);

  // Setup new PIN
  const setupPin = useCallback(
    async (pin: string) => {
      if (!userId) return { success: false, error: "No active admin user." };
      const res = await pinLockService.setupPin(userId, pin);
      if (res.success) {
        if (isBiometricsSupported) {
          try {
            await pinLockService.registerBiometrics(
              userId,
              user?.email || "",
              profile?.full_name || "Administrator"
            );
          } catch (_) {}
        }
        refreshStatus();
        lastActivityRef.current = Date.now();
      }
      return res;
    },
    [userId, user?.email, profile?.full_name, isBiometricsSupported, refreshStatus]
  );

  // Remove PIN
  const removePin = useCallback(() => {
    if (!userId) return;
    pinLockService.removePin(userId);
    refreshStatus();
  }, [userId, refreshStatus]);

  // Update Settings
  const updateSettings = useCallback(
    (updates: Partial<PinLockSettings>) => {
      if (!userId) return;
      pinLockService.updateSettings(userId, updates);
      refreshStatus();
      lastActivityRef.current = Date.now(); // Reset activity timer on settings change
    },
    [userId, refreshStatus]
  );

  // High-accuracy User Activity Tracking & Inactivity Auto-Lock
  useEffect(() => {
    if (!userId || !isPinLockEnabled || isLocked) return;

    let lastStorageWrite = 0;
    const onUserActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      // Throttle storage writes to once per 5 seconds
      if (now - lastStorageWrite > 5000) {
        lastStorageWrite = now;
        try {
          localStorage.setItem(`eduspace_admin_last_act_${userId}`, String(now));
        } catch (_) {}
      }
    };

    const events = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "pointerdown",
      "mousemove",
    ];
    events.forEach((ev) => window.addEventListener(ev, onUserActivity, { passive: true }));

    // High-accuracy interval: checks every 1000ms (1 second)
    const interval = setInterval(() => {
      if (!isPinLockEnabled || isLocked) return;
      const timeoutMinutes = settings.autoLockTimeout;
      if (!timeoutMinutes || timeoutMinutes <= 0) return;

      // Check cross-tab activity from localStorage
      let latestActivity = lastActivityRef.current;
      try {
        const stored = localStorage.getItem(`eduspace_admin_last_act_${userId}`);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > latestActivity) {
            latestActivity = parsed;
            lastActivityRef.current = parsed;
          }
        }
      } catch (_) {}

      const idleDuration = Date.now() - latestActivity;
      const maxIdleMs = timeoutMinutes * 60 * 1000;

      if (idleDuration >= maxIdleMs) {
        lockScreen();
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onUserActivity));
      clearInterval(interval);
    };
  }, [userId, isPinLockEnabled, isLocked, settings.autoLockTimeout, lockScreen]);

  // Tab Visibility & Background Switch Listener
  useEffect(() => {
    if (!userId || !isPinLockEnabled || isLocked) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenTimeRef.current = Date.now();
        if (settings.autoLockOnTabSwitch) {
          lockScreen();
        }
      } else if (document.visibilityState === "visible") {
        if (hiddenTimeRef.current) {
          const timeAwayMs = Date.now() - hiddenTimeRef.current;
          const timeoutMinutes = settings.autoLockTimeout;
          const timeoutMs = (timeoutMinutes || 5) * 60 * 1000;

          if (settings.autoLockOnTabSwitch || timeAwayMs >= timeoutMs) {
            lockScreen();
          }
          hiddenTimeRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [userId, isPinLockEnabled, isLocked, settings.autoLockOnTabSwitch, settings.autoLockTimeout, lockScreen]);

  return (
    <AdminPinLockContext.Provider
      value={{
        isLocked,
        isPinSetup,
        isPinLockEnabled,
        isBiometricsSupported,
        settings,
        cooldown,
        pinRotation,
        lockScreen,
        unlockWithPin,
        unlockWithBiometrics,
        unlockWithPassword,
        enableBiometrics,
        setupPin,
        removePin,
        updateSettings,
        refreshStatus,
      }}
    >
      {children}
    </AdminPinLockContext.Provider>
  );
};

export const useAdminPinLock = (): AdminPinLockContextType => {
  const context = useContext(AdminPinLockContext);
  if (!context) {
    throw new Error("useAdminPinLock must be used within an AdminPinLockProvider");
  }
  return context;
};
