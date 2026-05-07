import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'missing-supabase-anon-key';

const missingSupabaseEnv = [
  !SUPABASE_URL ? 'VITE_SUPABASE_URL' : null,
  !SUPABASE_PUBLISHABLE_KEY ? 'VITE_SUPABASE_ANON_KEY' : null,
].filter(Boolean) as string[];

export const isSupabaseConfigured = missingSupabaseEnv.length === 0;

if (!isSupabaseConfigured) {
  console.error(
    `[Supabase] Missing required environment variable(s): ${missingSupabaseEnv.join(
      ', '
    )}. The app will load, but Supabase-backed features will fail until Vercel env vars are configured.`
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL || FALLBACK_SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_ANON_KEY,
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // // Disable lock manager to prevent NavigatorLockAcquireTimeoutError
    // storageKey: 'eduspace-auth-token',
  }
}
);
