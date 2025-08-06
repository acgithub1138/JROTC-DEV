
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePermissionTest = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['permission-test', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;

      console.log('Testing permission system...');
      
      try {
        // Test basic permission checks
        const { data: canReadUsers, error: readError } = await supabase
          .rpc('current_user_has_permission', {
            module_name: 'users',
            action_name: 'read'
          });

        if (readError) {
          console.error('Error testing read permission:', readError);
          return { error: readError.message };
        }

        const { data: canCreateUsers, error: createError } = await supabase
          .rpc('current_user_has_permission', {
            module_name: 'users',
            action_name: 'create'
          });

        if (createError) {
          console.error('Error testing create permission:', createError);
          return { error: createError.message };
        }

        // Test role management functions
        const { data: canManageCadet, error: manageError } = await supabase
          .rpc('can_manage_user_role', {
            target_role_name: 'cadet'
          });

        if (manageError) {
          console.error('Error testing role management:', manageError);
          return { error: manageError.message };
        }

        const result = {
          canReadUsers,
          canCreateUsers,
          canManageCadet,
          userRole: userProfile.role,
          success: true
        };

        console.log('Permission test results:', result);
        return result;

      } catch (error) {
        console.error('Permission test failed:', error);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
    enabled: !!userProfile?.id
  });
};
