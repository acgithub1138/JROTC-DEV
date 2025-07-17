import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTasksRealtime = (schoolId: string | undefined) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!schoolId || isSubscribedRef.current) return;

    console.log('Setting up tasks real-time subscription for school:', schoolId);
    
    // Mark as subscribed immediately to prevent duplicate subscriptions
    isSubscribedRef.current = true;

    const channel = supabase
      .channel(`tasks-realtime-${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `school_id=eq.${schoolId}`,
        },
        (payload) => {
          console.log('Task change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['tasks', schoolId] });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('Cleaning up tasks real-time subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, [schoolId, queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, []);
};