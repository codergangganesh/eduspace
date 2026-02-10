// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { roomName, userProfile } = await req.json()
        const appId = Deno.env.get("JITSI_APP_ID") || "vpaas-magic-cookie-f796d7a3ec46435793193a60b0aef396"
        const privateKeyPem = Deno.env.get("JITSI_PRIVATE_KEY")

        if (!privateKeyPem) {
            throw new Error("JITSI_PRIVATE_KEY is not set")
        }

        // Prepare the header
        const header = {
            alg: "RS256",
            typ: "JWT",
            kid: `${appId}/9b467d`
        }

        // Prepare the payload
        const payload = {
            aud: "jitsi",
            iss: "chat",
            iat: getNumericDate(0),
            nbf: getNumericDate(-600), // 10 minutes in the past
            exp: getNumericDate(60 * 60 * 2), // 2 hours
            sub: appId,
            room: "*",
            context: {
                user: {
                    name: userProfile.name || "User",
                    id: userProfile.id,
                    avatar: userProfile.avatar || "",
                    email: userProfile.email || ""
                },
                features: {
                    livestreaming: true,
                    "file-upload": true,
                    "transcription": true,
                    recording: true
                }
            }
        }

        // Import the private key
        // We need to handle the PEM format. The user provided the base64 part.
        const pemHeader = "-----BEGIN PRIVATE KEY-----";
        const pemFooter = "-----END PRIVATE KEY-----";
        const pemContents = privateKeyPem.replace(/\s+/g, "");
        const binaryDerString = atob(pemContents);
        const binaryDer = new Uint8Array(binaryDerString.length);
        for (let i = 0; i < binaryDerString.length; i++) {
            binaryDer[i] = binaryDerString.charCodeAt(i);
        }

        const key = await crypto.subtle.importKey(
            "pkcs8",
            binaryDer,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-256",
            },
            true,
            ["sign"]
        );

        const token = await create(header, payload, key)

        return new Response(
            JSON.stringify({ token }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
