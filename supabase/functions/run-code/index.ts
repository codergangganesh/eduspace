// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ─────────────────────────────────────────────────────────────────────
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
  'http://127.0.0.1:4173'
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

// ─── JUDGE0 ID MAPPING (SERVER-SIDE FALLBACK) ──────────────────────────────────
const JUDGE0_LANGUAGE_MAP: Record<string, number> = {
  python: 71,
  cpp: 54,
  c: 50,
  java: 62,
  javascript: 63,
  typescript: 74,
  go: 60,
  rust: 73,
  csharp: 51,
  php: 68,
  kotlin: 78,
  ruby: 72,
  swift: 83
};

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Optional auth verification (Graceful fallback if unauthenticated)
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      );
      const token = authHeader.replace('Bearer ', '');
      await supabase.auth.getUser(token).catch(() => {});
    }

    // 2. Parse request payload
    const body = await req.json();
    const { language, code, stdin = '', language_id } = body;

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        status: 'Error',
        stdout: '',
        stderr: 'Code snippet cannot be empty.',
        compileOutput: '',
        time: '0.00',
        memory: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Security constraints
    if (code.length > 65536) {
      return new Response(JSON.stringify({
        success: false,
        status: 'Security Limit Exceeded',
        stdout: '',
        stderr: 'Source code size exceeds maximum allowed limit (64KB).',
        compileOutput: '',
        time: '0.00',
        memory: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (stdin.length > 65536) {
      return new Response(JSON.stringify({
        success: false,
        status: 'Security Limit Exceeded',
        stdout: '',
        stderr: 'Standard input size exceeds maximum allowed limit (64KB).',
        compileOutput: '',
        time: '0.00',
        memory: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine Judge0 Language ID
    let selectedJudge0Id = typeof language_id === 'number' ? language_id : null;
    if (!selectedJudge0Id && language) {
      const cleanLang = String(language).toLowerCase().trim();
      selectedJudge0Id = JUDGE0_LANGUAGE_MAP[cleanLang] || 71;
    }
    if (!selectedJudge0Id) {
      selectedJudge0Id = 71; // Default Python
    }

    // 3. Configure Judge0 API endpoint & credentials
    const judge0BaseUrl = (Deno.env.get('JUDGE0_URL') || 'https://ce.judge0.com').replace(/\/+$/, '');
    const judge0ApiKey = Deno.env.get('JUDGE0_API_KEY') || '';
    const judge0Host = Deno.env.get('JUDGE0_HOST') || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (judge0ApiKey) {
      headers['X-RapidAPI-Key'] = judge0ApiKey;
      headers['X-Auth-Token'] = judge0ApiKey;
    }
    if (judge0Host) {
      headers['X-RapidAPI-Host'] = judge0Host;
    }

    const payload = {
      source_code: code,
      language_id: selectedJudge0Id,
      stdin: stdin,
      cpu_time_limit: 5.0,
      wall_time_limit: 10.0,
      memory_limit: 128000
    };

    // 4. Create submission in Judge0
    const submissionUrl = `${judge0BaseUrl}/submissions?base64_encoded=false&wait=true`;
    let response = await fetch(submissionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    let result = null;

    if (response.ok) {
      result = await response.json();
    } else {
      // Fallback: try asynchronous submission + polling if wait=true not supported
      const asyncUrl = `${judge0BaseUrl}/submissions?base64_encoded=false`;
      const asyncRes = await fetch(asyncUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!asyncRes.ok) {
        const errText = await asyncRes.text();
        return new Response(JSON.stringify({
          success: false,
          status: 'Judge0 API Error',
          stdout: '',
          stderr: `Judge0 execution request failed (${asyncRes.status}): ${errText}`,
          compileOutput: '',
          time: '0.00',
          memory: 0
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const asyncData = await asyncRes.json();
      const token = asyncData.token;

      // Poll for completion (up to 10 iterations)
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const pollRes = await fetch(`${judge0BaseUrl}/submissions/${token}?base64_encoded=false`, {
          headers
        });
        if (pollRes.ok) {
          const pollData = await pollRes.json();
          if (pollData.status && pollData.status.id >= 3) {
            result = pollData;
            break;
          }
        }
      }
    }

    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        status: 'Time Limit Exceeded',
        stdout: '',
        stderr: 'Code execution timed out waiting for sandbox result.',
        compileOutput: '',
        time: '5.00',
        memory: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Normalize Judge0 output
    const statusDesc = result.status?.description || 'Executed';
    const isAccepted = result.status?.id === 3;
    const isCompileError = result.status?.id === 6;
    const isRuntimeError = result.status?.id >= 7 && result.status?.id <= 12;

    const normalized = {
      success: isAccepted,
      status: statusDesc,
      stdout: result.stdout || '',
      stderr: result.stderr || (isRuntimeError ? (result.status?.description || 'Runtime Error') : ''),
      compileOutput: result.compile_output || (isCompileError ? (result.status?.description || 'Compilation Error') : ''),
      time: result.time || '0.00',
      memory: result.memory || 0
    };

    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      status: 'System Error',
      stdout: '',
      stderr: err?.message || 'An unexpected error occurred during execution.',
      compileOutput: '',
      time: '0.00',
      memory: 0
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
