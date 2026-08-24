import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://trbetpcdiysfirjaxdfi.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyYmV0cGNkaXlzZmlyamF4ZGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTk3MTIsImV4cCI6MjA4MjU3NTcxMn0.x2xOI7uwIc2aDD2o0TVFmBao4Yef1EnCJZi1GWFn44Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    experimental: {
      passkey: true,
    },
  } as any,
});
