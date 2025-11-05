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
        return { totalSubmitted: 0, uniqueEvents: 0, uniqueSchools: 0 };
      }

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

      return { totalSubmitted, uniqueEvents, uniqueSchools };
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Score Sheets</CardTitle>
        <FileText className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{scoreSheetStats?.totalSubmitted ?? 0}</div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span>{scoreSheetStats?.uniqueEvents ?? 0} Events</span>
          <span>{scoreSheetStats?.uniqueSchools ?? 0} Schools</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Submitted score sheets</p>
      </CardContent>
    </Card>
  );
};
