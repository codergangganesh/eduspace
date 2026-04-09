// 🔐 Shared CORS helper for all EduSpace Edge Functions
// Only allows requests from our production domain and local dev.
// Replace wildcard '*' with this in every edge function.

const ALLOWED_ORIGINS = [
  'https://eduspaceacademy.online',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // fallback to production domain

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

export function corsPreflightResponse(req: Request): Response {
  return new Response('ok', { headers: getCorsHeaders(req) });
}
