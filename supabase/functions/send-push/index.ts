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
type CallSessionRow = { caller_id: string; receiver_id: string };
type PushSubscriptionRow = { endpoint: string; notification_enabled: boolean };

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

async function importPrivateKey(pem: string): Promise<CryptoKey> {
    const pemContents = pem
        .replace(/-----BEGIN PRIVATE KEY-----/g, "")
        .replace(/-----END PRIVATE KEY-----/g, "")
        .replace(/\s+/g, "");

    const binaryDerString = atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    return await crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        true,
        ["sign"]
    );
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
    const key = await importPrivateKey(sa.private_key);
    const jwt = await create(
        { alg: "RS256", typ: "JWT" },
        {
            iss: sa.client_email,
            scope: "https://www.googleapis.com/auth/firebase.messaging",
            aud: "https://oauth2.googleapis.com/token",
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
        },
        key,
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
    const ttl = isCall ? "45s" : "30s";

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
            ttl,
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
            notification_priority: "PRIORITY_MAX",
            visibility: "PUBLIC",
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
        const errorText = await res.text();
        console.error(`FCM send failed (${res.status}): ${errorText}`);
        throw new Error(`FCM send failed (${res.status}): ${errorText}`);
    }

    return await res.json();
}

function extractFcmTokenFromEndpoint(endpoint: string): string | null {
    if (!endpoint.startsWith("fcm:")) return null;
    const token = endpoint.slice(4).trim();
    return token.length > 0 ? token : null;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });

    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceRole;

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
            const callSessionId = String(notification.data?.sessionId ?? notification.data?.roomId ?? "");
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

            // Call path: caller can notify only the matched peer in an existing call session.
            if (!allowed && (notificationType === "incoming_call" || notificationType === "call") && callSessionId) {
                const { data: callSession, error: callErr } = await serviceClient
                    .from("call_sessions")
                    .select("caller_id, receiver_id")
                    .eq("id", callSessionId)
                    .maybeSingle();

                if (!callErr && callSession) {
                    const session = callSession as CallSessionRow;
                    const pair = new Set([session.caller_id, session.receiver_id]);
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

        const { data: pushSubscriptions, error: pushSubscriptionsError } = await serviceClient
            .from("push_subscriptions")
            .select("endpoint, notification_enabled")
            .eq("user_id", targetUserId)
            .eq("notification_enabled", true)
            .like("endpoint", "fcm:%");

        if (pushSubscriptionsError) {
            return json(500, { error: `Push subscription lookup failed: ${pushSubscriptionsError.message}` });
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

        const tokens = new Set<string>();
        if (profile.fcm_token) {
            tokens.add(profile.fcm_token);
        }

        for (const row of (pushSubscriptions ?? []) as PushSubscriptionRow[]) {
            const tokenFromSubscription = extractFcmTokenFromEndpoint(row.endpoint);
            if (tokenFromSubscription) {
                tokens.add(tokenFromSubscription);
            }
        }

        const targetTokens = Array.from(tokens);
        if (targetTokens.length === 0) {
            return json(200, { success: true, skipped: "missing_fcm_token" });
        }

        const sendResults = await Promise.allSettled(
            targetTokens.map((targetToken) => sendFCM(serviceAccount, targetToken, notification)),
        );

        const successes = sendResults
            .map((result, index) => ({ result, token: targetTokens[index] }))
            .filter(({ result }) => result.status === "fulfilled");
        const failures = sendResults
            .map((result, index) => ({ result, token: targetTokens[index] }))
            .filter(({ result }) => result.status === "rejected")
            .map(({ result, token }) => ({
                token,
                error: result.status === "rejected" ? String(result.reason) : "unknown",
            }));

        if (successes.length === 0) {
            return json(400, { error: "All FCM sends failed", failures });
        }

        return json(200, {
            success: true,
            channel: "fcm",
            sent: successes.length,
            failed: failures.length,
            failures,
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Error in send-push handler: ${msg}`);
        return json(400, { error: msg });
    }
});
