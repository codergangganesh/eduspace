// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── VAPID Web Push implementation using Web Crypto API (Deno-compatible) ────

function base64UrlDecode(str: string): Uint8Array {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64ToBytes(base64: string): Uint8Array {
    let str = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function createVapidAuthHeader(
    endpoint: string,
    subject: string,
    publicKey: string,
    privateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
    const aud = new URL(endpoint).origin;

    // JWT Header
    const header = { typ: 'JWT', alg: 'ES256' };

    // JWT Payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        aud,
        exp: now + 12 * 60 * 60, // 12 hours
        sub: subject,
    };

    const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Import private key for signing
    const privateKeyBytes = base64UrlDecode(privateKey);

    // Build raw PKCS8 key from the 32-byte private scalar
    // P-256 private key in JWK format
    const publicKeyBytes = base64UrlDecode(publicKey);

    const jwk = {
        kty: 'EC',
        crv: 'P-256',
        x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
        y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
        d: base64UrlEncode(privateKeyBytes),
    };

    const signingKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        signingKey,
        new TextEncoder().encode(unsignedToken)
    );

    // Convert DER signature to raw r||s format if needed
    const sigBytes = new Uint8Array(signature);
    let rawSig: Uint8Array;

    if (sigBytes.length !== 64) {
        // DER encoded, need to extract r and s
        rawSig = derToRaw(sigBytes);
    } else {
        rawSig = sigBytes;
    }

    const token = `${unsignedToken}.${base64UrlEncode(rawSig)}`;

    return {
        authorization: `vapid t=${token}, k=${publicKey}`,
        cryptoKey: `p256ecdsa=${publicKey}`,
    };
}

function derToRaw(der: Uint8Array): Uint8Array {
    // DER: 0x30 [total-len] 0x02 [r-len] [r] 0x02 [s-len] [s]
    const raw = new Uint8Array(64);
    let offset = 2; // skip 0x30 and length byte

    // Parse R
    if (der[offset] !== 0x02) throw new Error('Invalid DER signature');
    offset++;
    const rLen = der[offset++];
    const rStart = offset;
    offset += rLen;

    // Parse S
    if (der[offset] !== 0x02) throw new Error('Invalid DER signature');
    offset++;
    const sLen = der[offset++];
    const sStart = offset;

    // Copy R (right-aligned to 32 bytes, skip leading zeros)
    const r = der.slice(rStart, rStart + rLen);
    const rPad = 32 - r.length;
    if (rPad >= 0) {
        raw.set(r, rPad);
    } else {
        raw.set(r.slice(-32), 0);
    }

    // Copy S (right-aligned to 32 bytes, skip leading zeros)
    const s = der.slice(sStart, sStart + sLen);
    const sPad = 32 - s.length;
    if (sPad >= 0) {
        raw.set(s, 32 + sPad);
    } else {
        raw.set(s.slice(-32), 32);
    }

    return raw;
}

async function encryptPayload(
    payload: string,
    p256dh: string,
    auth: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
    const clientPublicKey = base64ToBytes(p256dh);
    const clientAuth = base64ToBytes(auth);

    // Generate ephemeral ECDH key pair
    const serverKeyPair = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
    );

    const serverPublicKeyRaw = new Uint8Array(
        await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
    );

    // Import client public key
    const clientKey = await crypto.subtle.importKey(
        'raw',
        clientPublicKey as BufferSource,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );

    // ECDH shared secret
    const sharedSecret = new Uint8Array(
        await crypto.subtle.deriveBits(
            { name: 'ECDH', public: clientKey },
            serverKeyPair.privateKey,
            256
        )
    );

    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // HKDF: auth_info, PRK, IKM
    const authInfo = new Uint8Array([
        ...new TextEncoder().encode('WebPush: info\0'),
        ...clientPublicKey,
        ...serverPublicKeyRaw,
    ]);

    // PRK = HKDF-Extract(clientAuth, sharedSecret)
    const prkKey = await crypto.subtle.importKey(
        'raw', clientAuth as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const prk = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, sharedSecret));

    // IKM = HKDF-Expand(PRK, auth_info, 32)
    const ikm = await hkdfExpand(prk, authInfo, 32);

    // Key derivation for content encryption
    const keyInfo = new Uint8Array([
        ...new TextEncoder().encode('Content-Encoding: aes128gcm\0'),
    ]);
    const nonceInfo = new Uint8Array([
        ...new TextEncoder().encode('Content-Encoding: nonce\0'),
    ]);

    // PRK2 = HKDF-Extract(salt, IKM)
    const prk2Key = await crypto.subtle.importKey(
        'raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const prk2 = new Uint8Array(await crypto.subtle.sign('HMAC', prk2Key, ikm as BufferSource));

    const contentKey = await hkdfExpand(prk2, keyInfo, 16);
    const nonce = await hkdfExpand(prk2, nonceInfo, 12);

    // Encrypt with AES-128-GCM
    const aesKey = await crypto.subtle.importKey(
        'raw', contentKey as BufferSource, { name: 'AES-GCM' }, false, ['encrypt']
    );

    // Add padding: delimiter byte 0x02 + no padding
    const payloadBytes = new TextEncoder().encode(payload);
    const paddedPayload = new Uint8Array(payloadBytes.length + 1);
    paddedPayload.set(payloadBytes);
    paddedPayload[payloadBytes.length] = 2; // delimiter

    const encrypted = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: nonce as BufferSource },
            aesKey,
            paddedPayload
        )
    );

    // Build aes128gcm body: salt(16) + rs(4) + idlen(1) + id(65) + ciphertext
    const rs = 4096;
    const header = new Uint8Array(16 + 4 + 1 + serverPublicKeyRaw.length);
    header.set(salt, 0);
    header[16] = (rs >> 24) & 0xff;
    header[17] = (rs >> 16) & 0xff;
    header[18] = (rs >> 8) & 0xff;
    header[19] = rs & 0xff;
    header[20] = serverPublicKeyRaw.length;
    header.set(serverPublicKeyRaw, 21);

    const body = new Uint8Array(header.length + encrypted.length);
    body.set(header, 0);
    body.set(encrypted, header.length);

    return { ciphertext: body, salt, serverPublicKey: serverPublicKeyRaw };
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey(
        'raw', prk as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    const input = new Uint8Array(info.length + 1);
    input.set(info, 0);
    input[info.length] = 1;

    const output = new Uint8Array(await crypto.subtle.sign('HMAC', key, input));
    return output.slice(0, length);
}

async function sendWebPush(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    vapidPublicKey: string,
    vapidPrivateKey: string,
    subject: string
): Promise<Response> {
    const vapidHeaders = await createVapidAuthHeader(
        subscription.endpoint,
        subject,
        vapidPublicKey,
        vapidPrivateKey
    );

    const { ciphertext } = await encryptPayload(
        payload,
        subscription.keys.p256dh,
        subscription.keys.auth
    );

    const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': vapidHeaders.authorization,
            'TTL': '86400',
            'Content-Encoding': 'aes128gcm',
            'Content-Type': 'application/octet-stream',
            'Urgency': 'high',
        },
        body: ciphertext.buffer as BodyInit,
    });

    return response;
}

// ─── Main Edge Function Handler ─────────────────────────────────────────────

interface PushPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    image?: string;
    timestamp?: number;
    vibrate?: number[];
    actions?: Array<{ action: string; title: string; icon?: string }>;
    requireInteraction?: boolean;
    renotify?: boolean;
    silent?: boolean;
    type?: string;
    data?: any;
}

serve(async (req: Request) => {
    // Handle CORS preflight FIRST
    if (req.method === 'OPTIONS') {
        return new Response('ok', { status: 200, headers: corsHeaders });
    }

    try {
        const requestData: any = await req.json();
        const user_id = requestData.user_id;

        const payload: PushPayload = requestData.payload || {
            title: requestData.title,
            body: requestData.body,
            url: requestData.url,
            icon: requestData.icon,
            badge: requestData.badge,
            tag: requestData.tag,
            image: requestData.image,
            timestamp: requestData.timestamp || Date.now(),
            vibrate: requestData.vibrate,
            actions: requestData.actions,
            requireInteraction: requestData.requireInteraction,
            renotify: requestData.renotify,
            silent: requestData.silent,
            type: requestData.type,
            data: requestData.data || {},
        };

        if (!user_id || !payload.title || !payload.body) {
            throw new Error("Missing user_id, title, or body");
        }

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

        // ─── Smart Delivery Logic: Check User Preferences ────────────────────────
        // Step 1: Check if user has notifications enabled globally
        const { data: profile } = await supabase
            .from('profiles')
            .select('notifications_enabled')
            .eq('user_id', user_id)
            .single();

        if (profile && profile.notifications_enabled === false) {
            return new Response(JSON.stringify({
                message: "User has disabled notifications globally",
                suppressed: true
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Step 2: Fetch only ENABLED push subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user_id);

        if (error) {
            console.error("Error fetching subscriptions:", error);
            throw error;
        }

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({
                message: "No enabled subscriptions found",
                suppressed: true
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ─── Smart Delivery Logic: Skip if user is actively using app ────────────
        // Note: This is handled by the service worker on the client side
        // The SW checks if the app is focused and suppresses notifications accordingly
        // We still send the push, but the SW will decide whether to show it
        // This allows for proper handling of background vs foreground states

        const payloadString = JSON.stringify(payload);

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

                    const response = await sendWebPush(
                        pushSubscription,
                        payloadString,
                        vapidPublicKey,
                        vapidPrivateKey,
                        subject
                    );

                    if (response.status === 410 || response.status === 404) {
                        // Subscription expired — clean up
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('id', sub.id);
                        return { status: "rejected", id: sub.id, reason: "Gone - cleaned up" };
                    }

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`Push failed for ${sub.id}: ${response.status} - ${errorText}`);
                        return { status: "rejected", id: sub.id, reason: `${response.status}: ${errorText}` };
                    }

                    return { status: "fulfilled", id: sub.id };
                } catch (err: any) {
                    console.error(`Error sending to subscription ${sub.id}:`, err);
                    return { status: "rejected", id: sub.id, reason: err.message };
                }
            })
        );

        return new Response(JSON.stringify({ success: true, results }), {
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
