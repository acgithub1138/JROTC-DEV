import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Trophy, FileText } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

interface ScoreSheet {
  id: string;
  created_at: string;
  total_points: number;
  score_sheet: {
    judge_number: string;
    scores: Record<string, any>;
  };
  competition_name: string;
  competition_start_date: string;
  competition_location: string;
  event_name: string;
  school_name: string;
}

export const JudgesMyScoreSheetsPage = () => {
  const { data: scoreSheets, isLoading } = useQuery({
    queryKey: ['my-score-sheets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('competition_events')
        .select(`
          id,
          created_at,
          total_points,
          score_sheet,
          source_competition_id,
          event,
          school_id
        `)
        .eq('created_by', user.id)
        .eq('source_type', 'portal')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional details for each score sheet
      const enrichedData = await Promise.all(
        (data || []).map(async (sheet) => {
          let competitionName = 'Unknown Competition';
          let competitionStartDate = '';
          let competitionLocation = '';

          if (sheet.source_competition_id) {
            const { data: compData } = await supabase
              .from('cp_competitions')
              .select('name, start_date, location, status')
              .eq('id', sheet.source_competition_id)
              .in('status', ['in_progress', 'open'])
              .maybeSingle();

            if (compData) {
              competitionName = compData.name;
              competitionStartDate = compData.start_date;
              competitionLocation = compData.location || '';
            }
          }

          let eventName = 'Unknown Event';
          if (sheet.event) {
            const { data: eventData } = await supabase
              .from('competition_event_types')
              .select('name')
              .eq('id', sheet.event)
              .maybeSingle();

            if (eventData) {
              eventName = eventData.name;
            }
          }

          let schoolName = 'Unknown School';
          if (sheet.school_id) {
            const { data: schoolData } = await supabase
              .from('cp_comp_schools')
              .select('school_name')
              .eq('school_id', sheet.school_id)
              .maybeSingle();

            if (schoolData?.school_name) {
              schoolName = schoolData.school_name;
            }
          }

          return {
            id: sheet.id,
            created_at: sheet.created_at,
            total_points: sheet.total_points || 0,
            score_sheet: sheet.score_sheet as any,
            competition_name: competitionName,
            competition_start_date: competitionStartDate,
            competition_location: competitionLocation,
            event_name: eventName,
            school_name: schoolName,
          };
        })
      );

      // Filter out sheets without valid competition data
      return enrichedData.filter(sheet => sheet.competition_start_date);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-br from-judge to-judge/70 bg-clip-text text-transparent">
            My Score Sheets
          </h1>
          <p className="text-muted-foreground mt-2">
            View all score sheets you've submitted for active competitions
          </p>
        </div>

        {!scoreSheets || scoreSheets.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Score Sheets Yet</h3>
            <p className="text-muted-foreground">
              Score sheets you submit will appear here
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {scoreSheets.map((sheet) => (
              <Card key={sheet.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <Trophy className="h-5 w-5 text-judge mt-1 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-lg">{sheet.competition_name}</h3>
                        <p className="text-sm text-muted-foreground">{sheet.event_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatInTimeZone(
                          new Date(sheet.competition_start_date),
                          'America/New_York',
                          'MMM dd, yyyy'
                        )}
                      </span>
                    </div>

                    {sheet.competition_location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{sheet.competition_location}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium">School: {sheet.school_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Judge #{sheet.score_sheet?.judge_number || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-judge">
                        {sheet.total_points}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Points</div>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      Submitted {formatInTimeZone(
                        new Date(sheet.created_at),
                        'America/New_York',
                        'MMM dd, HH:mm'
                      )}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
