// @ts-nocheck
import { serve } from "std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

import { createCallActionToken } from "../shared/callActionToken.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const actionSecret = Deno.env.get("CALL_ACTION_SECRET") ?? serviceRole;

    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    const xUserToken = req.headers.get("x-user-token");

    // Prioritize x-user-token for our internal verification
    const token = xUserToken || parseBearerToken(authHeader);

    console.log(`[initiate-call] Resolved token from: ${xUserToken ? 'x-user-token' : 'Authorization'}. Length: ${token?.length ?? 0}`);

    if (!token) {
      console.error("[initiate-call] No authentication token found");
      return new Response(JSON.stringify({ error: "Unauthorized: Missing token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Initialize User Client to verify the real user's JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) {
      console.error("[initiate-call] JWT verify failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid JWT", details: authError?.message || "Auth session missing!" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const callerId = authData.user.id;
    const body = await req.json();
    const { receiver_id, call_type } = body;

    if (!receiver_id) {
      return new Response(JSON.stringify({ error: "Missing receiver_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const serviceClient = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Get Caller Profile
    const { data: caller, error: callerError } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("user_id", callerId)
      .maybeSingle();

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Caller profile not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Get Receiver Profile
    const { data: receiver, error: receiverError } = await serviceClient
      .from("profiles")
      .select("*")
      .or(`user_id.eq.${receiver_id},id.eq.${receiver_id}`)
      .maybeSingle();

    if (receiverError || !receiver) {
      return new Response(JSON.stringify({ error: "Receiver not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Create Session
    const { data: session, error: sessionError } = await serviceClient
      .from("call_sessions")
      .insert({
        caller_id: caller.user_id,
        receiver_id: receiver.user_id,
        status: "initiated",
        call_type: call_type || "video",
        institution_id: caller.institution_id || "00000000-0000-0000-0000-000000000000",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    const actionToken = await createCallActionToken({
      sessionId: session.id,
      receiverId: receiver.user_id,
      exp: Date.now() + (5 * 60 * 1000),
    }, actionSecret);

    // 4. Trigger Push Notification (using internal worker fetch to match your send-push)
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: receiver.user_id,
          payload: {
            title: `Incoming Call`,
            body: `${caller.full_name || "Someone"} is calling you...`,
            type: "incoming_call",
            data: {
              type: "incoming_call",
              sessionId: session.id,
              callerId: callerId,
              callerName: caller.full_name,
              callerAvatar: caller.avatar_url,
              callType: call_type,
              actionToken,
            },
          },
        }),
      });
    } catch (e) {
      console.error("[initiate-call] Push failed:", e.message);
    }

    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
