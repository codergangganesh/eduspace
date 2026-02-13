// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Groq supported models
const MODELS = [
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
];

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { messages, stream = true } = payload;

        // Get API key from environment variables
        const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

        if (!GROQ_API_KEY) {
            console.error('GROQ_API_KEY is missing from environment variables');
            return new Response(JSON.stringify({
                error: 'AI service configuration error.',
                details: 'Server misconfiguration: Missing GROQ_API_KEY.'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // We will try models in order until one works
        let lastError = null;
        let successResponse = null;

        // If the user requested a specific model (payload.model), we could try that first.
        // But for this robust implementation, we'll iterate through our trusted list.
        const modelsToTry = MODELS;

        for (const model of modelsToTry) {
            console.log(`Attempting AI chat with Groq model: ${model}`);

            try {
                let response = await fetch(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        stream,
                        temperature: 0.7,
                        max_tokens: 4096,
                    }),
                });

                if (response.ok) {
                    successResponse = response;
                    console.log(`Successfully connected to model: ${model}`);
                    break;
                }

                // Handle 429 Rate Limit with Backoff
                if (response.status === 429) {
                    console.warn(`Rate limited for Groq model ${model}, implementing backoff...`);

                    let retryDelay = 2000; // Start with 2 seconds
                    let retryAttempts = 0;
                    const maxRetries = 2; // Groq rate limits can be tight, fewer retries per model

                    while (retryAttempts < maxRetries) {
                        console.log(`Retry attempt ${retryAttempts + 1}/${maxRetries} for ${model}`);
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
                                temperature: 0.7,
                                max_tokens: 4096,
                            }),
                        });

                        if (retryResponse.ok) {
                            successResponse = retryResponse;
                            console.log(`Successfully connected to model: ${model} after retry.`);
                            break;
                        }

                        retryAttempts++;
                        retryDelay *= 2; // Exponential backoff: 2s -> 4s -> 8s

                        if (retryAttempts >= maxRetries) {
                            const errorText = await retryResponse.text();
                            console.warn(`Model ${model} failed after retries: ${errorText}`);
                            lastError = errorText;
                        }
                    }

                    if (successResponse) break; // If retry succeeded, exit main loop
                    continue; // If retries failed, move to next model

                } else {
                    // Other errors (4xx, 5xx)
                    const errorText = await response.text();
                    console.warn(`Model ${model} failed: ${errorText}`);
                    lastError = errorText;
                    // Proceed to next model immediately
                }

            } catch (err: any) {
                console.warn(`Network error with model ${model}:`, err);
                lastError = err.message || String(err);
                // Proceed to next model
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
        console.error('Edge Function Request Error:', error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            details: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
