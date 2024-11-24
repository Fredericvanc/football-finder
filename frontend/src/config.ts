export const config = {
  useLocalApi: process.env.REACT_APP_USE_LOCAL_API === 'true',
  apiBaseUrl: process.env.REACT_APP_USE_LOCAL_API === 'true' 
    ? 'http://localhost:5001/api'
    : process.env.REACT_APP_SUPABASE_URL,
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};
