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
  const { competitionId } = useParams<{ competitionId: string }>();
  const { toast } = useToast();
  
  const [results, setResults] = useState<EventResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!competitionId) return;
    
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        // First, get all events for this competition with registration counts
        const { data: eventsData, error: eventsError } = await supabase
          .from('cp_comp_events')
          .select(`
            id,
            location,
            event,
            cp_events!inner(name),
            cp_event_registrations!left(school_id, status)
          `)
          .eq('competition_id', competitionId);

        if (eventsError) throw eventsError;

        // Get all results for this competition from competition_events
        const { data: resultsData, error: resultsError } = await supabase
          .from('competition_events')
          .select('*')
          .eq('source_competition_id', competitionId);

        if (resultsError) throw resultsError;

        console.log('Results data for competition:', competitionId, resultsData);

        // Get school names for results
        const schoolIds = [...new Set((resultsData || []).map(r => r.school_id))];
        let schoolNamesMap: Record<string, string> = {};
        
        if (schoolIds.length > 0) {
          const { data: schoolsData, error: schoolsError } = await supabase
            .from('cp_comp_schools')
            .select('school_id, school_name')
            .eq('competition_id', competitionId)
            .in('school_id', schoolIds);

          if (schoolsError) throw schoolsError;
          
          schoolNamesMap = (schoolsData || []).reduce((acc, school) => {
            acc[school.school_id] = school.school_name || 'Unknown School';
            return acc;
          }, {} as Record<string, string>);
        }

        // We already have event names from cp_events in the eventsData query
        // No need for separate eventNamesMap since we can get names directly

        // Process the data to create event results
        const eventResults: EventResult[] = (eventsData || []).map(event => {
          const eventName = event.cp_events?.name || 'Unknown Event';
          const registeredSchools = (event.cp_event_registrations || [])
            .filter((reg: any) => reg.status === 'registered')
            .length;

          // Find results for this specific event by matching the event name
          const eventScores = (resultsData || []).filter(
            (result: any) => result.event === eventName
          );

          console.log(`Event: ${eventName}, Event scores found:`, eventScores);

          // Count unique schools that have submitted scores (not individual score entries)
          const uniqueSchools = new Set(eventScores.map((score: any) => score.school_id));
          const completedScores = uniqueSchools.size;
          const totalScores = registeredSchools;

          // Find top score and school
          let topSchool: string | null = null;
          let topScore: number | null = null;

          if (eventScores.length > 0) {
            const topResult = eventScores.reduce((prev: any, current: any) => {
              const prevScore = Number(prev.total_points) || 0;
              const currentScore = Number(current.total_points) || 0;
              return currentScore > prevScore ? current : prev;
            });
            
            topSchool = schoolNamesMap[topResult.school_id] || topResult.team_name || 'Unknown School';
            topScore = Number(topResult.total_points) || 0;
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
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [competitionId, toast]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
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

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
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
        {results.length > 0 ? (
          results.map((result) => (
            <Card key={result.comp_event_id} className="bg-card border-border hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                        {result.event_name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <Trophy size={12} className="mr-1" />
                        {result.top_school ? `Leading: ${result.top_school}` : 'No scores yet'}
                      </p>
                    </div>
                    <Badge 
                      variant={result.completed_scores === result.total_scores && result.total_scores > 0 ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {result.completed_scores === result.total_scores && result.total_scores > 0 ? 'Complete' : 
                       result.completed_scores > 0 ? 'In Progress' : 'Not Started'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Users size={12} className="mr-1" />
                      {result.registered_schools} schools
                    </div>
                    {result.top_score !== null && (
                      <div className="flex items-center">
                        <Medal size={12} className="mr-1" />
                        Top: {result.top_score.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Scores: {result.completed_scores}/{result.total_scores} submitted
                    </div>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <Eye size={12} className="mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No Events Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add events to this competition to track results and scores.
              </p>
              <Button 
                className="bg-primary text-primary-foreground"
                onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/events`)}
              >
                <FileText size={16} className="mr-2" />
                Manage Events
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};