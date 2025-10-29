import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EventWithTemplate {
  name: string;
  uuid: string;
}

export const useEventsWithTemplates = () => {
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['cp_events_with_templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('cp_events_with_templates')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return (data || []) as EventWithTemplate[];
    }
  });

  return {
    events,
    isLoading,
    error
  };
};
