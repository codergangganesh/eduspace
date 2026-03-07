// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok(body: unknown) {
  return json(200, body);
}

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY") ?? Deno.env.get("VITE_OPENROUTER_API_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return ok({ error: "Server misconfiguration: missing Supabase environment variables." });
    }

    if (!openRouterKey) {
      return ok({ error: "OpenRouter API key is not configured on the server." });
    }

    const token = parseBearerToken(req.headers.get("authorization"));
    if (token) {
      const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: authData, error: authError } = await serviceClient.auth.getUser(token);
      if (authError || !authData.user) {
        return ok({ error: "Invalid auth token" });
      }
    }

    const payload = await req.json();
    const prompt = String(payload?.prompt ?? "").trim();

    if (!prompt) {
      return ok({ error: "Missing prompt" });
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openRouterKey}`,
        "HTTP-Referer": req.headers.get("origin") ?? "https://eduspace.app",
        "X-Title": "EduSpace Quiz Generator",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("OpenRouter API error:", errBody);
      return ok({ error: `Failed to generate questions from AI provider. ${errBody.slice(0, 300)}` });
    }

    const data = await response.json();
    const textContent = data?.choices?.[0]?.message?.content;
    if (!textContent) {
      return ok({ error: "AI returned an empty response." });
    }

    let cleaned = textContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned);
      return ok({ error: "AI returned an invalid response format." });
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return ok({ error: "AI did not generate any questions." });
    }

    return ok({ questions: parsed });
  } catch (error: any) {
    console.error("generate-ai-quiz error:", error);
    return ok({ error: error?.message ?? "Internal Server Error" });
  }
});
