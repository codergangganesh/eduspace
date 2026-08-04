// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { getCorsHeaders, corsPreflightResponse } from "../shared/cors.ts";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_PROFILE_URL = "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,headline,vanityName,profilePicture(displayImage~:playableStreams))";
const LINKEDIN_EMAIL_URL = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))";
const OAUTH_STATE_TTL_MS = 1000 * 60 * 20; // 20 minutes

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(new Request("")), "Content-Type": "application/json" },
  });
}

function htmlResponse(status: number, body: string) {
  return new Response(body, {
    status,
    headers: { ...getCorsHeaders(new Request("")), "Content-Type": "text/html; charset=utf-8" },
  });
}

function generateState() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function selectBestProfileImage(profilePicture: any): string | null {
  if (!profilePicture?.['displayImage~']?.elements?.length) {
    return null;
  }

  const elements = profilePicture['displayImage~'].elements;
  const sorted = [...elements].sort((a, b) => {
    const aWidth = Array.isArray(a.identifiers) && a.identifiers[0]?.height ? Number(a.identifiers[0].height) : 0;
    const bWidth = Array.isArray(b.identifiers) && b.identifiers[0]?.height ? Number(b.identifiers[0].height) : 0;
    return bWidth - aWidth;
  });

  const identifier = sorted[0]?.identifiers?.[0]?.identifier;
  return typeof identifier === "string" ? identifier : null;
}

function buildProfileUrl(vanityName: string | null | undefined, userId: string | null | undefined) {
  if (vanityName) {
    return `https://www.linkedin.com/in/${encodeURIComponent(vanityName)}/`;
  }
  if (userId) {
    return `https://www.linkedin.com/in/${encodeURIComponent(userId)}/`;
  }
  return null;
}

async function fetchLinkedInProfile(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const profileResponse = await fetch(LINKEDIN_PROFILE_URL, { headers });
  if (!profileResponse.ok) {
    const body = await profileResponse.text();
    throw new Error(`LinkedIn profile fetch failed: ${profileResponse.status} ${body}`);
  }

  const profileJson = await profileResponse.json();
  const emailResponse = await fetch(LINKEDIN_EMAIL_URL, { headers });
  let email: string | null = null;

  if (emailResponse.ok) {
    const emailJson = await emailResponse.json();
    email = String(emailJson?.elements?.[0]?.['handle~']?.emailAddress || "").trim() || null;
  }

  const firstName = String(profileJson.localizedFirstName || "").trim();
  const lastName = String(profileJson.localizedLastName || "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || null;
  const headline = String(profileJson.headline || "").trim() || null;
  const profileUrl = buildProfileUrl(profileJson.vanityName, profileJson.id);
  const avatarUrl = selectBestProfileImage(profileJson.profilePicture) || null;

  return {
    linkedinUserId: String(profileJson.id || "").trim() || null,
    profileUrl,
    name,
    headline,
    email,
    avatarUrl,
    rawProfile: profileJson,
  };
}

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const tokenBody = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });

  const tokenJson = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenJson.access_token) {
    throw new Error(`LinkedIn refresh token exchange failed: ${JSON.stringify(tokenJson)}`);
  }

  const accessToken = String(tokenJson.access_token || "").trim();
  const refresh = tokenJson.refresh_token ? String(tokenJson.refresh_token).trim() : refreshToken;
  const expiresAt = tokenJson.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString() : null;

  return { accessToken, refreshToken: refresh, expiresAt };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsPreflightResponse(req);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const clientId = Deno.env.get("LINKEDIN_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET") ?? "";
  const redirectUri = Deno.env.get("LINKEDIN_REDIRECT_URI") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRole || !clientId || !clientSecret || !redirectUri) {
    return jsonResponse(500, { success: false, error: "Server misconfiguration: LinkedIn environment variables are missing." });
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const serviceClient = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === "POST") {
    const authHeader = req.headers.get("Authorization");
    const bearer = parseBearerToken(authHeader);
    if (!bearer) {
      return jsonResponse(401, { success: false, error: "Unauthorized" });
    }

    const { data: authData, error: authError } = await anonClient.auth.getUser(bearer);
    if (authError || !authData.user) {
      return jsonResponse(401, { success: false, error: authError?.message || "Invalid auth token" });
    }

    const userId = authData.user.id;
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "").trim();

    if (action === "start") {
      const state = generateState();
      const authUrl = new URL(LINKEDIN_AUTH_URL);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", "r_liteprofile r_emailaddress");
      authUrl.searchParams.set("state", state);

      await serviceClient.from("user_coding_profiles").upsert(
        {
          user_id: userId,
          linkedin_oauth_state: state,
          linkedin_oauth_state_created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      return jsonResponse(200, { success: true, authUrl: authUrl.toString() });
    }

    if (action === "sync") {
      const { data: record, error: fetchError } = await anonClient
        .from("user_coding_profiles")
        .select("linkedin_access_token, linkedin_refresh_token, linkedin_token_expires_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        return jsonResponse(500, { success: false, error: fetchError.message });
      }

      let accessToken = String(record?.linkedin_access_token || "").trim();
      let refreshToken = record?.linkedin_refresh_token ? String(record.linkedin_refresh_token).trim() : null;
      let tokenExpiresAt = record?.linkedin_token_expires_at || null;

      if (!accessToken && !refreshToken) {
        return jsonResponse(400, { success: false, error: "No active LinkedIn connection found." });
      }

      try {
        // Try with existing access token first
        let profile;
        try {
          profile = await fetchLinkedInProfile(accessToken);
        } catch (innerErr) {
          // If fetch failed and we have a refresh token, attempt to refresh
          if (refreshToken) {
            try {
              const refreshed = await refreshAccessToken(refreshToken, clientId, clientSecret);
              accessToken = refreshed.accessToken;
              refreshToken = refreshed.refreshToken;
              tokenExpiresAt = refreshed.expiresAt;

              // persist refreshed tokens
              await serviceClient.from("user_coding_profiles").update({
                linkedin_access_token: accessToken,
                linkedin_refresh_token: refreshToken,
                linkedin_token_expires_at: tokenExpiresAt,
                updated_at: new Date().toISOString(),
              }).eq("user_id", userId);

              // retry profile fetch with refreshed token
              profile = await fetchLinkedInProfile(accessToken);
            } catch (refreshErr) {
              const msg = refreshErr instanceof Error ? refreshErr.message : String(refreshErr);
              return jsonResponse(500, { success: false, error: `Token refresh failed: ${msg}` });
            }
          } else {
            const msg = innerErr instanceof Error ? innerErr.message : String(innerErr);
            return jsonResponse(500, { success: false, error: msg });
          }
        }

        const now = new Date().toISOString();
        const linkedInData = {
          username: profile.linkedinUserId || "",
          profileUrl: profile.profileUrl,
          name: profile.name,
          headline: profile.headline,
          summary: null,
          location: null,
          industry: null,
          currentCompany: null,
          avatarUrl: profile.avatarUrl,
          website: null,
          email: profile.email,
          last_updated: now,
        };

        await serviceClient.from("user_coding_profiles").update({
          linkedin_user_id: profile.linkedinUserId,
          linkedin_access_token: accessToken || null,
          linkedin_refresh_token: refreshToken || null,
          linkedin_token_expires_at: tokenExpiresAt || null,
          linkedin_data: linkedInData,
          linkedin_error: null,
          linkedin_connected_at: now,
          linkedin_last_synced_at: now,
          linkedin_username: profile.profileUrl,
          linkedin_oauth_state: null,
          linkedin_oauth_state_created_at: null,
          updated_at: now,
        }).eq("user_id", userId);

        return jsonResponse(200, { success: true, data: linkedInData });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResponse(500, { success: false, error: message });
      }
    }

    if (action === "disconnect") {
      await serviceClient.from("user_coding_profiles").update({
        linkedin_user_id: null,
        linkedin_access_token: null,
        linkedin_refresh_token: null,
        linkedin_token_expires_at: null,
        linkedin_connected_at: null,
        linkedin_last_synced_at: null,
        linkedin_data: null,
        linkedin_error: null,
        linkedin_oauth_state: null,
        linkedin_oauth_state_created_at: null,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);

      return jsonResponse(200, { success: true });
    }

    if (action === "callback") {
      const code = String(body?.code || "").trim();
      const state = String(body?.state || "").trim();

      if (!code || !state) {
        return jsonResponse(400, { success: false, error: "Missing authorization code or state." });
      }

      const { data: record, error: stateError } = await serviceClient
        .from("user_coding_profiles")
        .select("user_id, linkedin_oauth_state_created_at")
        .eq("linkedin_oauth_state", state)
        .maybeSingle();

      if (stateError) {
        return jsonResponse(500, { success: false, error: stateError.message });
      }
      if (!record || !record.user_id) {
        return jsonResponse(400, { success: false, error: "Invalid or expired LinkedIn OAuth state." });
      }

      const createdAt = record.linkedin_oauth_state_created_at ? new Date(record.linkedin_oauth_state_created_at).getTime() : 0;
      if (!createdAt || Date.now() - createdAt > OAUTH_STATE_TTL_MS) {
        return jsonResponse(400, { success: false, error: "LinkedIn OAuth state has expired. Please try connecting again." });
      }

      const tokenBody = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody.toString(),
      });

      const tokenJson = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenJson.access_token) {
        return jsonResponse(500, { success: false, error: `LinkedIn token exchange failed: ${JSON.stringify(tokenJson)}` });
      }

      const accessToken = String(tokenJson.access_token || "").trim();
      const refreshToken = tokenJson.refresh_token ? String(tokenJson.refresh_token).trim() : null;
      const expiresAt = tokenJson.expires_in ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString() : null;

      try {
        const profile = await fetchLinkedInProfile(accessToken);
        const now = new Date().toISOString();
        const linkedInData = {
          username: profile.linkedinUserId || "",
          profileUrl: profile.profileUrl,
          name: profile.name,
          headline: profile.headline,
          summary: null,
          location: null,
          industry: null,
          currentCompany: null,
          avatarUrl: profile.avatarUrl,
          website: null,
          email: profile.email,
          last_updated: now,
        };

        await serviceClient.from("user_coding_profiles").upsert(
          {
            user_id: record.user_id,
            linkedin_user_id: profile.linkedinUserId,
            linkedin_access_token: accessToken,
            linkedin_refresh_token: refreshToken,
            linkedin_token_expires_at: expiresAt,
            linkedin_connected_at: now,
            linkedin_last_synced_at: now,
            linkedin_data: linkedInData,
            linkedin_error: null,
            linkedin_username: profile.profileUrl,
            linkedin_oauth_state: null,
            linkedin_oauth_state_created_at: null,
            updated_at: now,
          },
          { onConflict: "user_id" }
        );

        return jsonResponse(200, { success: true, data: linkedInData });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResponse(500, { success: false, error: message });
      }
    }

    return jsonResponse(400, { success: false, error: "Unknown action" });
  }

  return jsonResponse(405, { success: false, error: "Method not allowed" });
});
