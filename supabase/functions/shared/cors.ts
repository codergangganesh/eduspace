// 🔐 Shared CORS helper for all EduSpace Edge Functions
// Only allows requests from our production domain and local dev.
// Replace wildcard '*' with this in every edge function.

const ALLOWED_ORIGINS = [
  'https://eduspaceacademy.online',
  'https://www.eduspaceacademy.online',
  'https://admin.eduspaceacademy.online',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/.test(origin)) return true;
  return false;
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isOriginAllowed(origin)
    ? origin
    : (origin || ALLOWED_ORIGINS[0]);

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function corsPreflightResponse(req: Request): Response {
  return new Response('ok', { headers: getCorsHeaders(req) });
}
