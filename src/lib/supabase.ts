import { createClient } from '@supabase/supabase-js';

// Dedicated Supabase instance for the AI stack proxied through Nginx
const supabaseUrl = window.location.origin;

// Load anon key from environment variable (set at build time)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is not set. ' +
    'Please set it in .env.local for development or pass as build arg for production.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
