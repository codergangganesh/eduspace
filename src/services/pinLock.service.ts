/**
 * EduSpace - 4-Digit In-App PIN & Biometric Security Service
 * Designed for Student and Lecturer Portals.
 * Provides:
 * 1. Cryptographic salting + SHA-256 hashing via browser WebCrypto API for 4-digit PIN.
 * 2. Native WebAuthn platform authenticator (Touch ID, Windows Hello, Face ID, Android Fingerprint).
 * 3. Multi-tier Progressive 3-Chance x 3-Attempt Security Lockout:
 *    - Chance 1 (3 attempts) -> 1 minute lockout (00:59 countdown)
 *    - Chance 2 (3 attempts) -> 5 minutes lockout (04:59 countdown)
 *    - Chance 3 (3 attempts) -> 24 hours lockout (23:59:59 countdown)
 * 4. Multi-tab synchronization and background session lock.
 * 5. Optional Cloud Multi-Device PIN Sync via Supabase Zero-Knowledge Metadata.
 */

import { supabase } from "@/integrations/supabase/client";

export interface PinLockSettings {
  enabled: boolean;
  lockType?: "pin" | "password"; // "pin" = 4-digit PIN, "password" = custom alphanumeric password
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
  algo?: "PBKDF2-100K" | "SHA-256";
  iterations?: number;
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

export interface PinRotationStatus {
  pinAgeDays: number;
  isExpiredOrDue: boolean; // >= 90 days
  isExpiringSoon: boolean; // >= 75 days && < 90 days
  daysRemaining: number;
  lastUpdatedDate: string | null;
  statusLabel: string;
}

const STORAGE_PREFIX = "eduspace_user_pin";
export const MAX_ATTEMPTS_PER_CHANCE = 3;
export const MAX_CHANCES = 3;

export const CHANCE_1_LOCKOUT_MS = 1 * 60 * 1000; // 1 minute (01:00)
export const CHANCE_2_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes (05:00)
export const CHANCE_3_LOCKOUT_MS = 24 * 60 * 60 * 1000; // 24 hours (24:00:00)

export const PBKDF2_ITERATIONS = 100000;
export const BROADCAST_CHANNEL_NAME = "eduspace_user_pin_lock_sync";

export type BroadcastPinEvent =
  | { type: "LOCK"; userId: string; timestamp: number }
  | { type: "UNLOCK"; userId: string; timestamp: number }
  | { type: "CONFIG_UPDATED"; userId: string; timestamp: number }
  | { type: "LOCKOUT"; userId: string; lockedUntil: number; chance: number; timestamp: number };

/**
 * Broadcasts screen lock state changes to all open tabs in real-time.
 */
export function broadcastPinLockEvent(event: BroadcastPinEvent): void {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  } catch {
    // fallback
  }
}

/**
 * Blacklist of common, easily guessed 4-digit PINs.
 */
const COMMON_PIN_BLACKLIST = new Set([
  // Sequential
  "1234", "2345", "3456", "4567", "5678", "6789", "7890",
  "4321", "5432", "6543", "7654", "8765", "9876", "0987",
  // Repetitive
  "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999",
  // Geometric / Numpad patterns
  "2580", "0852", "1470", "0741", "1379", "9731", "1590",
  // Common pairs / years
  "1212", "1313", "1414", "6969", "2020", "2024", "2025", "2026",
]);

/**
 * Validate that the chosen PIN is not weak or trivial.
 */
export function isCommonOrWeakPin(pin: string): { isWeak: boolean; reason?: string } {
  if (!/^\d{4}$/.test(pin)) {
    return { isWeak: true, reason: "PIN must be exactly 4 numeric digits." };
  }
  if (COMMON_PIN_BLACKLIST.has(pin)) {
    return { isWeak: true, reason: "This PIN is too common and easily guessed. Please choose a more secure combination." };
  }
  if (pin[0] === pin[1] && pin[1] === pin[2] && pin[2] === pin[3]) {
    return { isWeak: true, reason: "Avoid using all repetitive digits (e.g. 1111, 2222)." };
  }
  return { isWeak: false };
}

export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  score: number; // 0 to 4
  reason?: string;
}

/**
 * Validate that the chosen alphanumeric lock password meets security standards:
 * - At least 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 numeric digit (0-9)
 * - At least 1 special character (!@#$%^&*...)
 */
export function validateLockPassword(password: string): PasswordValidationResult {
  const hasMinLength = Boolean(password && password.length >= 8);
  const hasUpper = /[A-Z]/.test(password || "");
  const hasLower = /[a-z]/.test(password || "");
  const hasNumber = /[0-9]/.test(password || "");
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password || "");

  let score = 0;
  if (hasMinLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  if (!hasMinLength) {
    return { isValid: false, hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial, score, reason: "Password must be at least 8 characters long." };
  }
  if (!hasUpper) {
    return { isValid: false, hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial, score, reason: "Password must contain at least 1 uppercase letter (A-Z)." };
  }
  if (!hasNumber) {
    return { isValid: false, hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial, score, reason: "Password must contain at least 1 numeric digit (0-9)." };
  }
  if (!hasSpecial) {
    return { isValid: false, hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial, score, reason: "Password must contain at least 1 special character (!@#$%...)." };
  }
  if (password.length > 64) {
    return { isValid: false, hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial, score, reason: "Password must be at most 64 characters long." };
  }

  return { isValid: true, hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial, score, reason: undefined };
}

/**
 * Validates alphanumeric custom password complexity for Screen Lock.
 */
export function isWeakPassword(password: string): { isWeak: boolean; reason?: string } {
  const result = validateLockPassword(password);
  return { isWeak: !result.isValid, reason: result.reason };
}

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
 * Generates a stable client device signature based on hardware and browser attributes.
 */
function getDeviceSignature(): string {
  if (typeof window === "undefined") return "server_env";
  try {
    const nav = window.navigator;
    const screen = window.screen;
    const parts = [
      nav.userAgent || "",
      nav.language || "",
      screen.colorDepth || "",
      (screen.width > screen.height ? "landscape" : "portrait"),
      nav.hardwareConcurrency || "1",
      window.location.hostname || "localhost",
    ];
    return parts.join("||");
  } catch {
    return "default_device";
  }
}

/**
 * Computes a high-security PBKDF2 key derivation (100,000 iterations) with Account-Bound Cryptographic Salt.
 * Ensures consistent, deterministic PIN verification across all user devices (Laptop, Tablet, Mobile Phone)
 * while maintaining maximum protection against GPU brute-forcing.
 */
async function computePbkdf2Hash(
  pin: string,
  salt: string,
  userId?: string,
  iterations = PBKDF2_ITERATIONS
): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const boundSalt = `salt_${salt}:user_${userId || "generic"}:eduspace_security_v4`;

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(boundSalt),
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Legacy v3 Device-Bound PBKDF2 hash (used for backward-compatible verification and seamless upgrade).
 */
async function computePbkdf2V3DeviceBound(
  pin: string,
  salt: string,
  userId?: string,
  iterations = PBKDF2_ITERATIONS
): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const deviceSig = getDeviceSignature();
  const boundSalt = `salt_${salt}:user_${userId || "generic"}:dev_${deviceSig}:eduspace_security_v3`;

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(boundSalt),
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Legacy v2 unbound PBKDF2 hash (used for fallback/upgrade).
 */
async function computePbkdf2V2Unbound(pin: string, salt: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(`salt_${salt}:user_pin_${pin}:eduspace_security_v2`),
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Legacy SHA-256 hash (maintained for backward-compatible verification and seamless upgrade).
 */
async function computeLegacySha256(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`salt_${salt}:user_pin_${pin}:eduspace_security_v1`);
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
   * Check if a 4-digit PIN is configured for the given user.
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
   * Check if PIN lock is actively enabled by the user.
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
   * Check if biometric unlock is enabled for this user.
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
   * Get all security settings for a user.
   */
  getSettings(userId: string): PinLockSettings {
    const defaults: PinLockSettings = {
      enabled: false,
      lockType: "pin",
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
        lockType: config.lockType === "password" ? "password" : "pin",
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
   * Synchronize PIN configuration to cloud account (Zero-Knowledge: only salt and SHA-256 hash).
   */
  async syncConfigToCloud(userId: string, config: StoredPinConfig | null): Promise<void> {
    if (!userId) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      // Offline: Skip cloud network sync silently without blocking local storage
      return;
    }
    try {
      // Clean biometricCredentialId before cloud upload (biometrics are hardware-device-bound)
      const cloudPayload = config
        ? {
            enabled: config.enabled,
            lockType: config.lockType || "pin",
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
          pin_lock_config: cloudPayload,
        },
      });
    } catch (err) {
      console.warn("[PinLockService] Cloud sync failed (non-critical):", err);
    }
  },

  /**
   * Fetch PIN configuration from cloud account metadata.
   */
  async fetchConfigFromCloud(userId: string): Promise<StoredPinConfig | null> {
    if (!userId) return null;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      // Offline: Skip network fetch
      return null;
    }
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return null;

      const cloudConfig = data.user.user_metadata?.pin_lock_config;
      if (cloudConfig && cloudConfig.hash && cloudConfig.salt) {
        return {
          enabled: Boolean(cloudConfig.enabled),
          lockType: cloudConfig.lockType === "password" ? "password" : "pin",
          biometricsEnabled: false, // Biometrics must be enabled per physical device
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
   * Useful when signing in on a second device (e.g. iPad, phone, new laptop).
   */
  async syncFromCloudIfNewer(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const cloudConfig = await this.fetchConfigFromCloud(userId);
      const rawLocal = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);

      if (cloudConfig) {
        if (!rawLocal) {
          // New device with no local PIN config: adopt cloud PIN config!
          localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(cloudConfig));
          return true;
        }

        const localConfig: StoredPinConfig = JSON.parse(rawLocal);
        const cloudTime = new Date(cloudConfig.updatedAt || 0).getTime();
        const localTime = new Date(localConfig.updatedAt || 0).getTime();

        if (cloudTime > localTime) {
          // Cloud has newer PIN config: preserve local biometrics if present
          const merged: StoredPinConfig = {
            ...cloudConfig,
            biometricsEnabled: localConfig.biometricsEnabled && Boolean(localConfig.biometricCredentialId),
            biometricCredentialId: localConfig.biometricCredentialId,
          };
          localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(merged));
          return true;
        }
      } else if (!cloudConfig && rawLocal) {
        // Local exists, upload to cloud to keep in sync
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
   * Set up or change the In-App Lock Secret (4-digit PIN or Alphanumeric Password) with PBKDF2 (100K iterations).
   */
  async setupPin(
    userId: string,
    secret: string,
    lockType: "pin" | "password" = "pin"
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: "Active user session required." };
    
    if (lockType === "password") {
      const passCheck = isWeakPassword(secret);
      if (passCheck.isWeak) {
        return { success: false, error: passCheck.reason || "Invalid lock password." };
      }
    } else {
      const weakCheck = isCommonOrWeakPin(secret);
      if (weakCheck.isWeak) {
        return { success: false, error: weakCheck.reason || "Invalid or weak PIN." };
      }
    }

    try {
      const currentSettings = this.getSettings(userId);
      const salt = generateSalt();
      const hash = await computePbkdf2Hash(secret, salt, userId, PBKDF2_ITERATIONS);

      const config: StoredPinConfig = {
        ...currentSettings,
        enabled: true,
        lockType,
        salt,
        hash,
        algo: "PBKDF2-100K",
        iterations: PBKDF2_ITERATIONS,
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
      return { success: false, error: err.message || "Failed to set up screen lock." };
    }
  },

  /**
   * Enroll the user's platform authenticator (Touch ID, Windows Hello, Fingerprint) for Screen Lock.
   */
  async registerBiometrics(
    userId: string,
    email: string,
    displayName: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: "User session required." };

    const supported = await this.isBiometricsSupported();
    if (!supported) {
      return { success: false, error: "Biometrics (Fingerprint / Touch ID / Windows Hello) are not supported on this device." };
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userIdBytes = new TextEncoder().encode(`eduspace_user_${userId.slice(0, 16)}`);

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "EduSpace App",
            id: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
          },
          user: {
            id: userIdBytes,
            name: email || "user@eduspace.internal",
            displayName: displayName || "EduSpace User",
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
        return { success: false, error: "Biometric enrollment was cancelled." };
      }
      return { success: false, error: err.message || "Biometric enrollment failed." };
    }
  },

  /**
   * Unlock with biometrics using WebAuthn Assertion.
   */
  async verifyBiometrics(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: "User session required." };

    const cooldown = this.getCooldownStatus(userId);
    if (cooldown.isCooldown) {
      return {
        success: false,
        error: `Authentication is locked. Try again in ${cooldown.remainingSeconds}s.`,
      };
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return { success: false, error: "No PIN configuration found." };

      const config: StoredPinConfig = JSON.parse(raw);
      if (!config.biometricsEnabled) {
        return { success: false, error: "Biometrics are not enabled for your account." };
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credentialId = config.biometricCredentialId;
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
   * Supports Device-Bound PBKDF2 with automatic fallback and seamless background upgrade.
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
    if (!userId) return { success: false, error: "User session not found." };

    // Check cooldown status
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

      let isMatch = false;

      // 1. Verify with modern Account-Bound PBKDF2 (Cross-Device Standard v4)
      const modernHash = await computePbkdf2Hash(enteredPin, config.salt, userId, config.iterations || PBKDF2_ITERATIONS);
      if (modernHash === config.hash) {
        isMatch = true;
      } else {
        // 2. Check legacy v3 Device-Bound PBKDF2 (if set up on this device prior to v4 upgrade)
        const legacyV3Hash = await computePbkdf2V3DeviceBound(enteredPin, config.salt, userId, config.iterations || PBKDF2_ITERATIONS);
        if (legacyV3Hash === config.hash) {
          isMatch = true;
          // Auto-upgrade to cross-device v4 hash
          try {
            const upgradedHash = await computePbkdf2Hash(enteredPin, config.salt, userId, PBKDF2_ITERATIONS);
            const upgradedConfig: StoredPinConfig = {
              ...config,
              hash: upgradedHash,
              algo: "PBKDF2-100K",
              iterations: PBKDF2_ITERATIONS,
              updatedAt: new Date().toISOString(),
            };
            localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(upgradedConfig));
            if (upgradedConfig.syncToCloud !== false) {
              this.syncConfigToCloud(userId, upgradedConfig);
            }
          } catch {}
        } else {
          // 3. Check legacy v2 unbound PBKDF2
          const unboundHash = await computePbkdf2V2Unbound(enteredPin, config.salt, config.iterations || PBKDF2_ITERATIONS);
          if (unboundHash === config.hash) {
            isMatch = true;
            // Auto-upgrade to cross-device v4 hash
            try {
              const upgradedHash = await computePbkdf2Hash(enteredPin, config.salt, userId, PBKDF2_ITERATIONS);
              const upgradedConfig: StoredPinConfig = {
                ...config,
                hash: upgradedHash,
                algo: "PBKDF2-100K",
                iterations: PBKDF2_ITERATIONS,
                updatedAt: new Date().toISOString(),
              };
              localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(upgradedConfig));
              if (upgradedConfig.syncToCloud !== false) {
                this.syncConfigToCloud(userId, upgradedConfig);
              }
            } catch {}
          } else {
            // 4. Check legacy SHA-256
            const legacyHash = await computeLegacySha256(enteredPin, config.salt);
            if (legacyHash === config.hash) {
              isMatch = true;
              try {
                const upgradedHash = await computePbkdf2Hash(enteredPin, config.salt, userId, PBKDF2_ITERATIONS);
                const upgradedConfig: StoredPinConfig = {
                  ...config,
                  hash: upgradedHash,
                  algo: "PBKDF2-100K",
                  iterations: PBKDF2_ITERATIONS,
                  updatedAt: new Date().toISOString(),
                };
                localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(upgradedConfig));
                if (upgradedConfig.syncToCloud !== false) {
                  this.syncConfigToCloud(userId, upgradedConfig);
                }
              } catch {}
            }
          }
        }
      }

      if (isMatch) {
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
   * Verify the current PIN or Password without modifying session lock state (used before credential change or type switch).
   */
  async verifyCurrentSecret(userId: string, secret: string): Promise<boolean> {
    if (!userId || !secret) return false;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return false;
      const config: StoredPinConfig = JSON.parse(raw);
      if (!config.hash || !config.salt) return false;

      // 1. Modern v4 Account-Bound hash
      const hash = await computePbkdf2Hash(secret, config.salt, userId, config.iterations || PBKDF2_ITERATIONS);
      if (hash === config.hash) return true;

      // 2. Legacy v3 Device-Bound hash
      const legacyV3Hash = await computePbkdf2V3DeviceBound(secret, config.salt, userId, config.iterations || PBKDF2_ITERATIONS);
      if (legacyV3Hash === config.hash) return true;

      // 3. Legacy v2 unbound hash
      const unboundHash = await computePbkdf2V2Unbound(secret, config.salt, config.iterations || PBKDF2_ITERATIONS);
      if (unboundHash === config.hash) return true;

      // 4. Legacy v1 SHA-256 hash
      const v1Hash = await computeLegacySha256(secret, config.salt);
      if (v1Hash === config.hash) return true;

      return false;
    } catch {
      return false;
    }
  },

  /**
   * Verify primary account password to recover from a forgotten PIN and unlock session immediately.
   */
  async unlockWithPassword(
    userId?: string,
    email?: string,
    password?: string,
    captchaToken?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!password || password.trim().length === 0) {
      return { success: false, error: "Please enter your account password." };
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return {
        success: false,
        error: "You are offline. Please enter your 4-digit PIN to unlock, or reconnect to the internet to verify your account password.",
      };
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
        error: "Active user session not found. Please sign out and log in again.",
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
          error: error.message || "Failed to verify account password.",
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
   * Update settings (like enabling/disabling or changing autoLockTimeout or syncToCloud).
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
   * Remove PIN and disable lock locally and on the cloud.
   */
  removePin(userId: string): void {
    if (!userId) return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}_config_${userId}`);
      this.clearFailedAttempts(userId);
      this.setSessionLocked(userId, false);
      this.syncConfigToCloud(userId, null);
    } catch {}
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
   * Set session lock state in sessionStorage and broadcast to other open tabs.
   */
  setSessionLocked(userId: string, locked: boolean): void {
    if (!userId) return;
    try {
      sessionStorage.setItem(`${STORAGE_PREFIX}_session_locked_${userId}`, locked ? "true" : "false");
      broadcastPinLockEvent({
        type: locked ? "LOCK" : "UNLOCK",
        userId,
        timestamp: Date.now(),
      });
    } catch {}
  },

  /**
   * Evaluates PIN age and 90-day rotation status for enterprise security compliance.
   */
  getPinRotationStatus(userId: string): PinRotationStatus {
    if (!userId) {
      return { pinAgeDays: 0, isExpiredOrDue: false, isExpiringSoon: false, daysRemaining: 90, lastUpdatedDate: null, statusLabel: "No PIN Configured" };
    }
    const settings = this.getSettings(userId);
    if (!settings.updatedAt) {
      return { pinAgeDays: 0, isExpiredOrDue: false, isExpiringSoon: false, daysRemaining: 90, lastUpdatedDate: null, statusLabel: "No PIN Configured" };
    }

    const updatedTime = new Date(settings.updatedAt).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - updatedTime);
    const pinAgeDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const maxDays = 90;
    const daysRemaining = Math.max(0, maxDays - pinAgeDays);

    let statusLabel = `Updated ${pinAgeDays === 0 ? "today" : `${pinAgeDays}d ago`} (${daysRemaining}d remaining)`;
    if (pinAgeDays >= maxDays) {
      statusLabel = `Rotation Due (${pinAgeDays}d old)`;
    } else if (pinAgeDays >= 75) {
      statusLabel = `Expiring Soon (${daysRemaining}d remaining)`;
    }

    return {
      pinAgeDays,
      isExpiredOrDue: pinAgeDays >= maxDays,
      isExpiringSoon: pinAgeDays >= 75 && pinAgeDays < maxDays,
      daysRemaining,
      lastUpdatedDate: settings.updatedAt,
      statusLabel,
    };
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
          // 24h lockout finished, reset to Chance 1
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
      } catch {}
    }

    // Increment attempt in current chance
    record.attemptInChance += 1;

    // Check if 3 attempts reached in this chance
    if (record.attemptInChance >= MAX_ATTEMPTS_PER_CHANCE) {
      if (record.currentChance === 1) {
        // Chance 1 exhausted -> 1 minute lockout
        record.lockedUntil = Date.now() + CHANCE_1_LOCKOUT_MS;
        record.lockDurationType = "1m";
      } else if (record.currentChance === 2) {
        // Chance 2 exhausted -> 5 minutes lockout
        record.lockedUntil = Date.now() + CHANCE_2_LOCKOUT_MS;
        record.lockDurationType = "5m";
      } else {
        // Chance 3 exhausted -> 24 hours lockout
        record.lockedUntil = Date.now() + CHANCE_3_LOCKOUT_MS;
        record.lockDurationType = "24h";
      }

      broadcastPinLockEvent({
        type: "LOCKOUT",
        userId,
        lockedUntil: record.lockedUntil,
        chance: record.currentChance,
        timestamp: Date.now(),
      });
    }

    try {
      localStorage.setItem(`${STORAGE_PREFIX}_attempts_${userId}`, JSON.stringify(record));
    } catch {}

    return record;
  },

  /**
   * Clear failed attempt counts upon successful unlock or PIN change.
   */
  clearFailedAttempts(userId: string): void {
    if (!userId) return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}_attempts_${userId}`);
    } catch {}
  },
};
