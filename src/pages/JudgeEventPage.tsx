import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useJudgeEventDetails } from '@/hooks/judges-portal/useJudgeEventDetails';
import { useEventScoreSheets } from '@/hooks/judges-portal/useEventScoreSheets';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useAuth } from '@/contexts/AuthContext';
import { convertToUI } from '@/utils/timezoneUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SchoolSelector } from '@/components/competition-portal/my-competitions/components/score-sheet-viewer/SchoolSelector';
import { JudgeScoreEntryForm } from '@/components/judges-portal/JudgeScoreEntryForm';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';

export const JudgeEventPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('competitionId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { timezone } = useSchoolTimezone();
  
  const {
    eventDetails,
    registeredSchools,
    isLoading,
    error
  } = useJudgeEventDetails(eventId, competitionId || undefined);
  
  // Get schools that already have submitted score sheets from this judge
  const { data: submittedSchoolIds = new Set() } = useEventScoreSheets(
    eventDetails?.event_id,
    competitionId || undefined,
    user?.id
  );
  
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');

  // Filter out schools that already have submissions from this judge
  const availableSchools = useMemo(() => {
    return registeredSchools.filter(school => !submittedSchoolIds.has(school.school_id));
  }, [registeredSchools, submittedSchoolIds]);

  // Set default school when available schools load
  useEffect(() => {
    if (availableSchools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(availableSchools[0].school_id);
    }
  }, [availableSchools, selectedSchoolId]);
  if (isLoading) {
    return <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>;
  }
  if (error || !eventDetails) {
    return <div className="p-8">
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
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-judge/5 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Judge Event
            </h1>
            <p className="text-muted-foreground text-lg">
              Score sheets for {eventDetails.event_name}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/app/judges-portal')} className="shadow-sm hover:shadow-md transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
        </div>

        <Card className="border-judge/20 hover:border-judge/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-judge/10">
          <CardHeader className="bg-gradient-to-br from-card to-judge/5 border-b">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-md">
                <Clock className="h-5 w-5 text-black" />
              </div>
              {eventDetails.event_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {eventDetails.event_start_time && <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-judge/5 to-transparent border border-judge/10 hover:border-judge/20 transition-all">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Clock className="h-4 w-4 text-black" />
                </div>
                <span className="text-sm font-medium">
                  {convertToUI(eventDetails.event_start_time, timezone, 'time')}
                  {eventDetails.event_end_time && ` - ${convertToUI(eventDetails.event_end_time, timezone, 'time')}`}
                </span>
              </div>}
            {eventDetails.event_location && <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-judge/5 to-transparent border border-judge/10 hover:border-judge/20 transition-all">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-judge to-judge/70 flex items-center justify-center shadow-sm flex-shrink-0">
                  <MapPin className="h-4 w-4 text-black" />
                </div>
                <span className="text-sm font-medium">{eventDetails.event_location}</span>
              </div>}
          </CardContent>
        </Card>

        {availableSchools.length === 0 ? <Card className="border-judge/20">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground text-lg">
                {registeredSchools.length === 0 
                  ? 'No schools registered for this event.'
                  : 'All schools have been scored.'}
              </p>
            </CardContent>
          </Card> : <div className="space-y-6">
            <Card className="border-judge/20 hover:border-judge/40 transition-all duration-300 shadow-lg">
              <CardHeader className="bg-gradient-to-br from-card to-judge/5 border-b">
                <CardTitle className="text-lg">Select School</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <SchoolSelector schools={availableSchools.map(s => ({
              id: s.school_id,
              name: s.school_name
            }))} selectedSchoolId={selectedSchoolId} onSchoolChange={setSelectedSchoolId} />
              </CardContent>
            </Card>

            {selectedSchoolId && eventDetails?.score_sheet && <JudgeScoreEntryForm templateId={eventDetails.score_sheet} schoolId={selectedSchoolId} eventId={eventDetails.event_id} competitionId={competitionId || ''} onSuccess={() => {
          toast.success('Score sheet submitted successfully');
        }} />}
          </div>}
      </div>
    </div>;
};