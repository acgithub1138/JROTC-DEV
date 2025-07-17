
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from './types';

export const useTasksQuery = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

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

    // Clean up any existing subscription first
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    const channel = supabase
      .channel(`tasks-changes-${userProfile.school_id}-${Date.now()}`)
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

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [userProfile?.school_id]); // Removed queryClient from dependencies

  return query;
};
