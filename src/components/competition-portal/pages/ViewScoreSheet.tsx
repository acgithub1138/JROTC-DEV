import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ScoreSheetTable as PortalScoreSheetTable } from '@/components/competition-portal/my-competitions/components/score-sheet-viewer/ScoreSheetTable';
import { useCompetitionResultsPermissions } from '@/hooks/useModuleSpecificPermissions';
export const ViewScoreSheet: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Extract competition ID correctly from URL path
  const getCompetitionIdFromPath = () => {
    const pathSegments = location.pathname.split('/');
    const competitionDetailsIndex = pathSegments.findIndex(segment => segment === 'competition-details');
    if (competitionDetailsIndex !== -1 && pathSegments[competitionDetailsIndex + 1]) {
      return pathSegments[competitionDetailsIndex + 1];
    }
    return params.competitionId;
  };
  const competitionId = getCompetitionIdFromPath();
  const eventId = searchParams.get('eventId');
  const schoolId = searchParams.get('schoolId');
  const eventName = searchParams.get('eventName');
  const {
    canViewDetails
  } = useCompetitionResultsPermissions();
  const [eventSheets, setEventSheets] = useState<any[]>([]);
  const [schoolName, setSchoolName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log('ViewScoreSheet permissions:', {
    canViewDetails,
    eventSheets
  });
  console.log('ViewScoreSheet eventSheets length:', eventSheets.length);
  const fetchEventSheets = async () => {
    if (!eventId || !schoolId || !competitionId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch school name
      const {
        data: schoolData,
        error: schoolError
      } = await supabase.from('cp_comp_schools').select('school_name').eq('school_id', schoolId).eq('competition_id', competitionId).single();
      if (schoolError) throw schoolError;
      setSchoolName(schoolData?.school_name || 'Unknown School');

      // Fetch event sheets
      const {
        data,
        error
      } = await supabase.from('competition_events').select('id, event, score_sheet, total_points, cadet_ids, team_name, school_id, created_at').eq('source_type', 'portal').eq('source_competition_id', competitionId).eq('event', eventId as any).eq('school_id', schoolId as any);
      if (error) throw error;

      // Sort events by judge number to ensure proper column order
      const sortedEvents = (data || []).sort((a, b) => {
        const scoreSheetA = a.score_sheet as any;
        const scoreSheetB = b.score_sheet as any;
        const judgeA = scoreSheetA?.judge_number || '';
        const judgeB = scoreSheetB?.judge_number || '';

        // If both have judge numbers, sort by them
        if (judgeA && judgeB) {
          // Extract number from "Judge X" format
          const numA = parseInt(judgeA.replace(/\D/g, '')) || 0;
          const numB = parseInt(judgeB.replace(/\D/g, '')) || 0;
          if (numA !== numB) return numA - numB;
        }

        // If only one has judge number, prioritize it
        if (judgeA && !judgeB) return -1;
        if (!judgeA && judgeB) return 1;

        // Fallback to creation date
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      setEventSheets(sortedEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to load score sheets');
      setEventSheets([]);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchEventSheets();
  }, [eventId, schoolId, competitionId]);
  const handleEventsRefresh = async () => {
    // Small delay to ensure database updates are committed
    await new Promise(resolve => setTimeout(resolve, 200));
    await fetchEventSheets();
  };
  if (!canViewDetails) {
    return <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view score sheet details.</p>
        </div>
      </div>;
  }
  if (!eventId || !schoolId || !competitionId) {
    return <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Request</h1>
          <p className="text-muted-foreground">Missing required parameters for viewing score sheets.</p>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <Button variant="outline" onClick={() => navigate(`/app/competition-portal/competition-details/${competitionId}/results`)} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Results
      </Button>
      
      <div>
        <h1 className="text-3xl font-bold">Score Sheet Details</h1>
        <p className="text-muted-foreground">
          {eventName ? `${eventName} - ${schoolName}` : `Event ${eventId} - ${schoolName}`}
        </p>
      </div>

      <Card>
        <CardHeader className="py-[8px]">
          <CardTitle>Score Sheets</CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          {isLoading ? <div className="p-8 text-center text-muted-foreground">
              Loading score sheets...
            </div> : error ? <div className="p-8 text-center">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchEventSheets} className="mt-4">
                Try Again
              </Button>
            </div> : eventSheets.length === 0 ? <div className="p-8 text-center text-muted-foreground">
              No score sheets found for this school and event.
            </div> : <PortalScoreSheetTable events={eventSheets as any} onEventsRefresh={handleEventsRefresh} competitionId={competitionId} />}
        </CardContent>
      </Card>
    </div>;
};