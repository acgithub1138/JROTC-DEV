import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EventWithTemplate {
  id: string;
  name: string;
  jrotc_program: string;
}

export const useEventsWithTemplates = (program?: string) => {
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['cp_events_with_templates', program],
    queryFn: async () => {
      let query = (supabase as any)
        .from('cp_events_with_templates')
        .select('*')
        .order('name', { ascending: true });
      
      if (program) {
        query = query.eq('jrotc_program', program);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Deduplicate by ID since the view can return multiple rows per event
      // when templates exist for multiple JROTC programs
      const uniqueEvents = (data || []).reduce((acc: EventWithTemplate[], event: EventWithTemplate) => {
        if (!acc.some(e => e.id === event.id)) {
          acc.push(event);
        }
        return acc;
      }, []);
      
      return uniqueEvents;
    }
  });

  return {
    events,
    isLoading,
    error
  };
};
