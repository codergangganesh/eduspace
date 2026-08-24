import { supabase } from "@/lib/supabase";

export interface MfaFactor {
  id: string;
  friendly_name: string;
  factor_type: "totp" | "webauthn" | string;
  status: "verified" | "unverified";
  created_at: string;
  updated_at: string;
}

export interface TotpEnrollmentData {
  id: string;
  type: "totp";
  totp: {
    qr_code: string; // SVG or data URL
    secret: string;
    uri: string;
  };
}

export const mfaService = {
  /**
   * Check if the user has completed MFA (AAL2) or needs an MFA challenge.
   */
  async getAssuranceLevel(): Promise<{
    currentLevel: string | null;
    nextLevel: string | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) {
        return { currentLevel: null, nextLevel: null, error: error.message };
      }
      return {
        currentLevel: (data?.currentLevel as string) || null,
        nextLevel: (data?.nextLevel as string) || null,
        error: null,
      };
    } catch (err: any) {
      return { currentLevel: null, nextLevel: null, error: err.message || "Failed to check MFA status" };
    }
  },

  /**
   * List all registered MFA factors for the currently authenticated admin.
   */
  async listFactors(): Promise<{
    totpFactors: MfaFactor[];
    allFactors: MfaFactor[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        return { totpFactors: [], allFactors: [], error: error.message };
      }

      const all: MfaFactor[] = (data?.all || []).map((f: any) => ({
        id: f.id,
        friendly_name: f.friendly_name || "Authenticator App",
        factor_type: f.factor_type,
        status: f.status as "verified" | "unverified",
        created_at: f.created_at || new Date().toISOString(),
        updated_at: f.updated_at || new Date().toISOString(),
      }));

      const totp = all.filter((f) => f.factor_type === "totp");

      return { totpFactors: totp, allFactors: all, error: null };
    } catch (err: any) {
      return { totpFactors: [], allFactors: [], error: err.message || "Failed to list MFA factors" };
    }
  },

  /**
   * Begin TOTP enrollment (Generates QR Code & Secret Key).
   * Automatically cleans up any stale unverified attempts and resolves friendly name conflicts.
   */
  async enrollTOTP(friendlyName?: string): Promise<{
    data: TotpEnrollmentData | null;
    error: string | null;
  }> {
    try {
      // Step 1: Clean up any stale unverified factors from past incomplete attempts
      try {
        const { data: factorData } = await supabase.auth.mfa.listFactors();
        if (factorData?.all) {
          const unverified = factorData.all.filter((f: any) => f.factor_type === "totp" && f.status === "unverified");
          for (const stale of unverified) {
            await supabase.auth.mfa.unenroll({ factorId: stale.id });
          }
        }
      } catch (_) {}

      // Step 2: Attempt enrollment with base friendly name
      const baseName = friendlyName?.trim() || "Google Authenticator";
      let nameToUse = baseName;

      let res = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: nameToUse,
      });

      // Step 3: If friendly name conflict occurs, append unique timestamp and retry
      if (res.error && res.error.message.toLowerCase().includes("already exists")) {
        const timeTag = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        nameToUse = `${baseName} (${timeTag})`;
        res = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: nameToUse,
        });
      }

      if (res.error) {
        return { data: null, error: res.error.message };
      }

      return { data: res.data as TotpEnrollmentData, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || "Failed to start TOTP enrollment" };
    }
  },

  /**
   * Verify and activate an enrolled TOTP factor using the 6-digit code from the authenticator app.
   */
  async verifyEnrollment(factorId: string, code: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const cleanCode = code.replace(/\s+/g, "").trim();
      if (!/^\d{6}$/.test(cleanCode)) {
        return { success: false, error: "Verification code must be 6 digits." };
      }

      const { error: challengeErr, data: challengeData } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeErr || !challengeData) {
        return { success: false, error: challengeErr?.message || "Failed to create verification challenge." };
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: cleanCode,
      });

      if (verifyErr) {
        return { success: false, error: verifyErr.message || "Invalid 6-digit verification code." };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to verify authenticator code." };
    }
  },

  /**
   * Challenge and verify TOTP code during sign-in (elevates session from AAL1 to AAL2).
   */
  async challengeAndVerify(factorId: string, code: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const cleanCode = code.replace(/\s+/g, "").trim();
      if (!/^\d{6}$/.test(cleanCode)) {
        return { success: false, error: "Please enter a valid 6-digit code." };
      }

      const { error: challengeErr, data: challengeData } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeErr || !challengeData) {
        return { success: false, error: challengeErr?.message || "Failed to initiate 2FA challenge." };
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: cleanCode,
      });

      if (verifyErr) {
        return { success: false, error: verifyErr.message || "Invalid 6-digit 2FA code." };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to verify 2FA challenge." };
    }
  },

  /**
   * Remove/Unenroll an MFA factor.
   */
  async unenrollFactor(factorId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to remove authenticator." };
    }
  },
};
