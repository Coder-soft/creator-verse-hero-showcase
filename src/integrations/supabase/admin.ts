import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create a client with or without service role key
// Without the service role key, admin features will be limited
if (!supabaseUrl) {
  throw new Error('Supabase URL is required');
}

export const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceRoleKey || 'placeholder-key-features-limited',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to check if we have a valid service role key
export function hasServiceRoleKey(): boolean {
  return !!supabaseServiceRoleKey && supabaseServiceRoleKey.length > 20;
}

/*
 * To enable full admin features (like viewing user emails), you need to:
 * 
 * 1. Create a .env file in the project root
 * 2. Add the following:
 *    VITE_SUPABASE_URL=your_supabase_project_url
 *    VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
 * 
 * Get these values from your Supabase dashboard:
 * - Project Settings > API > URL
 * - Project Settings > API > Project API keys > service_role (secret)
 */
