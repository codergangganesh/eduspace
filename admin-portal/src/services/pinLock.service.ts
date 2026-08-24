/**
 * EduSpace Admin Portal - 4-Digit In-App PIN & Biometric Security Service
 * Provides:
 * 1. Cryptographic salting + SHA-256 hashing via WebCrypto API for 4-digit PIN.
 * 2. Native WebAuthn platform authenticator (Touch ID, Windows Hello, Face ID, Android Fingerprint).
 * 3. Auto-lock timing, brute-force cooldown tracking, and session persistence.
 */

export interface PinLockSettings {
  enabled: boolean;
  biometricsEnabled: boolean;
  autoLockTimeout: number; // in minutes (1, 5, 15, 30)
  autoLockOnTabSwitch: boolean;
  updatedAt: string;
}

interface StoredPinConfig extends PinLockSettings {
  salt: string;
  hash: string;
  biometricCredentialId?: string;
}

interface FailedAttemptsRecord {
  count: number;
  lockedUntil: number | null;
}

const STORAGE_PREFIX = "eduspace_admin_pin";
const MAX_FAILED_ATTEMPTS = 3;
const COOLDOWN_DURATION_MS = 30 * 1000; // 30 seconds cooldown after 3 failed attempts

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
  const data = enc.encode(`salt_${salt}:admin_pin_${pin}:eduspace_security_v1`);
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
   * Check if the current browser and device support native Biometrics (Touch ID / Windows Hello / Face ID).
   */
  async isBiometricsSupported(): Promise<boolean> {
    if (typeof window === "undefined" || !window.PublicKeyCredential || !navigator.credentials) {
      return false;
    }
    try {
      if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return true;
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
      return Boolean(config?.hash && config?.salt);
    } catch {
      return false;
    }
  },

  /**
   * Check if PIN Screen Lock is currently enabled for the given user.
   */
  isPinLockEnabled(userId: string): boolean {
    if (!userId) return false;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return false;
      const config: StoredPinConfig = JSON.parse(raw);
      return Boolean(config?.enabled && config?.hash && config?.salt);
    } catch {
      return false;
    }
  },

  /**
   * Check if Biometric Unlock is enabled and enrolled for the user.
   */
  isBiometricsEnabled(userId: string): boolean {
    if (!userId) return false;
    const settings = this.getSettings(userId);
    return Boolean(settings.enabled && settings.biometricsEnabled);
  },

  /**
   * Get user PIN & Biometric settings.
   */
  getSettings(userId: string): PinLockSettings {
    const defaults: PinLockSettings = {
      enabled: false,
      biometricsEnabled: true,
      autoLockTimeout: 5, // 5 minutes default
      autoLockOnTabSwitch: true,
      updatedAt: new Date().toISOString(),
    };

    if (!userId) return defaults;

    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (!raw) return defaults;
      const config: StoredPinConfig = JSON.parse(raw);
      return {
        enabled: Boolean(config.enabled),
        biometricsEnabled: config.biometricsEnabled !== false,
        autoLockTimeout: typeof config.autoLockTimeout === "number" ? config.autoLockTimeout : 5,
        autoLockOnTabSwitch: config.autoLockOnTabSwitch !== false,
        updatedAt: config.updatedAt || new Date().toISOString(),
      };
    } catch {
      return defaults;
    }
  },

  /**
   * Set up a new 4-digit PIN or change existing PIN.
   */
  async setupPin(userId: string, pin: string): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: "Active administrator session required." };
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
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(config));
      this.clearFailedAttempts(userId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to set up PIN." };
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

      const userIdBytes = new TextEncoder().encode(`eduspace_admin_${userId.slice(0, 16)}`);

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Eduspace Admin Portal",
            id: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
          },
          user: {
            id: userIdBytes,
            name: email || "admin@eduspace.internal",
            displayName: displayName || "Administrator",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Built-in fingerprint / Face ID / Touch ID / Windows Hello
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      })) as any;

      if (!credential) {
        return { success: false, error: "Biometric registration was cancelled." };
      }

      const credentialId = bufferToBase64url(credential.rawId);

      // Save credential ID in user config
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      if (raw) {
        const config: StoredPinConfig = JSON.parse(raw);
        config.biometricCredentialId = credentialId;
        config.biometricsEnabled = true;
        config.updatedAt = new Date().toISOString();
        localStorage.setItem(`${STORAGE_PREFIX}_config_${userId}`, JSON.stringify(config));
      }

      return { success: true };
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        return { success: false, error: "Biometric registration was cancelled or timed out." };
      }
      return { success: false, error: err.message || "Failed to enable biometric authentication." };
    }
  },

  /**
   * Unlock session using the native device Biometric sensor (Fingerprint / Touch ID / Windows Hello).
   */
  async verifyBiometrics(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: "User session required." };

    const supported = await this.isBiometricsSupported();
    if (!supported) {
      return { success: false, error: "Biometric authentication not supported." };
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_config_${userId}`);
      let credentialId: string | undefined;
      if (raw) {
        const config: StoredPinConfig = JSON.parse(raw);
        credentialId = config.biometricCredentialId;
      }

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
   * Verify an entered 4-digit PIN against the stored hash.
   */
  async verifyPin(
    userId: string,
    enteredPin: string
  ): Promise<{
    success: boolean;
    error?: string;
    remainingAttempts?: number;
    lockedUntil?: number;
  }> {
    if (!userId) return { success: false, error: "User session not found." };

    // Check cooldown status
    const cooldown = this.getCooldownStatus(userId);
    if (cooldown.isCooldown) {
      return {
        success: false,
        error: `Too many failed attempts. Please wait ${cooldown.remainingSeconds}s.`,
        lockedUntil: Date.now() + cooldown.remainingSeconds * 1000,
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
        const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.count);

        if (record.lockedUntil) {
          return {
            success: false,
            error: "Too many incorrect attempts. Keypad temporarily locked for 30 seconds.",
            lockedUntil: record.lockedUntil,
            remainingAttempts: 0,
          };
        }

        return {
          success: false,
          error: `Incorrect PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
          remainingAttempts: remaining,
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to verify PIN." };
    }
  },

  /**
   * Update settings (like enabling/disabling or changing autoLockTimeout).
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
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove PIN and disable lock.
   */
  removePin(userId: string): void {
    if (!userId) return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}_config_${userId}`);
      this.clearFailedAttempts(userId);
      this.setSessionLocked(userId, false);
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
      // Default to locked on first load if PIN is enabled
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
    } catch {}
  },

  /**
   * Check cooldown timer.
   */
  getCooldownStatus(userId: string): { isCooldown: boolean; remainingSeconds: number } {
    if (!userId) return { isCooldown: false, remainingSeconds: 0 };
    try {
      const raw = sessionStorage.getItem(`${STORAGE_PREFIX}_attempts_${userId}`);
      if (!raw) return { isCooldown: false, remainingSeconds: 0 };
      const record: FailedAttemptsRecord = JSON.parse(raw);
      if (record.lockedUntil && record.lockedUntil > Date.now()) {
        const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
        return { isCooldown: true, remainingSeconds };
      }
      return { isCooldown: false, remainingSeconds: 0 };
    } catch {
      return { isCooldown: false, remainingSeconds: 0 };
    }
  },

  /**
   * Record a failed PIN attempt and trigger cooldown if exceeded.
   */
  recordFailedAttempt(userId: string): FailedAttemptsRecord {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}_attempts_${userId}`);
    let record: FailedAttemptsRecord = { count: 0, lockedUntil: null };
    if (raw) {
      try {
        record = JSON.parse(raw);
      } catch {}
    }

    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = Date.now() + COOLDOWN_DURATION_MS;
      record.count = 0; // Reset count for next cycle after cooldown
    }

    try {
      sessionStorage.setItem(`${STORAGE_PREFIX}_attempts_${userId}`, JSON.stringify(record));
    } catch {}

    return record;
  },

  /**
   * Clear failed attempt counts.
   */
  clearFailedAttempts(userId: string): void {
    if (!userId) return;
    try {
      sessionStorage.removeItem(`${STORAGE_PREFIX}_attempts_${userId}`);
    } catch {}
  },
};
