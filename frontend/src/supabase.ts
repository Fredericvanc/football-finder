import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';
import { config } from './config';

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please check your .env file:\n' +
    `REACT_APP_SUPABASE_URL: ${config.supabaseUrl ? 'set' : 'missing'}\n` +
    `REACT_APP_SUPABASE_ANON_KEY: ${config.supabaseAnonKey ? 'set' : 'missing'}\n` +
    `Current environment: ${config.env}`
  );
}

console.log('Initializing Supabase client with config:', {
  hasUrl: !!config.supabaseUrl,
  hasAnonKey: !!config.supabaseAnonKey,
  env: config.env
});

export const supabase = createClient<Database>(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
  }
);

// Add error logging to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, {
    hasSession: !!session,
    userId: session?.user?.id
  });
});
