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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
