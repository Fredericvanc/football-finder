import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file:\n' +
    `REACT_APP_SUPABASE_URL: ${supabaseUrl ? 'set' : 'missing'}\n` +
    `REACT_APP_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'set' : 'missing'}`
  );
}

if (!process.env.REACT_APP_SUPABASE_URL) {
  console.error('Missing REACT_APP_SUPABASE_URL');
}

if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.error('Missing REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Add error logging to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.id);
});
