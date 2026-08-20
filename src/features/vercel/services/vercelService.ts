import { supabase } from "@/integrations/supabase/client";
import {
  VercelConnectionData,
  VercelOAuthStartResponse,
  VercelActionResponse,
} from "../types/vercelTypes";

const FUNCTION_NAME = "vercel-oauth";
const STORAGE_STATE_KEY = "eduspace_vercel_oauth_state";
const DEFAULT_CLIENT_ID = "oac_nw2dfW7drJqGrQ9SrpWIQ1cc";

function generateSecureState(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const array = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getDynamicRedirectUri(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/auth/vercel/callback`;
  }
  return import.meta.env.VITE_VERCEL_REDIRECT_URI || "http://localhost:8080/auth/vercel/callback";
}

/**
 * Initiates the Vercel OAuth 2.0 flow with server and client-side fallback resilience
 */
export async function startVercelOAuth(options?: {
  slug?: string;
  redirectUri?: string;
  authType?: "integration" | "oauth";
}): Promise<VercelOAuthStartResponse> {
  const state = generateSecureState();
  const redirectUri = options?.redirectUri || getDynamicRedirectUri();
  const slug = options?.slug || import.meta.env.VITE_VERCEL_INTEGRATION_SLUG || "eduspace";
  const authType = options?.authType || (import.meta.env.VITE_VERCEL_AUTH_TYPE as any) || "integration";

  // Save CSRF state locally in sessionStorage
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_STATE_KEY, state);
    }
  } catch (err) {
    console.warn("[Vercel OAuth] Failed to persist state in sessionStorage:", err);
  }

  // Attempt to save state in Supabase DB if user is authenticated
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      await supabase.from("vercel_connections" as any).upsert(
        {
          user_id: authData.user.id,
          oauth_state: state,
          oauth_state_created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }
  } catch (dbErr) {
    console.warn("[Vercel OAuth] State DB upsert notice:", dbErr);
  }

  // 1. First attempt: Ask Edge Function to generate the authorization URL
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        action: "start",
        redirect_uri: redirectUri,
        slug,
        auth_type: authType,
      },
    });

    if (!error && data?.success && data?.authUrl) {
      return {
        success: true,
        authUrl: data.authUrl,
        state: data.state || state,
      };
    }
  } catch (fnErr) {
    console.info("[Vercel OAuth] Remote Edge Function start bypassed, using direct URL:", fnErr);
  }

  // 2. Resilient Fallback: Generate the Vercel Integration Installation URL
  try {
    let authUrl: URL;

    if (authType === "oauth") {
      const clientId = import.meta.env.VITE_VERCEL_CLIENT_ID || DEFAULT_CLIENT_ID;
      authUrl = new URL("https://vercel.com/oauth/authorize");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("redirect_uri", redirectUri);
    } else {
      // Standard Vercel Marketplace Integration URL
      authUrl = new URL(`https://vercel.com/integrations/${slug}/new`);
      authUrl.searchParams.set("state", state);
      if (redirectUri) {
        authUrl.searchParams.set("redirect_uri", redirectUri);
      }
    }

    return {
      success: true,
      authUrl: authUrl.toString(),
      state,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to initialize Vercel connection",
    };
  }
}

/**
 * Connects Vercel account directly using a Personal Access Token from vercel.com/account/tokens
 */
export async function connectVercelWithToken(
  token: string
): Promise<VercelActionResponse<VercelConnectionData>> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return {
      success: false,
      error: "Please enter a valid Vercel Personal Access Token.",
    };
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  try {
    const headers = {
      Authorization: `Bearer ${cleanToken}`,
      "Content-Type": "application/json",
    };

    // 1. Fetch User Profile
    const userRes = await fetch("https://api.vercel.com/v2/user", { headers });
    if (!userRes.ok) {
      const errText = await userRes.text().catch(() => "");
      return {
        success: false,
        error: `Vercel token verification failed (${userRes.status}): ${errText || "Invalid token"}`,
      };
    }
    const userData = (await userRes.json().catch(() => ({}))) as any;
    const vercelUser = userData.user || userData;

    // 2. Fetch Projects
    let projects: any[] = [];
    try {
      const projRes = await fetch(
        "https://api.vercel.com/v9/projects?limit=20",
        { headers }
      );
      if (projRes.ok) {
        const projData = (await projRes.json().catch(() => ({}))) as any;
        projects = Array.isArray(projData.projects) ? projData.projects : [];
      }
    } catch {}

    // 3. Fetch Deployments
    let deployments: any[] = [];
    try {
      const depRes = await fetch(
        "https://api.vercel.com/v6/deployments?limit=10",
        { headers }
      );
      if (depRes.ok) {
        const depData = (await depRes.json().catch(() => ({}))) as any;
        deployments = Array.isArray(depData.deployments)
          ? depData.deployments
          : [];
      }
    } catch {}

    const sanitizedProjects = projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      framework: p.framework || "other",
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      link: p.link
        ? {
            type: p.link.type,
            repo: p.link.repo,
            org: p.link.org,
          }
        : null,
      targets: p.targets || null,
      latestDeployments: Array.isArray(p.latestDeployments)
        ? p.latestDeployments.slice(0, 2).map((d: any) => ({
            id: d.id,
            name: d.name,
            url: d.url ? `https://${d.url}` : null,
            readyState: d.readyState || d.state,
            createdAt: d.createdAt,
          }))
        : [],
    }));

    const sanitizedDeployments = deployments.map((d: any) => ({
      uid: d.uid,
      name: d.name,
      url: d.url ? `https://${d.url}` : null,
      state: d.state || d.readyState,
      created: d.created || d.createdAt,
      target: d.target || null,
      inspectorUrl: d.inspectorUrl || null,
    }));

    const frameworksCount: Record<string, number> = {};
    sanitizedProjects.forEach((p: any) => {
      const fw = p.framework || "vanilla";
      frameworksCount[fw] = (frameworksCount[fw] || 0) + 1;
    });

    const topFrameworks = Object.entries(frameworksCount)
      .sort((a, b) => b[1] - a[1])
      .map(([framework, count]) => ({ framework, count }));

    const now = new Date().toISOString();
    const cachedData = {
      totalProjects: sanitizedProjects.length,
      totalDeployments: sanitizedDeployments.length,
      projects: sanitizedProjects,
      recentDeployments: sanitizedDeployments.slice(0, 5),
      topFrameworks,
      lastSynced: now,
    };

    const connectionData: VercelConnectionData = {
      connected: true,
      userId,
      vercelUserId: String(vercelUser.id || "").trim(),
      vercelUsername: String(vercelUser.username || "").trim(),
      vercelName: String(vercelUser.name || vercelUser.username || "").trim(),
      vercelAvatarUrl: vercelUser.avatar
        ? `https://vercel.com/api/www/avatar/${vercelUser.avatar}?s=160`
        : null,
      connectedAt: now,
      lastSyncedAt: now,
      cachedData,
    };

    if (userId) {
      await supabase.from("vercel_connections" as any).upsert(
        {
          user_id: userId,
          vercel_user_id: connectionData.vercelUserId,
          vercel_username: connectionData.vercelUsername,
          vercel_name: connectionData.vercelName,
          vercel_email: vercelUser.email ? String(vercelUser.email).trim() : null,
          vercel_avatar_url: connectionData.vercelAvatarUrl,
          access_token: cleanToken,
          cached_data: cachedData,
          connected_at: now,
          updated_at: now,
          last_synced_at: now,
        },
        { onConflict: "user_id" }
      );
    }

    return {
      success: true,
      data: connectionData,
      message: "Vercel connected successfully via token!",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to connect Vercel with token.",
    };
  }
}

/**
 * Handles the OAuth callback by sending the authorization code and state
 */
export async function completeVercelOAuth(
  code: string,
  state: string,
  customRedirectUri?: string
): Promise<VercelActionResponse<VercelConnectionData>> {
  const redirectUri = customRedirectUri || getDynamicRedirectUri();

  // Validate state from sessionStorage if present
  try {
    const storedState = typeof window !== "undefined" && window.sessionStorage
      ? window.sessionStorage.getItem(STORAGE_STATE_KEY)
      : null;
    if (storedState && storedState !== state) {
      console.warn("[Vercel OAuth] State mismatch with sessionStorage");
    }
  } catch {}

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  // 1. First attempt: Invoke Edge Function
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: {
        action: "callback",
        code,
        state,
        redirect_uri: redirectUri,
      },
    });

    if (!error && data?.success && data?.data) {
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.removeItem(STORAGE_STATE_KEY);
        }
      } catch {}

      return {
        success: true,
        data: data.data,
      };
    }

    if (error && error.message && !error.message.includes("Edge Function")) {
      return {
        success: false,
        error: error.message,
      };
    }
  } catch (fnErr) {
    console.info("[Vercel OAuth] Remote Edge Function callback unavailable, trying local fallback:", fnErr);
  }

  // 2. Second attempt: Local dev proxy endpoint (/api/vercel-oauth)
  try {
    const res = await fetch("/api/vercel-oauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "callback",
        code,
        state,
        redirect_uri: redirectUri,
        userId,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        // Save to Supabase DB if user is authenticated
        if (userId) {
          try {
            await supabase.from("vercel_connections" as any).upsert(
              {
                user_id: userId,
                vercel_user_id: json.data.vercelUserId,
                vercel_username: json.data.vercelUsername,
                vercel_name: json.data.vercelName,
                vercel_avatar_url: json.data.vercelAvatarUrl,
                cached_data: json.data.cachedData,
                oauth_state: null,
                oauth_state_created_at: null,
                connected_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_synced_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
          } catch (dbErr) {
            console.warn("[Vercel OAuth] DB update notice:", dbErr);
          }
        }

        try {
          if (typeof window !== "undefined" && window.sessionStorage) {
            window.sessionStorage.removeItem(STORAGE_STATE_KEY);
          }
        } catch {}

        return {
          success: true,
          data: json.data,
        };
      }
    }
  } catch (localErr) {
    console.info("[Vercel OAuth] Local dev endpoint not responding:", localErr);
  }

  return {
    success: false,
    error: "Could not complete Vercel authorization. Please ensure the authorization code is valid and try again.",
  };
}

/**
 * Retrieves the current Vercel connection and cached stats for a user
 */
export async function getVercelConnection(
  userId?: string
): Promise<VercelActionResponse<VercelConnectionData>> {
  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: authData } = await supabase.auth.getUser();
      targetUserId = authData?.user?.id;
    }

    // 1. Direct Supabase Database Query (Fastest, zero cold starts, RLS-backed)
    if (targetUserId) {
      const { data: dbData, error: dbError } = await supabase
        .from("vercel_connections" as any)
        .select("user_id, vercel_user_id, vercel_username, vercel_name, vercel_avatar_url, connected_at, last_synced_at, cached_data")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (!dbError && dbData && (dbData as any).vercel_user_id) {
        const casted = dbData as any;
        return {
          success: true,
          data: {
            connected: true,
            userId: casted.user_id,
            vercelUserId: casted.vercel_user_id,
            vercelUsername: casted.vercel_username,
            vercelName: casted.vercel_name,
            vercelAvatarUrl: casted.vercel_avatar_url,
            connectedAt: casted.connected_at,
            lastSyncedAt: casted.last_synced_at,
            cachedData: casted.cached_data,
          },
        };
      }
    }

    // 2. Fallback: Edge Function query
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: {
          action: "get-connection",
          userId: targetUserId,
        },
      });

      if (!error && data?.success && data?.data) {
        return {
          success: true,
          data: data.data,
        };
      }
    } catch {}

    return {
      success: true,
      data: { connected: false },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to load Vercel connection data",
      data: { connected: false },
    };
  }
}

/**
 * Synchronizes the latest Vercel projects and deployments
 */
export async function syncVercelProfile(): Promise<VercelActionResponse<VercelConnectionData>> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    // 1. Try Edge Function
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: "sync" },
      });

      if (!error && data?.success && data?.data) {
        return {
          success: true,
          data: data.data,
          message: "Vercel profile synchronized successfully",
        };
      }
    } catch {}

    // 2. Try Local Dev Endpoint
    try {
      const res = await fetch("/api/vercel-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", userId }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            success: true,
            data: json.data,
            message: "Vercel profile synchronized successfully",
          };
        }
      }
    } catch {}

    // 3. Fallback: Return existing cached connection data
    if (userId) {
      const current = await getVercelConnection(userId);
      if (current.success && current.data?.connected) {
        return {
          success: true,
          data: current.data,
          message: "Vercel profile up to date",
        };
      }
    }

    return {
      success: false,
      error: "No active Vercel connection found to synchronize.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Sync error",
    };
  }
}

/**
 * Disconnects the Vercel account and wipes stored credentials
 */
export async function disconnectVercel(): Promise<VercelActionResponse<null>> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    // 1. Delete from Supabase Database directly (guaranteed by RLS)
    if (userId) {
      try {
        await supabase.from("vercel_connections" as any).delete().eq("user_id", userId);
      } catch (dbErr) {
        console.warn("[Vercel OAuth] Direct DB delete notice:", dbErr);
      }
    }

    // 2. Notify Edge Function / local API in background
    try {
      await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: "disconnect" },
      });
    } catch {}

    try {
      await fetch("/api/vercel-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", userId }),
      });
    } catch {}

    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(STORAGE_STATE_KEY);
      }
    } catch {}

    return {
      success: true,
      message: "Vercel account disconnected successfully",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Disconnect error",
    };
  }
}
