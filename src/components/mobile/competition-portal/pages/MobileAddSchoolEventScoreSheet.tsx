import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ScoreSheetItem {
  id: string;
  criteria: string;
  max_score: number;
  score?: number;
}

export const MobileAddSchoolEventScoreSheet: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId, schoolId } = useParams<{ competitionId: string; schoolId: string }>();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [scoreSheet, setScoreSheet] = useState<ScoreSheetItem[]>([]);
  const [teamName, setTeamName] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch available events for this competition
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['competition-events', competitionId],
    queryFn: async () => {
      if (!competitionId) return [];
      const { data, error } = await supabase
        .from('cp_comp_events')
        .select(`
          id,
          location,
          start_time,
          end_time,
          cp_events:event(name)
        `)
        .eq('competition_id', competitionId)
        .order('start_time');

      if (error) throw error;
      return data;
    },
    enabled: !!competitionId
  });

  // Fetch school details
  const { data: school } = useQuery({
    queryKey: ['competition-school', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select('school_name, school_id')
        .eq('id', schoolId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!schoolId
  });

  // Fetch score sheet template when event is selected
  const { data: scoreTemplate } = useQuery({
    queryKey: ['score-template', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      const { data, error } = await supabase
        .from('cp_events')
        .select(`
          score_sheet,
          competition_templates:score_sheet(
            scores,
            template_name
          )
        `)
        .eq('id', selectedEventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedEventId
  });

  // Initialize score sheet when template is loaded
  React.useEffect(() => {
    if (scoreTemplate?.competition_templates?.scores) {
      const template = scoreTemplate.competition_templates.scores as any;
      if (template.criteria && Array.isArray(template.criteria)) {
        const initialScoreSheet = template.criteria.map((criterion: any, index: number) => ({
          id: `${index}`,
          criteria: criterion.name || criterion,
          max_score: criterion.max_score || 10,
          score: 0
        }));
        setScoreSheet(initialScoreSheet);
      }
    }
  }, [scoreTemplate]);

  const createScoreSheetMutation = useMutation({
    mutationFn: async (scoreSheetData: any) => {
      if (!userProfile?.school_id || !selectedEventId || !school?.school_id) {
        throw new Error('Missing required data');
      }

      // Get the event details to use the correct event enum value
      const eventDetails = events?.find(e => e.id === selectedEventId);
      if (!eventDetails?.cp_events?.name) {
        throw new Error('Event not found');
      }

      const { data, error } = await supabase
        .from('competition_events')
        .insert({
          school_id: userProfile.school_id,
          competition_id: competitionId,
          event: eventDetails.cp_events.name as any, // Use the event name from cp_events
          team_name: teamName || school.school_name,
          score_sheet: scoreSheetData,
          total_points: scoreSheetData.reduce((sum: number, item: any) => sum + (item.score || 0), 0),
          source_type: 'portal',
          source_competition_id: competitionId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Score sheet created successfully');
      queryClient.invalidateQueries({ queryKey: ['competition-events'] });
      navigate(`/mobile/competition-portal/manage/${competitionId}/schools`);
    },
    onError: (error) => {
      console.error('Error creating score sheet:', error);
      toast.error('Failed to create score sheet');
    }
  });

  const handleScoreChange = (id: string, score: number) => {
    setScoreSheet(prev => 
      prev.map(item => 
        item.id === id ? { ...item, score: Math.max(0, Math.min(score, item.max_score)) } : item
      )
    );
  };

  const handleSubmit = () => {
    if (!selectedEventId) {
      toast.error('Please select an event');
      return;
    }

    if (scoreSheet.length === 0) {
      toast.error('Score sheet is empty');
      return;
    }

    createScoreSheetMutation.mutate(scoreSheet);
  };

  const totalScore = scoreSheet.reduce((sum, item) => sum + (item.score || 0), 0);
  const maxPossibleScore = scoreSheet.reduce((sum, item) => sum + item.max_score, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/schools`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add Score Sheet</h1>
            <p className="text-sm text-muted-foreground">
              {school?.school_name || 'Loading...'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!selectedEventId || scoreSheet.length === 0 || createScoreSheetMutation.isPending}
          className="h-8 w-8 p-0"
        >
          <Save size={16} />
        </Button>
      </div>

      {/* Event Selection */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Select Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event">Event</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.cp_events?.name} - {event.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name (Optional)</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={school?.school_name || "Enter team name..."}
            />
          </div>
        </CardContent>
      </Card>

      {/* Score Sheet */}
      {scoreSheet.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Score Sheet</CardTitle>
              <Badge variant="outline">
                {totalScore} / {maxPossibleScore}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {scoreSheet.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.criteria}</p>
                  <p className="text-xs text-muted-foreground">Max: {item.max_score}</p>
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min="0"
                    max={item.max_score}
                    value={item.score || 0}
                    onChange={(e) => handleScoreChange(item.id, parseInt(e.target.value) || 0)}
                    className="text-center text-sm h-8"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};