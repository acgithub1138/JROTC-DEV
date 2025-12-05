import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const ScoreSheetsWidget = () => {
  const { userProfile } = useAuth();

  const { data: scoreSheetStats } = useQuery({
    queryKey: ['score-sheets-stats', userProfile?.school_id],
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
        return { totalSubmitted: 0, totalNeeded: 0, uniqueEvents: 0, uniqueSchools: 0 };
      }

      // Get events
      const { data: events, error: eventsError } = await supabase
        .from('cp_comp_events')
        .select('id')
        .in('competition_id', compIds);

      if (eventsError) throw eventsError;

      const eventIds = events?.map(e => e.id) || [];
      if (eventIds.length === 0) {
        return { totalSubmitted: 0, totalNeeded: 0, uniqueEvents: 0, uniqueSchools: 0 };
      }

      // Get event registrations to count schools per event
      const { data: registrations, error: regsError } = await supabase
        .from('cp_event_registrations')
        .select('event_id, school_id')
        .in('competition_id', compIds);

      if (regsError) throw regsError;

      // Get actual judge assignments per event
      const { data: judgeAssignments, error: judgesError } = await supabase
        .from('cp_comp_judges')
        .select('event')
        .in('competition_id', compIds);

      if (judgesError) throw judgesError;

      // Calculate total score sheets needed using actual assigned judges count
      let totalNeeded = 0;
      events?.forEach(event => {
        const schoolCount = registrations?.filter(r => r.event_id === event.id).length || 0;
        const actualJudgesCount = judgeAssignments?.filter(j => j.event === event.id).length || 0;
        totalNeeded += actualJudgesCount * schoolCount;
      });

      // Get submitted score sheets
      const { data: scoreSheets, error: scoreSheetsError } = await supabase
        .from('competition_events')
        .select('id, event, school_id, source_competition_id')
        .in('source_competition_id', compIds)
        .eq('source_type', 'portal');

      if (scoreSheetsError) throw scoreSheetsError;

      const totalSubmitted = scoreSheets?.length || 0;
      const uniqueEvents = new Set(scoreSheets?.map(s => s.event)).size;
      const uniqueSchools = new Set(scoreSheets?.map(s => s.school_id)).size;

      return { totalSubmitted, totalNeeded, uniqueEvents, uniqueSchools };
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className="group relative overflow-hidden border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">Score Sheets</CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
          <FileText className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
          {scoreSheetStats?.totalSubmitted ?? 0} / {scoreSheetStats?.totalNeeded ?? 0}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{scoreSheetStats?.uniqueEvents ?? 0} Events</span>
          <span>•</span>
          <span>{scoreSheetStats?.uniqueSchools ?? 0} Schools</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Submitted / Needed</p>
      </CardContent>
    </Card>
  );
};
