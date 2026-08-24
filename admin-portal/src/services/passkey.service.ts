import { supabase } from "@/lib/supabase";

export interface PasskeyFactor {
  id: string;
  friendly_name: string;
  factor_type: "webauthn" | string;
  status: "verified" | "unverified";
  created_at: string;
  updated_at: string;
}

/**
 * Checks if the current browser and platform support WebAuthn / Passkeys.
 */
export const isPasskeySupported = (): boolean => {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
  );
};

/**
 * Checks if a biometric or platform authenticator (Touch ID, Windows Hello, Face ID) is available.
 */
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isPasskeySupported()) return false;
  try {
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Suggest a friendly name for the passkey based on user agent.
 */
export const getSuggestedPasskeyName = (): string => {
  if (typeof navigator === "undefined") return "Security Key";
  const ua = navigator.userAgent;

  if (/iPhone|iPad/i.test(ua)) return "Apple Device (Face/Touch ID)";
  if (/Macintosh/i.test(ua)) return "Mac (Touch ID / Passkey)";
  if (/Android/i.test(ua)) return "Google Password Manager (Android)";
  if (/Windows/i.test(ua)) return "Google Password Manager (Windows Hello)";
  if (/Linux/i.test(ua)) return "Linux Security Key";
  return "Google Password Manager / Passkey";
};

export const passkeyService = {
  /**
   * List all enrolled Passkeys for the currently authenticated admin.
   */
  async listPasskeys(): Promise<{ data: PasskeyFactor[] | null; error: string | null }> {
    try {
      const auth = supabase.auth as any;

      // 1. Try native Passkey list API
      if (typeof auth._listPasskeys === "function") {
        const res = await auth._listPasskeys();
        if (!res?.error && Array.isArray(res?.data)) {
          const formatted: PasskeyFactor[] = res.data.map((p: any) => ({
            id: p.id,
            friendly_name: p.friendly_name || p.name || "Passkey",
            factor_type: "webauthn",
            status: "verified",
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          }));
          return { data: formatted, error: null };
        }
      }

      // 2. Direct HTTP GET /auth/v1/passkeys
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (accessToken) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/auth/v1/passkeys`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        });
        if (res.ok) {
          const passkeysList = await res.json();
          if (Array.isArray(passkeysList)) {
            const formatted: PasskeyFactor[] = passkeysList.map((p: any) => ({
              id: p.id,
              friendly_name: p.friendly_name || p.name || "Passkey",
              factor_type: "webauthn",
              status: "verified",
              created_at: p.created_at || new Date().toISOString(),
              updated_at: p.updated_at || new Date().toISOString(),
            }));
            return { data: formatted, error: null };
          }
        }
      }

      // 3. Fallback to MFA listFactors if any
      const { data: mfaData } = await supabase.auth.mfa.listFactors();
      if (mfaData?.all) {
        const webauthnFactors: PasskeyFactor[] = (mfaData.all || [])
          .filter((f: any) => f.factor_type === "webauthn" || f.factor_type === "passkey")
          .map((f: any) => ({
            id: f.id,
            friendly_name: f.friendly_name || "Passkey",
            factor_type: f.factor_type,
            status: f.status as "verified" | "unverified",
            created_at: f.created_at,
            updated_at: f.updated_at,
          }));
        return { data: webauthnFactors, error: null };
      }

      return { data: [], error: null };
    } catch (err: any) {
      return { data: null, error: err.message || "Failed to list passkeys" };
    }
  },

  /**
   * Register and enroll a new WebAuthn / Passkey credential for the current user.
   */
  async registerPasskey(friendlyName?: string): Promise<{ data: any; error: string | null }> {
    if (!isPasskeySupported()) {
      return { data: null, error: "WebAuthn / Passkeys are not supported by this browser." };
    }

    const auth = supabase.auth as any;

    try {
      // 1. Try SDK native Passkey registration API
      if (typeof auth.registerPasskey === "function") {
        const res = await auth.registerPasskey();
        if (res?.error) {
          const msg = res.error.message || "";
          if (msg.toLowerCase().includes("domain") || msg.toLowerCase().includes("origin") || msg.toLowerCase().includes("relying party")) {
            return {
              data: null,
              error: `Domain mismatch: Supabase Relying Party ID is set for a different domain than '${window.location.hostname}'. If testing locally, set RP ID to 'localhost' in Supabase Dashboard.`,
            };
          }
          return { data: null, error: msg || "Passkey registration failed." };
        }
        if (res?.data) {
          return { data: res.data, error: null };
        }
      }

      // 2. Direct WebAuthn Ceremony Fallback
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (accessToken) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Step A: Request challenge options from Supabase
        const optionsRes = await fetch(`${supabaseUrl}/auth/v1/passkeys/registration/options`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey,
          },
          body: JSON.stringify({}),
        });

        if (!optionsRes.ok) {
          const errBody = await optionsRes.json().catch(() => ({}));
          const errMsg = errBody?.msg || errBody?.message || errBody?.error_description || "";
          if (errMsg.toLowerCase().includes("domain") || errMsg.toLowerCase().includes("origin") || errMsg.toLowerCase().includes("relying party") || optionsRes.status === 400) {
            return {
              data: null,
              error: `Domain mismatch: Supabase Relying Party is configured for a different domain than '${window.location.hostname}'. If testing on localhost, set Relying Party ID to 'localhost' in Supabase Dashboard.`,
            };
          }
          return { data: null, error: errMsg || "Failed to start passkey registration." };
        }

        const optionsData = await optionsRes.json();
        const serverOptions = optionsData.options || optionsData;
        const challengeId = optionsData.challenge_id;

        // Step B: Prompt user via browser WebAuthn API
        let publicKey: any;
        if (typeof (PublicKeyCredential as any)?.parseCreationOptionsFromJSON === "function") {
          publicKey = (PublicKeyCredential as any).parseCreationOptionsFromJSON(serverOptions);
        } else {
          publicKey = serverOptions;
        }

        const credential = (await navigator.credentials.create({ publicKey })) as any;
        if (!credential) {
          return { data: null, error: "WebAuthn ceremony failed to generate credential." };
        }

        const serializedCredential = typeof credential.toJSON === "function"
          ? credential.toJSON()
          : {
              id: credential.id,
              rawId: credential.id,
              type: credential.type,
              response: {
                clientDataJSON: credential.response.clientDataJSON,
                attestationObject: credential.response.attestationObject,
              },
            };

        // Step C: Verify registration with Supabase
        const verifyRes = await fetch(`${supabaseUrl}/auth/v1/passkeys/registration/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey,
          },
          body: JSON.stringify({
            challenge_id: challengeId,
            credential: serializedCredential,
            friendly_name: friendlyName?.trim() || getSuggestedPasskeyName(),
          }),
        });

        if (!verifyRes.ok) {
          const errBody = await verifyRes.json().catch(() => ({}));
          return { data: null, error: errBody?.msg || errBody?.message || "Failed to verify passkey." };
        }

        const verifyData = await verifyRes.json();
        return { data: verifyData, error: null };
      }

      return { data: null, error: "Active session required to register a passkey." };
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        return { data: null, error: "Passkey registration was cancelled or timed out." };
      }
      if (err.name === "InvalidStateError") {
        return { data: null, error: "This passkey device has already been registered." };
      }
      return { data: null, error: err.message || "An unexpected error occurred while registering passkey." };
    }
  },

  /**
   * Delete / Unenroll a registered passkey factor.
   */
  async removePasskey(factorId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const auth = supabase.auth as any;

      // 1. Try native _deletePasskey API
      if (typeof auth._deletePasskey === "function") {
        const res = await auth._deletePasskey({ passkeyId: factorId });
        if (!res?.error) return { success: true, error: null };
      }

      // 2. Direct HTTP DELETE /auth/v1/passkeys/{id}
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (accessToken) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/auth/v1/passkeys/${factorId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        });
        if (res.ok || res.status === 200 || res.status === 204) {
          return { success: true, error: null };
        }
      }

      // 3. Fallback to MFA unenroll
      const { error: mfaError } = await supabase.auth.mfa.unenroll({ factorId });
      if (!mfaError) {
        return { success: true, error: null };
      }

      return { success: false, error: mfaError.message || "Failed to remove passkey." };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to remove passkey." };
    }
  },

  /**
   * Authenticate using a registered WebAuthn / Passkey credential.
   */
  async authenticateWithPasskey(factorId?: string): Promise<{ data: any; error: string | null }> {
    try {
      const auth = supabase.auth as any;

      // 1. Try native signInWithPasskey (discoverable credentials)
      if (typeof auth.signInWithPasskey === "function") {
        const res = await auth.signInWithPasskey();
        if (!res?.error && res?.data) {
          return { data: res.data, error: null };
        }
      }

      // 2. If factorId provided, authenticate via MFA WebAuthn
      if (factorId && auth.mfa?.webauthn?._authenticate) {
        const rpId = window.location.hostname;
        const res = await auth.mfa.webauthn._authenticate({
          factorId,
          webauthn: {
            rpId,
            rpOrigins: [window.location.origin],
          },
        });

        if (res.error) {
          return { data: null, error: res.error.message };
        }
        return { data: res.data, error: null };
      }

      return { data: null, error: "Passkey authentication ceremony failed." };
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        return { data: null, error: "Passkey verification was cancelled." };
      }
      return { data: null, error: err.message || "Passkey authentication failed." };
    }
  },
};
