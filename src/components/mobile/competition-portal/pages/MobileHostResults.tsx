import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Medal, Users, Eye, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface EventResult {
  comp_event_id: string;
  event_name: string;
  location: string;
  registered_schools: number;
  completed_scores: number;
  total_scores: number;
  top_school: string | null;
  top_score: number | null;
}
export const MobileHostResults: React.FC = () => {
  const navigate = useNavigate();
  const {
    competitionId
  } = useParams<{
    competitionId: string;
  }>();
  const {
    toast
  } = useToast();
  const [results, setResults] = useState<EventResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!competitionId) return;
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        // First, get all events for this competition with registration counts
        const {
          data: eventsData,
          error: eventsError
        } = await supabase.from('cp_comp_events').select(`
            id,
            location,
            cp_events!inner(name),
            cp_event_registrations!left(school_id, status)
          `).eq('competition_id', competitionId);
        if (eventsError) throw eventsError;

        // Then get all results for this competition with school names
        const {
          data: resultsData,
          error: resultsError
        } = await supabase.from('competition_results').select('*').eq('competition_id', competitionId);
        if (resultsError) throw resultsError;

        // Get school names for results
        const schoolIds = [...new Set((resultsData || []).map(r => r.school_id))];
        let schoolNamesMap: Record<string, string> = {};
        if (schoolIds.length > 0) {
          const {
            data: schoolsData,
            error: schoolsError
          } = await supabase.from('cp_comp_schools').select('school_id, school_name').eq('competition_id', competitionId).in('school_id', schoolIds);
          if (schoolsError) throw schoolsError;
          schoolNamesMap = (schoolsData || []).reduce((acc, school) => {
            acc[school.school_id] = school.school_name || 'Unknown School';
            return acc;
          }, {} as Record<string, string>);
        }

        // Process the data to create event results
        const eventResults: EventResult[] = (eventsData || []).map(event => {
          const eventName = event.cp_events?.name || 'Unknown Event';
          const registeredSchools = (event.cp_event_registrations || []).filter((reg: any) => reg.status === 'registered').length;

          // Since competition_results doesn't currently have event_id,
          // we can't associate results with specific events.
          // For now, we'll show 0 completed scores until the schema is updated
          const eventScores: any[] = [];
          const completedScores = 0; // Will be updated when event_id is added to competition_results
          const totalScores = registeredSchools;

          // Find top score and school
          let topSchool: string | null = null;
          let topScore: number | null = null;
          if (eventScores.length > 0) {
            const topResult = eventScores.reduce((prev: any, current: any) => {
              const prevScore = Number(prev.score) || 0;
              const currentScore = Number(current.score) || 0;
              return currentScore > prevScore ? current : prev;
            });
            topSchool = schoolNamesMap[topResult.school_id] || 'Unknown School';
            topScore = Number(topResult.score) || 0;
          }
          return {
            comp_event_id: event.id,
            event_name: eventName,
            location: event.location || 'TBD',
            registered_schools: registeredSchools,
            completed_scores: completedScores,
            total_scores: totalScores,
            top_school: topSchool,
            top_score: topScore
          };
        });
        setResults(eventResults);
      } catch (error) {
        console.error('Error fetching results:', error);
        toast({
          title: "Error",
          description: "Failed to load competition results",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [competitionId, toast]);
  if (isLoading) {
    return <div className="p-4 space-y-4">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)} className="mr-3 p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
        </div>
        {[...Array(3)].map((_, index) => <Card key={index} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>)}
      </div>;
  }
  return <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)} className="mr-3 p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Results</h1>
            <p className="text-sm text-muted-foreground">Competition scores and results</p>
          </div>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground">
          <FileText size={16} className="mr-1" />
          Export
        </Button>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.length > 0 ? results.map(result => {}) : <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Events Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add events to this competition to track results and scores.
              </p>
              <Button className="bg-primary text-primary-foreground" onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/events`)}>
                <FileText size={16} className="mr-2" />
                Manage Events
              </Button>
            </CardContent>
          </Card>}
      </div>
    </div>;
};