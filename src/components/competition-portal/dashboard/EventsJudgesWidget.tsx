import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const EventsJudgesWidget = () => {
  const { userProfile } = useAuth();

  const { data: eventStats } = useQuery({
    queryKey: ['events-judges-stats', userProfile?.school_id],
    enabled: !!userProfile?.school_id,
    queryFn: async () => {
      const schoolId = userProfile!.school_id as string;

      // Get active competitions
      const { data: comps, error: compsError } = await supabase
        .from('cp_competitions')
        .select('id')
        .eq('school_id', schoolId)
        .eq('status', 'open');

      if (compsError) throw compsError;

      const compIds = comps?.map(c => c.id) || [];
      if (compIds.length === 0) {
        return { totalEvents: 0, totalRegistrations: 0 };
      }

      // Get events
      const { data: events, error: eventsError } = await supabase
        .from('cp_comp_events')
        .select('id')
        .in('competition_id', compIds);

      if (eventsError) throw eventsError;

      const eventIds = events?.map(e => e.id) || [];

      let totalRegistrations = 0;
      if (eventIds.length > 0) {
        const { data: regs, error: regsError } = await supabase
          .from('cp_event_registrations')
          .select('id')
          .in('event_id', eventIds)
          .eq('status', 'registered');

        if (regsError) throw regsError;
        totalRegistrations = regs?.length || 0;
      }

      return {
        totalEvents: events?.length || 0,
        totalRegistrations,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className="group relative overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">Events</CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
          {eventStats?.totalEvents ?? 0}
        </div>
        <div className="text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Teams Registered:</span>
            <span className="font-medium">{eventStats?.totalRegistrations ?? 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
