import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScoreSheetTable as PortalScoreSheetTable } from '@/components/competition-portal/my-competitions/components/score-sheet-viewer/ScoreSheetTable';

interface SchoolResult {
  school_id: string;
  school_name: string;
  total_points: number;
  judge_count: number;
}

export const MobileEventResultsView: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId, eventName } = useParams<{ competitionId: string; eventName: string }>();
  const { toast } = useToast();
  
  const [schools, setSchools] = useState<SchoolResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<SchoolResult | null>(null);
  const [eventSheets, setEventSheets] = useState<any[]>([]);
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  const decodedEventName = eventName ? decodeURIComponent(eventName) : '';

  useEffect(() => {
    if (!competitionId || !eventName) return;
    
    const fetchSchoolResults = async () => {
      setIsLoading(true);
      try {
        // Get all results for this event
        const { data: resultsData, error: resultsError } = await supabase
          .from('competition_events')
          .select('*')
          .eq('source_competition_id', competitionId)
          .eq('event', decodedEventName as any);

        if (resultsError) throw resultsError;

        // Get school names
        const schoolIds = [...new Set((resultsData || []).map(r => r.school_id))];
        const { data: schoolsData, error: schoolsError } = await supabase
          .from('cp_comp_schools')
          .select('school_id, school_name')
          .eq('competition_id', competitionId)
          .in('school_id', schoolIds);

        if (schoolsError) throw schoolsError;
        
        const schoolNamesMap = (schoolsData || []).reduce((acc, school) => {
          acc[school.school_id] = school.school_name || 'Unknown School';
          return acc;
        }, {} as Record<string, string>);

        // Aggregate results by school
        const schoolResults: Record<string, SchoolResult> = {};
        
        (resultsData || []).forEach(result => {
          if (!schoolResults[result.school_id]) {
            schoolResults[result.school_id] = {
              school_id: result.school_id,
              school_name: schoolNamesMap[result.school_id] || 'Unknown School',
              total_points: 0,
              judge_count: 0
            };
          }
          
          schoolResults[result.school_id].total_points += Number(result.total_points) || 0;
          schoolResults[result.school_id].judge_count += 1;
        });

        // Sort by total points descending
        const sortedSchools = Object.values(schoolResults).sort((a, b) => b.total_points - a.total_points);
        setSchools(sortedSchools);
      } catch (error) {
        console.error('Error fetching school results:', error);
        toast({
          title: "Error",
          description: "Failed to load school results",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolResults();
  }, [competitionId, decodedEventName, toast]);

  useEffect(() => {
    if (!selectedSchool) return;
    
    const fetchScoreSheets = async () => {
      setIsDialogLoading(true);
      try {
        const { data, error } = await supabase
          .from('competition_events')
          .select('id, event, score_sheet, total_points, cadet_ids, team_name, school_id, created_at')
          .eq('source_type', 'portal')
          .eq('source_competition_id', competitionId)
          .eq('event', decodedEventName as any)
          .eq('school_id', selectedSchool.school_id);

        if (error) throw error;
        setEventSheets(data || []);
      } catch (error) {
        console.error('Error fetching score sheets:', error);
        setEventSheets([]);
      } finally {
        setIsDialogLoading(false);
      }
    };

    fetchScoreSheets();
  }, [selectedSchool, competitionId, decodedEventName]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/results`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
        </div>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (selectedSchool) {
    return (
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => setSelectedSchool(null)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedSchool.school_name}</h1>
            <p className="text-sm text-muted-foreground">{decodedEventName} Score Sheets</p>
          </div>
        </div>

        {/* Score Sheets */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {isDialogLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading score sheets...</div>
            ) : eventSheets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No score sheets found for this school.</div>
            ) : (
              <div className="overflow-x-auto">
                <PortalScoreSheetTable events={eventSheets as any} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/results`)}
          className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{decodedEventName}</h1>
          <p className="text-sm text-muted-foreground">Schools with submitted results</p>
        </div>
      </div>

      {/* Schools List */}
      <div className="space-y-3">
        {schools.length > 0 ? (
          schools.map((school, index) => (
            <Card key={school.school_id} className="bg-card border-border hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                          {school.school_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Total: {school.total_points.toFixed(1)} points • {school.judge_count} score{school.judge_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSelectedSchool(school)}
                    className="flex-shrink-0"
                  >
                    <Eye size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <h3 className="font-medium text-foreground mb-2">No Results Found</h3>
              <p className="text-sm text-muted-foreground">
                No schools have submitted results for this event yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};