import { createClient } from '@supabase/supabase-js';

// ✅ Read ENV variables
// Ensure VITE_SUPABASE_URL in your .env is set to your .workers.dev link
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase ENV missing:", { supabaseUrl, supabaseAnonKey });
  throw new Error('Missing Supabase environment variables.');
}

// ✅ Create client with Auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,   // Keeps your session active
    persistSession: true,      // Saves login so you don't get 'Access Denied' on refresh
    detectSessionInUrl: true   // Helps with login redirects
  }
});