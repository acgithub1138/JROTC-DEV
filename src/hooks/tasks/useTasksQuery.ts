
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from './types';

export const useTasksQuery = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      return data as Task[];
    },
    enabled: !!userProfile?.school_id,
  });

  // Set up real-time subscription for tasks
  useEffect(() => {
    if (!userProfile?.school_id) return;

    const channel = supabase
      .channel(`tasks-changes-${userProfile.school_id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tasks',
          filter: `school_id=eq.${userProfile.school_id}`,
        },
        (payload) => {
          console.log('Task change detected:', payload);
          // Invalidate and refetch tasks data
          queryClient.invalidateQueries({ queryKey: ['tasks', userProfile.school_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.school_id, queryClient]);

  return query;
};
