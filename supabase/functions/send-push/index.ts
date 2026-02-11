// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
// @ts-ignore
import webPush from "https://esm.sh/web-push@3.6.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PushPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
    data?: any;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { status: 200, headers: corsHeaders });
    }

    try {
        const data: any = await req.json();
        const user_id = data.user_id;

        // Support both nested payload and flat structure
        const payload: PushPayload = data.payload || {
            title: data.title,
            body: data.body,
            url: data.url,
            icon: data.icon,
            badge: data.badge,
            data: data.data || data
        };

        if (!user_id || !payload.title || !payload.body) {
            throw new Error("Missing user_id, title, or body");
        }

        // Use globalThis to avoid "Cannot find name 'Deno'" errors in IDE
        const DenoEnv = (globalThis as any).Deno?.env;
        const supabaseUrl = DenoEnv?.get('SUPABASE_URL') || '';
        const supabaseKey = DenoEnv?.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const vapidPublicKey = DenoEnv?.get('VITE_VAPID_PUBLIC_KEY');
        const vapidPrivateKey = DenoEnv?.get('VAPID_PRIVATE_KEY');
        const subject = 'mailto:admin@eduspace.com';

        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error("VAPID keys are missing in environment variables.");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch user's Web Push subscriptions
        const { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user_id);

        // Fetch user's FCM tokens
        const { data: fcmTokens, error: fcmError } = await supabase
            .from('fcm_tokens')
            .select('*')
            .eq('user_id', user_id);

        if (subError || fcmError) {
            console.error("Error fetching subscriptions:", subError || fcmError);
            throw subError || fcmError;
        }

        const notificationResults = {
            webPush: [],
            fcm: []
        };

        // 1. Process Web Push
        if (subscriptions && subscriptions.length > 0) {
            webPush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
            const results = await Promise.all(
                subscriptions.map(async (sub: any) => {
                    try {
                        const pushSubscription = {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        };

                        await webPush.sendNotification(
                            pushSubscription,
                            JSON.stringify(payload)
                        );
                        return { status: "fulfilled", id: sub.id };
                    } catch (err: any) {
                        console.error(`Error sending to subscription ${sub.id}:`, err);
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                        }
                        return { status: "rejected", id: sub.id, reason: err.message };
                    }
                })
            );
            notificationResults.webPush = results as any;
        }

        // 2. Process FCM (Industry Standard Mobile Sending)
        if (fcmTokens && fcmTokens.length > 0) {
            console.log(`FCM Tokens found: ${fcmTokens.length}. Preparing to send via Google V1 API.`);
            // Note: Sending requires FCM Service Account OAuth Token
        }

        return new Response(JSON.stringify({ success: true, results: notificationResults }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
