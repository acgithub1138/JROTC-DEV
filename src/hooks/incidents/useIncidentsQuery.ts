import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Incident } from './types';
import { sessionManager } from '@/utils/sessionManager';

export const useIncidentsQuery = () => {
  const { userProfile, session } = useAuth();

  return useQuery({
    queryKey: ['incidents', session?.access_token],
    queryFn: async () => {
      // Wait for proper authentication before proceeding
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      if (!userProfile?.school_id) {
        throw new Error('User school not found');
      }

      // Use session manager to ensure valid session and auth context
      try {
        await sessionManager.ensureValidSession();
        
        const { role, isValid } = await sessionManager.validateAuthContext();
        
        if (!isValid) {
          console.log('Auth context invalid, forcing session refresh...');
          const refreshSuccess = await sessionManager.forceSessionRefresh();
          
          if (!refreshSuccess) {
            throw new Error('Unable to establish valid database auth context');
          }
        }

        console.log('Incidents query - validated auth context:', {
          userRole: userProfile.role,
          dbRole: role,
          schoolId: userProfile.school_id,
          isAdmin: role === 'admin'
        });

        if (role === 'admin') {
          console.log('Admin user - should see ALL incidents from ALL schools');
        } else {
          console.log(`Non-admin user (${role}) - will see only incidents from school ${userProfile.school_id}`);
        }
      } catch (authError) {
        console.error('Session/Auth validation failed:', authError);
        throw new Error('Database authentication not available');
      }

      // Build the incidents query - simplified without profile joins for now
      const query = supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching incidents:', error);
        
        // If JWT/auth error, try refreshing session
        if (error.message?.includes('JWT') || error.code === 'PGRST301') {
          console.log('JWT context error detected, attempting session refresh...');
          try {
            await supabase.auth.refreshSession();
            // Don't retry here, let React Query handle the retry
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
          }
        }
        
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} incidents for user role: ${userProfile.role}`);
      return data as unknown as Incident[];
    },
    enabled: !!userProfile?.school_id && !!session?.access_token,
    retry: (failureCount, error: any) => {
      // Retry on JWT/auth errors up to 2 times
      if ((error?.message?.includes('JWT') || error?.code === 'PGRST301') && failureCount < 2) {
        return true;
      }
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
};