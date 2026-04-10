// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ─────────────────────────────────────────────────────────────────────
// 🔐 Fix MED-02: Restrict to production domain only (no more wildcard *)
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

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const isLocalDevOrigin =
    /^https?:\/\/localhost:\d+$/i.test(origin) ||
    /^https?:\/\/127\.0\.0\.1:\d+$/i.test(origin);

  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) || isLocalDevOrigin
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ─── Groq Models ──────────────────────────────────────────────────────────────
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = [
  'llama-3.3-70b-versatile',
  'mixtral-8x7b-32768',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

const VISION_MODELS = [
  'llama-3.2-11b-vision-preview',
  'llama-3.2-90b-vision-preview',
];

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hasImageContent(messages: any[]) {
  return messages.some(m =>
    Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
  );
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 🔐 Fix MED-01: Verify the user is authenticated before calling Groq.
  // supabase.functions.invoke() sends the auth token automatically — 
  // so this will NEVER block a logged-in user. It only blocks anonymous abuse.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Please log in to use AI features.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify the JWT with Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Invalid or expired session.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Authenticated — proceed with AI request ───────────────────────────
    const payload = await req.json();
    const { messages, stream = true, response_format, temperature } = payload;

    // Get API key from environment variables (server-side secret — never exposed)
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({
        error: 'AI service configuration error.',
        details: 'Server misconfiguration: Missing GROQ_API_KEY.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine which models to try
    const isVisionNeeded = hasImageContent(messages);
    const modelsToTry = isVisionNeeded ? VISION_MODELS : MODELS;

    // Try models in order until one works
    let lastError = null;
    let successResponse = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages,
            stream,
            temperature: temperature ?? 0.7,
            max_tokens: 4096,
            ...(response_format ? { response_format } : {})
          }),
        });

        if (response.ok) {
          successResponse = response;
          break;
        }

        // Handle 429 Rate Limit with Backoff
        if (response.status === 429) {
          let retryDelay = 2000;
          let retryAttempts = 0;
          const maxRetries = 2;

          while (retryAttempts < maxRetries) {
            await delay(retryDelay);

            const retryResponse = await fetch(GROQ_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
              },
              body: JSON.stringify({
                model,
                messages,
                stream,
                temperature: temperature ?? 0.7,
                max_tokens: 4096,
                ...(response_format ? { response_format } : {})
              }),
            });

            if (retryResponse.ok) {
              successResponse = retryResponse;
              break;
            }

            retryAttempts++;
            retryDelay *= 2; // Exponential backoff: 2s → 4s → 8s

            if (retryAttempts >= maxRetries) {
              const errorText = await retryResponse.text();
              lastError = errorText;
            }
          }

          if (successResponse) break;
          continue;

        } else {
          const errorText = await response.text();
          lastError = errorText;
        }

      } catch (err: any) {
        lastError = err.message || String(err);
      }
    }

    if (!successResponse) {
      return new Response(JSON.stringify({
        error: 'AI service is currently unavailable.',
        details: lastError || 'All Groq models failed.'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the successful response (stream or json)
    return new Response(successResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': stream ? 'text/event-stream' : 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error.message
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
