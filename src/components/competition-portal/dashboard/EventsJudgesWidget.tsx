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
        return { totalEvents: 0, totalJudgesNeeded: 0, totalRegistrations: 0 };
      }

      // Get events with judges needed and registrations
      const { data: events, error: eventsError } = await supabase
        .from('cp_comp_events')
        .select('id, judges_needed')
        .in('competition_id', compIds);

      if (eventsError) throw eventsError;

      const eventIds = events?.map(e => e.id) || [];
      const totalJudgesNeeded = events?.reduce((sum, e) => sum + (Number(e.judges_needed) || 0), 0) || 0;

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
        totalJudgesNeeded,
        totalRegistrations,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Events Overview</CardTitle>
        <Calendar className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{eventStats?.totalEvents ?? 0}</div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span>Judges Needed: {eventStats?.totalJudgesNeeded ?? 0}</span>
          <span>Registrations: {eventStats?.totalRegistrations ?? 0}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Active competitions</p>
      </CardContent>
    </Card>
  );
};
