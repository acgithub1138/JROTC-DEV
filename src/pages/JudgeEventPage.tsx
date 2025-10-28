import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJudgeEventDetails } from '@/hooks/judges-portal/useJudgeEventDetails';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToUI } from '@/utils/timezoneUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SchoolSelector } from '@/components/competition-portal/my-competitions/components/score-sheet-viewer/SchoolSelector';
import { ScoreSheetTable } from '@/components/competition-portal/my-competitions/components/score-sheet-viewer/ScoreSheetTable';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';

export const JudgeEventPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('competitionId');
  const navigate = useNavigate();
  const { timezone } = useSchoolTimezone();

  const { eventDetails, registeredSchools, isLoading, error } = useJudgeEventDetails(eventId, competitionId || undefined);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');

  // Set default school when schools load
  useEffect(() => {
    if (registeredSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(registeredSchools[0].school_id);
    }
  }, [registeredSchools, selectedSchoolId]);

  // Fetch score sheets for the selected school and event
  const { data: events = [], isLoading: isLoadingEvents, refetch } = useQuery({
    queryKey: ['judge-event-score-sheets', selectedSchoolId, competitionId, eventDetails?.event_id],
    enabled: !!selectedSchoolId && !!competitionId && !!eventDetails?.event_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_events')
        .select('*')
        .eq('school_id', selectedSchoolId as string)
        .eq('source_competition_id', competitionId as string)
        .eq('event', eventDetails?.event_id as string)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !eventDetails) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Error loading event details: {error?.message || 'Event not found'}</p>
              <Button onClick={() => navigate('/app/judges-portal')} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-br from-judge to-judge/70 bg-clip-text text-transparent">
              Judge Event
            </h1>
            <p className="text-muted-foreground mt-2">
              Score sheets for {eventDetails.event_name}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/app/judges-portal')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{eventDetails.event_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventDetails.event_start_time && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {convertToUI(eventDetails.event_start_time, timezone, 'time')}
                  {eventDetails.event_end_time && 
                    ` - ${convertToUI(eventDetails.event_end_time, timezone, 'time')}`
                  }
                </span>
              </div>
            )}
            {eventDetails.event_location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{eventDetails.event_location}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {registeredSchools.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">No schools registered for this event.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <SchoolSelector
                  schools={registeredSchools.map(s => ({ id: s.school_id, name: s.school_name }))}
                  selectedSchoolId={selectedSchoolId}
                  onSchoolChange={setSelectedSchoolId}
                />
              </CardContent>
            </Card>

            {selectedSchoolId && (
              <Card>
                <CardHeader>
                  <CardTitle>Score Sheets</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingEvents ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ScoreSheetTable
                      events={events}
                      onEventsRefresh={refetch}
                      competitionId={competitionId || ''}
                      isInternal={false}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
