import { createClient } from '@supabase/supabase-js';
import Cookies from 'js-cookie';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Custom storage adapter using cookies
const cookieStorage = {
  getItem: (key: string) => {
    return Cookies.get(key) ?? null;
  },
  setItem: (key: string, value: string) => {
    Cookies.set(key, value, { expires: 7, path: '/' });
  },
  removeItem: (key: string) => {
    Cookies.remove(key, { path: '/' });
  },
};

// Hybrid storage that switches between Cookies and LocalStorage based on user consent
const getStorage = () => {
  const consent = localStorage.getItem("cookie-consent");

  // If user explicitly allowed cookies, use cookieStorage
  if (consent === "allow") {
    return cookieStorage;
  }

  // Default to localStorage (or if they rejected cookies)
  return localStorage;
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getStorage(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

