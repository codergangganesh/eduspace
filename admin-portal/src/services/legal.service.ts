export interface ConsentRecord {
  userId: string;
  email: string;
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent: string;
}

export const LEGAL_VERSIONS = {
  TERMS: "2026.1",
  PRIVACY: "2026.1",
  LAST_UPDATED: "March 15, 2026",
};

const CONSENT_STORAGE_PREFIX = "eduspace_legal_consent_";

/**
 * Checks if a user has accepted the latest terms and privacy policy versions.
 */
export function hasAcceptedCurrentAgreements(userId?: string | null): boolean {
  if (!userId) return false;
  try {
    const raw = localStorage.getItem(`${CONSENT_STORAGE_PREFIX}${userId}`);
    if (!raw) return false;
    const record: ConsentRecord = JSON.parse(raw);
    return (
      record.termsVersion === LEGAL_VERSIONS.TERMS &&
      record.privacyVersion === LEGAL_VERSIONS.PRIVACY &&
      Boolean(record.acceptedAt)
    );
  } catch (err) {
    console.error("Error reading legal consent record:", err);
    return false;
  }
}

/**
 * Retrieves the timestamped consent record for a user.
 */
export function getConsentRecord(userId?: string | null): ConsentRecord | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${CONSENT_STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Records timestamped consent for the current legal versions.
 */
export function recordAgreementConsent(userId: string, email: string): ConsentRecord {
  const record: ConsentRecord = {
    userId,
    email,
    termsVersion: LEGAL_VERSIONS.TERMS,
    privacyVersion: LEGAL_VERSIONS.PRIVACY,
    acceptedAt: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
  };

  try {
    localStorage.setItem(`${CONSENT_STORAGE_PREFIX}${userId}`, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent("eduspace:consent-updated", { detail: record }));
  } catch (err) {
    console.error("Failed to store legal consent record:", err);
  }

  return record;
}

/**
 * Clears legal consent for testing or account reset.
 */
export function revokeAgreementConsent(userId: string): void {
  try {
    localStorage.removeItem(`${CONSENT_STORAGE_PREFIX}${userId}`);
    window.dispatchEvent(new CustomEvent("eduspace:consent-updated", { detail: null }));
  } catch (_) {}
}

/**
 * Returns formatted acceptance date string or null if not accepted.
 */
export function getFormattedConsentDate(userId?: string | null): string | null {
  const record = getConsentRecord(userId);
  if (!record || !record.acceptedAt) return null;
  try {
    const d = new Date(record.acceptedAt);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    return record.acceptedAt;
  }
}
