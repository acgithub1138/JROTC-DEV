import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EventWithTemplate {
  name: string;
  uuid: string;
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
      return (data || []) as EventWithTemplate[];
    }
  });

  return {
    events,
    isLoading,
    error
  };
};
