import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRoleValidation = () => {
  const { userProfile } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const checkRoleUniqueness = useCallback(async (
    roleName: string, 
    excludeJobId?: string
  ): Promise<{ isUnique: boolean; error?: string }> => {
    if (!roleName.trim() || !userProfile?.school_id) {
      return { isUnique: true };
    }

    setIsChecking(true);
    
    try {
      let query = supabase
        .from('job_board')
        .select('id, role')
        .eq('school_id', userProfile.school_id)
        .eq('role', roleName.trim())
        .limit(1);

      // Exclude current job if we're editing
      if (excludeJobId) {
        query = query.neq('id', excludeJobId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking role uniqueness:', error);
        return { isUnique: true, error: 'Could not validate role uniqueness' };
      }

      return { isUnique: data.length === 0 };
    } catch (error) {
      console.error('Error in role uniqueness check:', error);
      return { isUnique: true, error: 'Could not validate role uniqueness' };
    } finally {
      setIsChecking(false);
    }
  }, [userProfile?.school_id]);

  return {
    checkRoleUniqueness,
    isChecking
  };
};