// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { getCorsHeaders, corsPreflightResponse } from "../shared/cors.ts";

const VERCEL_AUTH_URL = "https://vercel.com/oauth/authorize";
const VERCEL_TOKEN_URL = "https://api.vercel.com/v2/oauth/access_token";
const VERCEL_USER_URL = "https://api.vercel.com/v2/user";
const VERCEL_PROJECTS_URL = "https://api.vercel.com/v9/projects";
const VERCEL_DEPLOYMENTS_URL = "https://api.vercel.com/v6/deployments";
const OAUTH_STATE_TTL_MS = 1000 * 60 * 20; // 20 minutes
const ALLOWED_ORIGINS = [
  'https://eduspaceacademy.online',
  'https://www.eduspaceacademy.online',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'https://apprehensible-freddy-nonconcordantly.ngrok-free.dev'
];

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function jsonResponse(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

function generateState(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function fetchVercelAccountData(accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // 1. Fetch User Profile
  const userRes = await fetch(VERCEL_USER_URL, { headers });
  if (!userRes.ok) {
    const errorBody = await userRes.text();
    throw new Error(`Vercel user fetch failed (${userRes.status}): ${errorBody}`);
  }
  const userData = await userRes.json();
  const vercelUser = userData.user || userData;

  // 2. Fetch Projects (limit 20)
  let projects: any[] = [];
  try {
    const projectsRes = await fetch(`${VERCEL_PROJECTS_URL}?limit=20`, { headers });
    if (projectsRes.ok) {
      const projectsData = await projectsRes.json();
      projects = Array.isArray(projectsData.projects) ? projectsData.projects : [];
    }
  } catch (err) {
    console.warn("Could not fetch Vercel projects:", err);
  }

  // 3. Fetch Recent Deployments (limit 10)
  let deployments: any[] = [];
  try {
    const depRes = await fetch(`${VERCEL_DEPLOYMENTS_URL}?limit=10`, { headers });
    if (depRes.ok) {
      const depData = await depRes.json();
      deployments = Array.isArray(depData.deployments) ? depData.deployments : [];
    }
  } catch (err) {
    console.warn("Could not fetch Vercel deployments:", err);
  }

  // 4. Summarize and Sanitize
  const sanitizedProjects = projects.map((p) => ({
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

  const sanitizedDeployments = deployments.map((d) => ({
    uid: d.uid,
    name: d.name,
    url: d.url ? `https://${d.url}` : null,
    state: d.state || d.readyState,
    created: d.created || d.createdAt,
    target: d.target || null,
    inspectorUrl: d.inspectorUrl || null,
  }));

  const frameworksCount: Record<string, number> = {};
  sanitizedProjects.forEach((p) => {
    const fw = p.framework || "vanilla";
    frameworksCount[fw] = (frameworksCount[fw] || 0) + 1;
  });

  const topFrameworks = Object.entries(frameworksCount)
    .sort((a, b) => b[1] - a[1])
    .map(([framework, count]) => ({ framework, count }));

  const cachedData = {
    totalProjects: sanitizedProjects.length,
    totalDeployments: sanitizedDeployments.length,
    projects: sanitizedProjects,
    recentDeployments: sanitizedDeployments.slice(0, 5),
    topFrameworks,
    lastSynced: new Date().toISOString(),
  };

  return {
    vercelUserId: String(vercelUser.id || "").trim(),
    vercelUsername: String(vercelUser.username || "").trim(),
    vercelName: String(vercelUser.name || vercelUser.username || "").trim(),
    vercelEmail: vercelUser.email ? String(vercelUser.email).trim() : null,
    vercelAvatarUrl: vercelUser.avatar ? `https://vercel.com/api/www/avatar/${vercelUser.avatar}?s=160` : null,
    cachedData,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsPreflightResponse(req);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const clientId = Deno.env.get("VERCEL_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("VERCEL_CLIENT_SECRET") ?? "";
  const redirectUri = Deno.env.get("VERCEL_REDIRECT_URI") ?? "";
  const integrationSlug = Deno.env.get("VERCEL_INTEGRATION_SLUG") ?? "eduspace";

  if (!supabaseUrl || !anonKey || !serviceRole) {
    return jsonResponse(req, 500, {
      success: false,
      error: "Supabase environment variables are missing on the server.",
    });
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const serviceClient = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method !== "POST") {
    return jsonResponse(req, 405, { success: false, error: "Method not allowed. Use POST." });
  }

  // Parse authorization header
  const authHeader = req.headers.get("Authorization");
  const bearer = parseBearerToken(authHeader);
  if (!bearer) {
    return jsonResponse(req, 401, { success: false, error: "Unauthorized: Missing auth token." });
  }

  const { data: authData, error: authError } = await anonClient.auth.getUser(bearer);
  if (authError || !authData.user) {
    return jsonResponse(req, 401, {
      success: false,
      error: authError?.message || "Invalid authentication session.",
    });
  }

  const userId = authData.user.id;
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "").trim();

  // -------------------------------------------------------------
  // ACTION: START OAUTH FLOW
  // -------------------------------------------------------------
  if (action === "start") {
    const state = generateState();
    const slug = String(body?.slug || "").trim() || integrationSlug || "eduspace";
    
    // For Vercel Integrations Console apps, the direct authorization flow is:
    const authUrl = new URL(`https://vercel.com/integrations/${slug}/new`);
    authUrl.searchParams.set("state", state);

    // Save temporary state for CSRF validation
    await serviceClient.from("vercel_connections").upsert(
      {
        user_id: userId,
        oauth_state: state,
        oauth_state_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return jsonResponse(req, 200, {
      success: true,
      authUrl: authUrl.toString(),
      state,
    });
  }

  // -------------------------------------------------------------
  // ACTION: OAUTH CALLBACK EXCHANGE
  // -------------------------------------------------------------
  if (action === "callback") {
    const code = String(body?.code || "").trim();
    const state = String(body?.state || "").trim();

    if (!code || !state) {
      return jsonResponse(req, 400, {
        success: false,
        error: "Missing authorization code or state parameter.",
      });
    }

    if (!clientId || !clientSecret || !redirectUri) {
      return jsonResponse(req, 500, {
        success: false,
        error: "Server configuration missing Vercel OAuth credentials.",
      });
    }

    // Verify state match for this user
    const { data: record, error: stateError } = await serviceClient
      .from("vercel_connections")
      .select("user_id, oauth_state, oauth_state_created_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (stateError) {
      return jsonResponse(req, 500, { success: false, error: stateError.message });
    }

    if (!record || record.oauth_state !== state) {
      return jsonResponse(req, 400, {
        success: false,
        error: "Invalid or mismatched Vercel OAuth state. Please restart connection.",
      });
    }

    const createdAt = record.oauth_state_created_at ? new Date(record.oauth_state_created_at).getTime() : 0;
    if (!createdAt || Date.now() - createdAt > OAUTH_STATE_TTL_MS) {
      return jsonResponse(req, 400, {
        success: false,
        error: "Vercel authorization state has expired. Please try connecting again.",
      });
    }

    // Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(VERCEL_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenJson.access_token) {
      const errorMsg = tokenJson.error_description || tokenJson.error || "Token exchange failed with Vercel API.";
      return jsonResponse(req, 400, { success: false, error: errorMsg });
    }

    const accessToken = String(tokenJson.access_token).trim();
    const tokenType = tokenJson.token_type || "Bearer";
    const now = new Date().toISOString();

    try {
      const vercelData = await fetchVercelAccountData(accessToken);

      await serviceClient.from("vercel_connections").upsert(
        {
          user_id: userId,
          vercel_user_id: vercelData.vercelUserId,
          vercel_username: vercelData.vercelUsername,
          vercel_name: vercelData.vercelName,
          vercel_email: vercelData.vercelEmail,
          vercel_avatar_url: vercelData.vercelAvatarUrl,
          access_token: accessToken,
          cached_data: vercelData.cachedData,
          oauth_state: null,
          oauth_state_created_at: null,
          connected_at: now,
          updated_at: now,
          last_synced_at: now,
        },
        { onConflict: "user_id" }
      );

      // Return sanitized response (DO NOT return access_token)
      return jsonResponse(req, 200, {
        success: true,
        data: {
          connected: true,
          vercelUserId: vercelData.vercelUserId,
          vercelUsername: vercelData.vercelUsername,
          vercelName: vercelData.vercelName,
          vercelAvatarUrl: vercelData.vercelAvatarUrl,
          connectedAt: now,
          lastSyncedAt: now,
          cachedData: vercelData.cachedData,
        },
      });
    } catch (apiErr) {
      const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
      return jsonResponse(req, 500, {
        success: false,
        error: `Connected to Vercel, but failed to fetch profile information: ${msg}`,
      });
    }
  }

  // -------------------------------------------------------------
  // ACTION: GET CURRENT CONNECTION STATUS & SANITIZED STATS
  // -------------------------------------------------------------
  if (action === "get-connection") {
    const targetUserId = String(body?.userId || userId).trim();

    const { data: record, error: fetchError } = await serviceClient
      .from("vercel_connections")
      .select("user_id, vercel_user_id, vercel_username, vercel_name, vercel_avatar_url, connected_at, last_synced_at, cached_data")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (fetchError) {
      return jsonResponse(req, 500, { success: false, error: fetchError.message });
    }

    if (!record || !record.vercel_user_id) {
      return jsonResponse(req, 200, {
        success: true,
        data: { connected: false },
      });
    }

    return jsonResponse(req, 200, {
      success: true,
      data: {
        connected: true,
        userId: record.user_id,
        vercelUserId: record.vercel_user_id,
        vercelUsername: record.vercel_username,
        vercelName: record.vercel_name,
        vercelAvatarUrl: record.vercel_avatar_url,
        connectedAt: record.connected_at,
        lastSyncedAt: record.last_synced_at,
        cachedData: record.cached_data,
      },
    });
  }

  // -------------------------------------------------------------
  // ACTION: SYNC VERCEL PROFILE & PROJECTS
  // -------------------------------------------------------------
  if (action === "sync") {
    const { data: record, error: fetchError } = await serviceClient
      .from("vercel_connections")
      .select("access_token, vercel_user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      return jsonResponse(req, 500, { success: false, error: fetchError.message });
    }

    if (!record || !record.access_token) {
      return jsonResponse(req, 400, {
        success: false,
        error: "No active Vercel connection found to synchronize.",
      });
    }

    try {
      const vercelData = await fetchVercelAccountData(record.access_token);
      const now = new Date().toISOString();

      await serviceClient.from("vercel_connections").update({
        vercel_user_id: vercelData.vercelUserId,
        vercel_username: vercelData.vercelUsername,
        vercel_name: vercelData.vercelName,
        vercel_email: vercelData.vercelEmail,
        vercel_avatar_url: vercelData.vercelAvatarUrl,
        cached_data: vercelData.cachedData,
        last_synced_at: now,
        updated_at: now,
      }).eq("user_id", userId);

      return jsonResponse(req, 200, {
        success: true,
        data: {
          connected: true,
          vercelUserId: vercelData.vercelUserId,
          vercelUsername: vercelData.vercelUsername,
          vercelName: vercelData.vercelName,
          vercelAvatarUrl: vercelData.vercelAvatarUrl,
          lastSyncedAt: now,
          cachedData: vercelData.cachedData,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return jsonResponse(req, 500, {
        success: false,
        error: `Sync failed: ${msg}`,
      });
    }
  }

  // -------------------------------------------------------------
  // ACTION: DISCONNECT VERCEL ACCOUNT
  // -------------------------------------------------------------
  if (action === "disconnect") {
    const { error: delError } = await serviceClient
      .from("vercel_connections")
      .delete()
      .eq("user_id", userId);

    if (delError) {
      return jsonResponse(req, 500, { success: false, error: delError.message });
    }

    return jsonResponse(req, 200, {
      success: true,
      message: "Vercel account disconnected successfully.",
    });
  }

  return jsonResponse(req, 400, { success: false, error: `Unknown action: "${action}"` });
});
