import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Incident } from './types';

export const useIncidentsQuery = () => {
  const { userProfile, session } = useAuth();

  return useQuery({
    queryKey: ['incidents', session?.access_token],
    queryFn: async () => {
      if (!userProfile?.school_id) {
        throw new Error('User school not found');
      }

      // Debug session context before making query
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Incidents query session debug:', {
        hasUserProfile: !!userProfile,
        schoolId: userProfile.school_id,
        userId: currentSession?.user?.id,
        accessToken: currentSession?.access_token ? 'present' : 'missing',
        expiresAt: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000) : 'unknown'
      });

      // Test database auth context before main query
      try {
        const { data: authTest, error: authError } = await supabase.rpc('get_current_user_role');
        console.log('Database auth context test:', { 
          role: authTest, 
          error: authError?.message || 'none' 
        });
      } catch (testError) {
        console.error('Auth context test failed:', testError);
      }

      const query = supabase
        .from('incidents')
        .select(`
          *,
          submitted_by_profile:profiles!incidents_submitted_by_fkey(id, first_name, last_name, email),
          assigned_to_profile:profiles!incidents_assigned_to_fkey(id, first_name, last_name, email)
        `);

      // RLS policy handles the filtering:
      // - Non-admins see only their school's incidents  
      // - Admins see all incidents

      const { data, error } = await query.order('created_at', { ascending: false });

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

      return data as unknown as Incident[];
    },
    enabled: !!userProfile?.school_id && !!session,
    retry: (failureCount, error: any) => {
      // Retry on JWT/auth errors up to 2 times
      if ((error?.message?.includes('JWT') || error?.code === 'PGRST301') && failureCount < 2) {
        return true;
      }
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
};