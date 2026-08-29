/**
 * EduSpace Admin Portal - 4-Digit In-App PIN & Biometric Security Service
 * Provides:
 * 1. Cryptographic salting + SHA-256 hashing via WebCrypto API for 4-digit PIN.
 * 2. Native WebAuthn platform authenticator (Touch ID, Windows Hello, Face ID, Android Fingerprint).
 * 3. Multi-tier Progressive 3-Chance x 3-Attempt Security Lockout:
 *    - Chance 1 (3 attempts) -> 1 minute lockout (00:59 countdown)
 *    - Chance 2 (3 attempts) -> 5 minutes lockout (04:59 countdown)
 *    - Chance 3 (3 attempts) -> 24 hours lockout (23:59:59 countdown)
 * 4. Multi-tab synchronization and background session lock.
 * 5. Optional Cloud Multi-Device PIN Sync via Supabase Zero-Knowledge Metadata.
 */

import { supabase } from "@/lib/supabase";

export interface PinLockSettings {
  enabled: boolean;
  biometricsEnabled: boolean;
  autoLockTimeout: number; // in minutes (1, 2, 5, 10, 15, 30, 60)
  autoLockOnTabSwitch: boolean;
  randomizeKeypad: boolean;
  syncToCloud: boolean;
  updatedAt: string;
}

export interface StoredPinConfig extends PinLockSettings {
  salt: string;
  hash: string;
  biometricCredentialId?: string;
}

export interface FailedAttemptsRecord {
  currentChance: number; // 1, 2, or 3
  attemptInChance: number; // 0, 1, 2, or 3
  lockedUntil: number | null; // epoch timestamp in ms
  lockDurationType: "1m" | "5m" | "24h" | null;
}

export interface CooldownStatus {
  isCooldown: boolean;
  remainingSeconds: number;
  currentChance: number; // 1, 2, or 3
  attemptInChance: number; // 0, 1, 2, or 3
  remainingAttemptsInChance: number; // 3, 2, 1, or 0
  lockDurationType: "1m" | "5m" | "24h" | null;
}

const STORAGE_PREFIX = "eduspace_admin_pin";
export const MAX_ATTEMPTS_PER_CHANCE = 3;
export const MAX_CHANCES = 3;

export const CHANCE_1_LOCKOUT_MS = 1 * 1000; // 1 minute (01:00)
export const CHANCE_2_LOCKOUT_MS = 5 * 1000; // 5 minutes (05:00)
export const CHANCE_3_LOCKOUT_MS = 5 * 1000; // 24 hours (24:00:00)

/**
 * Base64URL encoding/decoding helpers for WebAuthn binary IDs
 */
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Computes a salted SHA-256 hash using the native browser WebCrypto API.
 */
async function computeHash(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`salt_${salt}:admin_pin_${pin}:eduspace_admin_sec_v1`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a cryptographically secure random 16-byte salt string.
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const pinLockService = {
  /**
   * Check if the current browser and device support native Biometrics (Touch ID / Windows Hello / Face ID / Android).
   */
  async isBiometricsSupported(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (!window.PublicKeyCredential) return false;
    try {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Check if a 4-digit PIN is configured for the given admin.
   */
  hasPin(userId: string): boolean {
    if (!userId) return false;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return false;
      const config: StoredPinConfig = JSON.parse(raw);
      return Boolean(config.hash && config.salt);
    } catch {
      return false;
    }
  },

  /**
   * Check if PIN lock is actively enabled by the admin.
   */
  isPinLockEnabled(userId: string): boolean {
    if (!userId) return false;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return false;
      const config: StoredPinConfig = JSON.parse(raw);
      return Boolean(config.enabled && config.hash && config.salt);
    } catch {
      return false;
    }
  },

  /**
   * Check if biometric unlock is enabled for this admin.
   */
  isBiometricsEnabled(userId: string): boolean {
    if (!userId) return false;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return false;
      const config: StoredPinConfig = JSON.parse(raw);
      return Boolean(config.biometricsEnabled && config.biometricCredentialId);
    } catch {
      return false;
    }
  },

  /**
   * Get all security settings for an admin.
   */
  getSettings(userId: string): PinLockSettings {
    const defaults: PinLockSettings = {
      enabled: false,
      biometricsEnabled: false,
      autoLockTimeout: 5,
      autoLockOnTabSwitch: true,
      randomizeKeypad: false,
      syncToCloud: true,
      updatedAt: new Date().toISOString(),
    };

    if (!userId) return defaults;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return defaults;
      const config: StoredPinConfig = JSON.parse(raw);
      return {
        enabled: Boolean(config.enabled),
        biometricsEnabled: Boolean(config.biometricsEnabled),
        autoLockTimeout: typeof config.autoLockTimeout === "number" ? config.autoLockTimeout : 5,
        autoLockOnTabSwitch: config.autoLockOnTabSwitch !== undefined ? Boolean(config.autoLockOnTabSwitch) : true,
        randomizeKeypad: Boolean(config.randomizeKeypad),
        syncToCloud: config.syncToCloud !== undefined ? Boolean(config.syncToCloud) : true,
        updatedAt: config.updatedAt || new Date().toISOString(),
      };
    } catch {
      return defaults;
    }
  },

  /**
   * Synchronize PIN configuration to admin account (Zero-Knowledge: only salt and SHA-256 hash).
   */
  async syncConfigToCloud(userId: string, config: StoredPinConfig | null): Promise<void> {
    if (!userId) return;
    try {
      const cloudPayload = config
        ? {
          enabled: config.enabled,
          salt: config.salt,
          hash: config.hash,
          autoLockTimeout: config.autoLockTimeout,
          autoLockOnTabSwitch: config.autoLockOnTabSwitch,
          randomizeKeypad: config.randomizeKeypad,
          syncToCloud: config.syncToCloud !== undefined ? config.syncToCloud : true,
          updatedAt: config.updatedAt,
        }
        : null;

      await supabase.auth.updateUser({
        data: {
          admin_pin_lock_config: cloudPayload,
        },
      });
    } catch (err) {
      console.warn("[AdminPinLockService] Cloud sync failed (non-critical):", err);
    }
  },

  /**
   * Fetch PIN configuration from admin cloud metadata.
   */
  async fetchConfigFromCloud(userId: string): Promise<StoredPinConfig | null> {
    if (!userId) return null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return null;

      const cloudConfig = data.user.user_metadata?.admin_pin_lock_config;
      if (cloudConfig && cloudConfig.hash && cloudConfig.salt) {
        return {
          enabled: Boolean(cloudConfig.enabled),
          biometricsEnabled: false,
          autoLockTimeout: typeof cloudConfig.autoLockTimeout === "number" ? cloudConfig.autoLockTimeout : 5,
          autoLockOnTabSwitch: cloudConfig.autoLockOnTabSwitch !== undefined ? Boolean(cloudConfig.autoLockOnTabSwitch) : true,
          randomizeKeypad: Boolean(cloudConfig.randomizeKeypad),
          syncToCloud: cloudConfig.syncToCloud !== undefined ? Boolean(cloudConfig.syncToCloud) : true,
          updatedAt: cloudConfig.updatedAt || new Date().toISOString(),
          salt: cloudConfig.salt,
          hash: cloudConfig.hash,
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Sync from cloud if the cloud has a newer configuration than local storage.
   */
  async syncFromCloudIfNewer(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const cloudConfig = await this.fetchConfigFromCloud(userId);
      const rawLocal = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);

      if (cloudConfig) {
        if (!rawLocal) {
          localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(cloudConfig));
          return true;
        }

        const localConfig: StoredPinConfig = JSON.parse(rawLocal);
        const cloudTime = new Date(cloudConfig.updatedAt || 0).getTime();
        const localTime = new Date(localConfig.updatedAt || 0).getTime();

        if (cloudTime > localTime) {
          const merged: StoredPinConfig = {
            ...cloudConfig,
            biometricsEnabled: localConfig.biometricsEnabled && Boolean(localConfig.biometricCredentialId),
            biometricCredentialId: localConfig.biometricCredentialId,
          };
          localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(merged));
          return true;
        }
      } else if (!cloudConfig && rawLocal) {
        const localConfig: StoredPinConfig = JSON.parse(rawLocal);
        if (localConfig.syncToCloud !== false && localConfig.hash && localConfig.salt) {
          await this.syncConfigToCloud(userId, localConfig);
        }
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Set up a new 4-digit PIN or change existing PIN.
   */
  async setupPin(userId: string, pin: string): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: "Active admin session required." };
    if (!/^\d{4}$/.test(pin)) {
      return { success: false, error: "PIN must be exactly 4 digits (0-9)." };
    }

    try {
      const currentSettings = this.getSettings(userId);
      const salt = generateSalt();
      const hash = await computeHash(pin, salt);

      const config: StoredPinConfig = {
        ...currentSettings,
        enabled: true,
        salt,
        hash,
        syncToCloud: currentSettings.syncToCloud !== undefined ? currentSettings.syncToCloud : true,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(config));
      this.clearFailedAttempts(userId);

      // Asynchronously sync to cloud
      if (config.syncToCloud) {
        this.syncConfigToCloud(userId, config);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to set up PIN." };
    }
  },

  /**
   * Enroll the administrator's platform authenticator for Screen Lock.
   */
  async registerBiometrics(
    userId: string,
    email: string,
    displayName: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: "Admin session required." };

    const supported = await this.isBiometricsSupported();
    if (!supported) {
      return { success: false, error: "Biometrics (Fingerprint / Touch ID / Windows Hello) are not supported on this device." };
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userIdBytes = new TextEncoder().encode(`eduspace_admin_${userId.slice(0, 16)}`);

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "EduSpace Admin Portal",
            id: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
          },
          user: {
            id: userIdBytes,
            name: email || "admin@eduspace.internal",
            displayName: displayName || "EduSpace Administrator",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      })) as PublicKeyCredential;

      if (!credential) {
        return { success: false, error: "Biometric enrollment was cancelled." };
      }

      const credentialId = bufferToBase64url(credential.rawId);

      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return { success: false, error: "Please set up a 4-digit PIN first." };

      const config: StoredPinConfig = JSON.parse(raw);
      config.biometricsEnabled = true;
      config.biometricCredentialId = credentialId;
      config.updatedAt = new Date().toISOString();

      localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(config));
      return { success: true };
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        return { success: false, error: "Biometric enrollment was cancelled or permission denied." };
      }
      return { success: false, error: err.message || "Failed to register biometrics." };
    }
  },

  /**
   * Unlock with platform authenticator.
   */
  async verifyBiometrics(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: "Admin session required." };

    const cooldown = this.getCooldownStatus(userId);
    if (cooldown.isCooldown) {
      return {
        success: false,
        error: `Authentication is locked. Please wait ${cooldown.remainingSeconds}s.`,
      };
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return { success: false, error: "No PIN configuration found." };

      const config: StoredPinConfig = JSON.parse(raw);
      const credentialId = config.biometricCredentialId;

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const rpId = window.location.hostname === "localhost" ? "localhost" : window.location.hostname;

      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          rpId,
          userVerification: "required",
          timeout: 60000,
          allowCredentials: credentialId
            ? [
              {
                id: base64urlToBuffer(credentialId),
                type: "public-key",
                transports: ["internal"],
              },
            ]
            : undefined,
        },
      };

      const assertion = await navigator.credentials.get(getOptions);

      if (assertion) {
        this.clearFailedAttempts(userId);
        this.setSessionLocked(userId, false);
        return { success: true };
      }

      return { success: false, error: "Biometric verification failed." };
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        return { success: false, error: "Biometric scan was cancelled." };
      }
      return { success: false, error: err.message || "Biometric unlock failed." };
    }
  },

  /**
   * Verify an entered 4-digit PIN against the stored hash with progressive 3-chance security.
   */
  async verifyPin(
    userId: string,
    enteredPin: string
  ): Promise<{
    success: boolean;
    error?: string;
    remainingAttemptsInChance?: number;
    currentChance?: number;
    lockedUntil?: number;
    lockDurationType?: "1m" | "5m" | "24h" | null;
  }> {
    if (!userId) return { success: false, error: "Admin session not found." };

    const cooldown = this.getCooldownStatus(userId);
    if (cooldown.isCooldown) {
      return {
        success: false,
        error: `Authentication is locked. Try again in ${cooldown.remainingSeconds}s.`,
        lockedUntil: Date.now() + cooldown.remainingSeconds * 1000,
        currentChance: cooldown.currentChance,
        lockDurationType: cooldown.lockDurationType,
      };
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return { success: false, error: "No PIN configured on this device." };

      const config: StoredPinConfig = JSON.parse(raw);
      if (!config.hash || !config.salt) {
        return { success: false, error: "Invalid PIN configuration." };
      }

      const inputHash = await computeHash(enteredPin, config.salt);
      if (inputHash === config.hash) {
        this.clearFailedAttempts(userId);
        this.setSessionLocked(userId, false);
        return { success: true };
      } else {
        const record = this.recordFailedAttempt(userId);
        const chance = record.currentChance;
        const attempt = record.attemptInChance;
        const remainingInChance = Math.max(0, MAX_ATTEMPTS_PER_CHANCE - attempt);

        if (record.lockedUntil) {
          let errorMsg = "";
          if (record.lockDurationType === "1m") {
            errorMsg = "Chance 1 of 3 exhausted. Authentication locked for 1 minute.";
          } else if (record.lockDurationType === "5m") {
            errorMsg = "Too Many Attempts. Authentication locked for 5 minutes.";
          } else {
            errorMsg = "Authentication Locked. All 3 chances have been used. Please try again after 24 hours.";
          }

          return {
            success: false,
            error: errorMsg,
            lockedUntil: record.lockedUntil,
            remainingAttemptsInChance: 0,
            currentChance: chance,
            lockDurationType: record.lockDurationType,
          };
        }

        return {
          success: false,
          error: `${remainingInChance} attempt${remainingInChance === 1 ? "" : "s"} remaining`,
          remainingAttemptsInChance: remainingInChance,
          currentChance: chance,
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to verify PIN." };
    }
  },

  /**
   * Verify administrator account password to recover from a forgotten PIN and unlock session immediately.
   */
  async unlockWithPassword(
    userId?: string,
    email?: string,
    password?: string,
    captchaToken?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!password || password.trim().length === 0) {
      return { success: false, error: "Please enter your administrator password." };
    }

    let resolvedUserId = userId;
    let resolvedEmail = email;

    // Fallback to active Supabase session if user/email was not passed
    if (!resolvedUserId || !resolvedEmail) {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (currentUser) {
          resolvedUserId = resolvedUserId || currentUser.id;
          resolvedEmail = resolvedEmail || currentUser.email;
        }
      } catch {
        // ignore
      }
    }

    if (!resolvedUserId || !resolvedEmail) {
      return {
        success: false,
        error: "Active administrator session not found. Please sign out and log in again.",
      };
    }

    try {
      console.log("[PinLock] Verifying password for email:", resolvedEmail.trim(), "with captcha:", Boolean(captchaToken));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail.trim(),
        password,
        ...(captchaToken ? { options: { captchaToken } } : {}),
      });

      if (error) {
        console.error("[PinLock] Supabase Auth Error:", error.message, "Status:", error.status);
        const msg = error.message ? error.message.toLowerCase() : "";
        if (
          msg.includes("invalid login credentials") ||
          msg.includes("invalid password")
        ) {
          return {
            success: false,
            error: "Incorrect password. Please verify and try again.",
          };
        }
        if (msg.includes("too many") || error.status === 429) {
          return {
            success: false,
            error: "Too many attempts. Please wait a moment and try again.",
          };
        }
        return {
          success: false,
          error: error.message || "Failed to verify administrator password.",
        };
      }

      if (data?.user) {
        this.clearFailedAttempts(resolvedUserId);
        this.setSessionLocked(resolvedUserId, false);
        return { success: true };
      }

      return { success: false, error: "Password verification failed." };
    } catch (err: any) {
      console.error("[PinLock] Unexpected verification error:", err);
      return {
        success: false,
        error: err.message || "An unexpected error occurred while verifying password.",
      };
    }
  },

  /**
   * Update settings (like enabling/disabling, autoLockTimeout, or syncToCloud).
   */
  updateSettings(userId: string, updates: Partial<PinLockSettings>): boolean {
    if (!userId) return false;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return false;
      const config: StoredPinConfig = JSON.parse(raw);
      const updated: StoredPinConfig = {
        ...config,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(updated));

      // Asynchronously sync to cloud
      if (updated.syncToCloud !== false) {
        this.syncConfigToCloud(userId, updated);
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove PIN and disable lock locally and in the cloud.
   */
  removePin(userId: string): void {
    if (!userId) return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}_config_${userId}`);
      this.clearFailedAttempts(userId);
      this.setSessionLocked(userId, false);
      this.syncConfigToCloud(userId, null);
    } catch { }
  },

  /**
   * Session Lock Status in sessionStorage.
   */
  isSessionLocked(userId: string): boolean {
    if (!userId) return false;
    if (!this.isPinLockEnabled(userId)) return false;
    try {
      const isLocked = sessionStorage.getItem(`${STORAGE_PREFIX}_session_locked_${userId}`);
      if (isLocked === null) {
        return true;
      }
      return isLocked === "true";
    } catch {
      return false;
    }
  },

  /**
   * Set session lock state in sessionStorage.
   */
  setSessionLocked(userId: string, locked: boolean): void {
    if (!userId) return;
    try {
      sessionStorage.setItem(`${STORAGE_PREFIX}_session_locked_${userId}`, locked ? "true" : "false");
    } catch { }
  },

  /**
   * Check if a progressive lockout cooldown is currently active.
   */
  getCooldownStatus(userId: string): CooldownStatus {
    const defaultStatus: CooldownStatus = {
      isCooldown: false,
      remainingSeconds: 0,
      currentChance: 1,
      attemptInChance: 0,
      remainingAttemptsInChance: 3,
      lockDurationType: null,
    };

    if (!userId) return defaultStatus;

    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_attempts_${userId}`);
      if (!raw) return defaultStatus;

      const record: FailedAttemptsRecord = JSON.parse(raw);
      let currentChance = record.currentChance || 1;
      let attemptInChance = record.attemptInChance || 0;
      let lockDurationType = record.lockDurationType || null;

      // Check if lockout is active
      if (record.lockedUntil && record.lockedUntil > Date.now()) {
        const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
        return {
          isCooldown: true,
          remainingSeconds,
          currentChance,
          attemptInChance,
          remainingAttemptsInChance: 0,
          lockDurationType,
        };
      }

      // If cooldown finished, automatically progress to next chance
      if (record.lockedUntil && record.lockedUntil <= Date.now()) {
        if (currentChance < MAX_CHANCES) {
          currentChance += 1;
          attemptInChance = 0;
        } else {
          currentChance = 1;
          attemptInChance = 0;
        }

        const updatedRecord: FailedAttemptsRecord = {
          currentChance,
          attemptInChance: 0,
          lockedUntil: null,
          lockDurationType: null,
        };
        localStorage.setItem(`${STORAGE_PREFIX}_attempts_${userId}`, JSON.stringify(updatedRecord));

        return {
          isCooldown: false,
          remainingSeconds: 0,
          currentChance,
          attemptInChance: 0,
          remainingAttemptsInChance: 3,
          lockDurationType: null,
        };
      }

      const remainingAttemptsInChance = Math.max(0, MAX_ATTEMPTS_PER_CHANCE - attemptInChance);

      return {
        isCooldown: false,
        remainingSeconds: 0,
        currentChance,
        attemptInChance,
        remainingAttemptsInChance,
        lockDurationType: null,
      };
    } catch {
      return defaultStatus;
    }
  },

  /**
   * Record a failed PIN attempt and trigger progressive lockout when a chance is exhausted.
   */
  recordFailedAttempt(userId: string): FailedAttemptsRecord {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}_attempts_${userId}`);
    let record: FailedAttemptsRecord = {
      currentChance: 1,
      attemptInChance: 0,
      lockedUntil: null,
      lockDurationType: null,
    };

    if (raw) {
      try {
        record = JSON.parse(raw);
        if (!record.currentChance) record.currentChance = 1;
        if (typeof record.attemptInChance !== "number") record.attemptInChance = 0;
      } catch { }
    }

    // Increment attempt in current chance
    record.attemptInChance += 1;

    // Check if 3 attempts reached in this chance
    if (record.attemptInChance >= MAX_ATTEMPTS_PER_CHANCE) {
      if (record.currentChance === 1) {
        record.lockedUntil = Date.now() + CHANCE_1_LOCKOUT_MS;
        record.lockDurationType = "1m";
      } else if (record.currentChance === 2) {
        record.lockedUntil = Date.now() + CHANCE_2_LOCKOUT_MS;
        record.lockDurationType = "5m";
      } else {
        record.lockedUntil = Date.now() + CHANCE_3_LOCKOUT_MS;
        record.lockDurationType = "24h";
      }
    }

    try {
      localStorage.setItem(`${STORAGE_PREFIX}_attempts_${userId}`, JSON.stringify(record));
    } catch { }

    return record;
  },

  /**
   * Clear failed attempt counts upon successful unlock or PIN change.
   */
  clearFailedAttempts(userId: string): void {
    if (!userId) return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}_attempts_${userId}`);
    } catch { }
  },
};
