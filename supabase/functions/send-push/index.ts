// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ServiceAccount = {
    client_email: string;
    private_key: string;
    project_id: string;
};

type IncomingPayload = {
    user_id: string;
    title?: string;
    body?: string;
    type?: string;
    image?: string;
    data?: Record<string, unknown>;
    payload?: {
        title?: string;
        body?: string;
        type?: string;
        image?: string;
        data?: Record<string, unknown>;
    };
};

type RoleRow = { role: string };
type ConversationRow = { participant_1: string; participant_2: string };

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

function flattenData(data: Record<string, unknown> | undefined): Record<string, string> {
    if (!data) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
        if (v === undefined || v === null) continue;
        out[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
    return out;
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
    const jwt = await create(
        { alg: "RS256", typ: "JWT" },
        {
            iss: sa.client_email,
            scope: "https://www.googleapis.com/auth/firebase.messaging",
            aud: "https://oauth2.googleapis.com/token",
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
        },
        sa.private_key,
    );

    const params = new URLSearchParams();
    params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    params.append("assertion", jwt);

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
    });

    if (!res.ok) {
        throw new Error(`OAuth token request failed (${res.status})`);
    }

    const data = await res.json();
    if (!data?.access_token) {
        throw new Error("Google OAuth token missing in response");
    }
    return data.access_token as string;
}

async function sendFCM(
    sa: ServiceAccount,
    token: string,
    payload: { title?: string; body?: string; type?: string; image?: string; data?: Record<string, unknown> },
) {
    const accessToken = await getAccessToken(sa);
    const isCall = payload.type === "incoming_call" || payload.type === "call";

    const message: Record<string, unknown> = {
        token,
        data: {
            ...flattenData(payload.data),
            title: payload.title ?? "",
            body: payload.body ?? "",
            type: payload.type ?? "notification",
        },
        android: {
            priority: "high",
            ttl: "30s",
            direct_boot_ok: true,
        },
    };

    if (!isCall) {
        message.notification = {
            title: payload.title ?? "EduSpace",
            body: payload.body ?? "",
            image: payload.image,
        };
        (message.android as Record<string, unknown>).notification = {
            channel_id: "default",
            sound: "default",
            default_sound: true,
            default_vibrate_timings: true,
            priority: "max",
            visibility: "public",
        };
    }

    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
    });

    if (!res.ok) {
        throw new Error(`FCM send failed (${res.status}): ${await res.text()}`);
    }

    return await res.json();
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });

    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

        if (!supabaseUrl || !serviceRole) {
            return json(500, { error: "Server misconfiguration: missing Supabase env vars" });
        }

        const body = (await req.json()) as IncomingPayload;
        const targetUserId = body.user_id;
        if (!targetUserId) {
            return json(400, { error: "Missing user_id" });
        }

        const notification = body.payload ?? {
            title: body.title,
            body: body.body,
            type: body.type,
            image: body.image,
            data: body.data,
        };

        const token = parseBearerToken(req.headers.get("authorization"));
        if (!token || !anonKey) {
            return json(401, { error: "Unauthorized" });
        }

        const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: authData, error: authError } = await userClient.auth.getUser();
        if (authError || !authData.user) {
            return json(401, { error: "Invalid auth token" });
        }

        const callerId = authData.user.id;

        const serviceClient = createClient(supabaseUrl, serviceRole, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        if (callerId !== targetUserId) {
            const notificationType = notification.type ?? "";
            const conversationId = String(notification.data?.conversationId ?? "");
            let allowed = false;

            // Messaging path: sender can notify only if both users are participants of this conversation.
            if (notificationType === "message" && conversationId) {
                const { data: conversation, error: convErr } = await serviceClient
                    .from("conversations")
                    .select("participant_1, participant_2")
                    .eq("id", conversationId)
                    .maybeSingle();

                if (!convErr && conversation) {
                    const c = conversation as ConversationRow;
                    const pair = new Set([c.participant_1, c.participant_2]);
                    allowed = pair.has(callerId) && pair.has(targetUserId);
                }
            }

            // Existing elevated role override for non-message notification flows.
            if (!allowed) {
                const { data: callerRoleRows, error: roleErr } = await serviceClient
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", callerId)
                    .in("role", ["lecturer", "admin"]);

                const roles = (callerRoleRows ?? []) as RoleRow[];
                allowed = !roleErr && roles.length > 0;
            }

            if (!allowed) {
                return json(403, { error: "Forbidden" });
            }
        }

        const { data: profile, error: profileError } = await serviceClient
            .from("profiles")
            .select("fcm_token, notifications_enabled")
            .eq("user_id", targetUserId)
            .maybeSingle();

        if (profileError) {
            return json(500, { error: `Profile lookup failed: ${profileError.message}` });
        }

        if (!profile) {
            return json(404, { error: "Target user profile not found" });
        }

        if (profile.notifications_enabled === false) {
            return json(200, { success: true, skipped: "notifications_disabled" });
        }

        const saRaw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "";
        if (!saRaw) {
            return json(500, { error: "Server misconfiguration: missing FIREBASE_SERVICE_ACCOUNT" });
        }

        let serviceAccount: ServiceAccount;
        try {
            serviceAccount = JSON.parse(saRaw) as ServiceAccount;
        } catch {
            return json(500, { error: "Invalid FIREBASE_SERVICE_ACCOUNT JSON" });
        }

        if (!profile.fcm_token) {
            return json(200, { success: true, skipped: "missing_fcm_token" });
        }

        const result = await sendFCM(serviceAccount, profile.fcm_token, notification);
        return json(200, { success: true, channel: "fcm", result });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return json(400, { error: msg });
    }
});
