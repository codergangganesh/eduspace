// @ts-nocheck
import { serve } from "std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

import { verifyCallActionToken } from "../shared/callActionToken.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CallAction = "accept" | "reject" | "missed";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function normalizeAction(rawAction: unknown): CallAction | null {
  if (typeof rawAction !== "string") return null;

  switch (rawAction.trim().toLowerCase()) {
    case "accept":
      return "accept";
    case "reject":
      return "reject";
    case "missed":
      return "missed";
    default:
      return null;
  }
}

function buildUpdate(action: CallAction, currentStatus: string) {
  const now = new Date().toISOString();

  if (["completed", "cancelled", "failed"].includes(currentStatus)) {
    return null;
  }

  if (action === "accept") {
    if (["accepted", "active"].includes(currentStatus)) {
      return null;
    }
    if (!["initiated", "ringing"].includes(currentStatus)) {
      return null;
    }
    return {
      status: "accepted",
      started_at: now,
      ended_at: null,
    };
  }

  if (action === "reject") {
    if (!["initiated", "ringing", "accepted"].includes(currentStatus)) {
      return null;
    }
    return {
      status: "rejected",
      ended_at: now,
      duration: 0,
    };
  }

  if (!["initiated", "ringing"].includes(currentStatus)) {
    return null;
  }

  return {
    status: "missed",
    ended_at: now,
    duration: 0,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const actionSecret = Deno.env.get("CALL_ACTION_SECRET") ?? serviceRole;

    if (!supabaseUrl || !serviceRole || !anonKey) {
      return json(500, { error: "Server configuration error" });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.sessionId ?? body?.session_id ?? "").trim();
    const action = normalizeAction(body?.action);
    const actionToken = typeof body?.actionToken === "string"
      ? body.actionToken.trim()
      : typeof body?.action_token === "string"
      ? body.action_token.trim()
      : "";

    if (!sessionId || !action) {
      return json(400, { error: "Missing sessionId or invalid action" });
    }

    const serviceClient = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let actorUserId: string | null = null;
    let tokenActorUserId: string | null = null;

    if (actionToken) {
      const tokenPayload = await verifyCallActionToken(actionToken, actionSecret);
      if (!tokenPayload || tokenPayload.sessionId !== sessionId) {
        return json(401, { error: "Invalid or expired action token" });
      }
      tokenActorUserId = tokenPayload.receiverId;
      actorUserId = tokenPayload.receiverId;
    } else {
      const bearer = parseBearerToken(req.headers.get("Authorization"));
      if (!bearer) {
        return json(401, { error: "Unauthorized" });
      }

      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: authData, error: authError } = await userClient.auth.getUser(bearer);
      if (authError || !authData.user) {
        return json(401, { error: "Invalid auth token", details: authError?.message || "Auth session missing!" });
      }

      actorUserId = authData.user.id;
    }

    const { data: session, error: sessionError } = await serviceClient
      .from("call_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError) {
      return json(500, { error: sessionError.message });
    }

    if (!session) {
      return json(404, { error: "Call session not found" });
    }

    const isParticipant = actorUserId === session.caller_id || actorUserId === session.receiver_id;
    if (!isParticipant) {
      return json(403, { error: "Forbidden" });
    }

    if (tokenActorUserId && tokenActorUserId !== session.receiver_id) {
      return json(403, { error: "Action token does not match receiver" });
    }

    const update = buildUpdate(action, String(session.status ?? ""));
    if (!update) {
      return json(200, {
        success: true,
        skipped: "state_unchanged",
        session,
      });
    }

    const { data: updatedRows, error: updateError } = await serviceClient
      .from("call_sessions")
      .update(update)
      .eq("id", sessionId)
      .select("*");

    if (updateError) {
      return json(500, { error: updateError.message });
    }

    const updatedSession = updatedRows?.[0] ?? session;

    return json(200, {
      success: true,
      action,
      session: updatedSession,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json(500, { error: message });
  }
});
