export const config = {
  // Environment
  env: process.env.REACT_APP_ENV || 'development',
  isProduction: process.env.REACT_APP_ENV === 'production',
  isDevelopment: process.env.REACT_APP_ENV === 'development',
  
  // Supabase Configuration
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
  
  // Mapbox Configuration
  mapboxToken: process.env.REACT_APP_MAPBOX_TOKEN,
};
