export interface BuildConfig {
  environment: 'development' | 'staging' | 'production';
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  debugMode: boolean;
}

export const getBuildConfig = (): BuildConfig => {
  const environment = (import.meta.env.VITE_ENVIRONMENT || 'development') as BuildConfig['environment'];
  
  const configs: Record<string, BuildConfig> = {
    development: {
      environment: 'development',
      apiUrl: 'https://6f3314e6-7365-47a3-bcb5-db91da6e1b16.lovableproject.com',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      enableAnalytics: false,
      enableCrashReporting: false,
      debugMode: true
    },
    staging: {
      environment: 'staging',
      apiUrl: 'https://staging.jrotc-ccc.app',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      enableAnalytics: true,
      enableCrashReporting: true,
      debugMode: false
    },
    production: {
      environment: 'production',
      apiUrl: 'https://jrotc-ccc.app',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      enableAnalytics: true,
      enableCrashReporting: true,
      debugMode: false
    }
  };
  
  return configs[environment];
};

export const buildInfo = {
  version: '1.0.0',
  buildNumber: '1',
  buildDate: new Date().toISOString(),
  commitHash: 'dev-build'
};