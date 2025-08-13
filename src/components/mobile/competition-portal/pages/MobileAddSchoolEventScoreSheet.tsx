import React, { useState, useMemo } from 'react';
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
import { 
  extractFieldsFromTemplate, 
  initializeScoresWithDefaults, 
  calculateTotalPoints,
  formatScoreSheetForDatabase
} from '@/utils/scoreSheet';
import type { ProcessedScoreField, ScoreValues } from '@/utils/scoreSheet';

// Using centralized types from utils

export const MobileAddSchoolEventScoreSheet: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId, schoolId } = useParams<{ competitionId: string; schoolId: string }>();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [judgeNumber, setJudgeNumber] = useState<string>('');
  const [processedFields, setProcessedFields] = useState<ProcessedScoreField[]>([]);
  const [scores, setScores] = useState<ScoreValues>({});
  const [teamName, setTeamName] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch available events for this competition that the school is registered for
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['competition-events', competitionId, schoolId],
    queryFn: async () => {
      if (!competitionId || !schoolId) return [];
      
      // Get school's actual school_id from cp_comp_schools
      const { data: compSchool, error: compSchoolError } = await supabase
        .from('cp_comp_schools')
        .select('school_id')
        .eq('id', schoolId)
        .single();

      if (compSchoolError) throw compSchoolError;
      if (!compSchool?.school_id) return [];

      // First get the registered event IDs
      const { data: registrations, error: regError } = await supabase
        .from('cp_event_registrations')
        .select('event_id')
        .eq('competition_id', competitionId)
        .eq('school_id', compSchool.school_id);

      if (regError) throw regError;
      if (!registrations?.length) return [];

      const registeredEventIds = registrations.map(r => r.event_id);

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
        .in('id', registeredEventIds)
        .order('start_time');

      if (error) throw error;
      return data;
    },
    enabled: !!competitionId && !!schoolId
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
  const { data: scoreTemplate, isLoading: templateLoading } = useQuery({
    queryKey: ['score-template', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      
      // First get the cp_events entry to find the score_sheet template ID
      const { data: eventData, error: eventError } = await supabase
        .from('cp_comp_events')
        .select(`
          cp_events:event (
            id,
            name,
            score_sheet
          )
        `)
        .eq('id', selectedEventId)
        .single();

      if (eventError) throw eventError;
      
      const templateId = eventData?.cp_events?.score_sheet;
      if (!templateId) return null;

      // Then fetch the actual template
      const { data: templateData, error: templateError } = await supabase
        .from('competition_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();

      if (templateError) throw templateError;
      return templateData;
    },
    enabled: !!selectedEventId
  });

  // Initialize score sheet when template is loaded
  React.useEffect(() => {
    if (scoreTemplate) {
      const fields = extractFieldsFromTemplate(scoreTemplate);
      setProcessedFields(fields);
      
      const initialScores = initializeScoresWithDefaults(fields);
      setScores(initialScores);
    }
  }, [scoreTemplate]);

  // Compute judge options based on template's configured judge count
  const maxJudges = useMemo(() => {
    if (!scoreTemplate) return 1;
    
    const tpl = scoreTemplate as any;
    // Prefer numeric 'judges' from competition_templates, else fallbacks
    const numericJudges = typeof tpl.judges === 'number'
      ? tpl.judges
      : (typeof tpl.judges === 'string' ? parseInt(tpl.judges, 10) : undefined);

    return (
      numericJudges ||
      tpl.numberOfJudges ||
      tpl.maxJudges ||
      (Array.isArray(tpl.judges) ? tpl.judges.length : undefined) ||
      tpl.judge_count ||
      (tpl?.scores as any)?.maxJudges ||
      (tpl?.scores as any)?.judge_count ||
      1
    );
  }, [scoreTemplate]);

  const judgeOptions = useMemo(
    () => Array.from({ length: Math.max(1, Math.min(Number(maxJudges) || 1, 10)) }, (_, i) => `Judge ${i + 1}`),
    [maxJudges]
  );

  const createScoreSheetMutation = useMutation({
    mutationFn: async (submittedScores: any) => {
      if (!userProfile?.school_id || !selectedEventId || !school?.school_id) {
        throw new Error('Missing required data');
      }

      // Get the event details to use the correct event enum value
      const eventDetails = events?.find(e => e.id === selectedEventId);
      if (!eventDetails?.cp_events?.name) {
        throw new Error('Event not found');
      }

      const totalPoints = calculateTotalPoints(processedFields, scores);
      const formattedScoreSheet = formatScoreSheetForDatabase(
        scoreTemplate?.id,
        scoreTemplate?.template_name,
        judgeNumber,
        scores
      );

      const { data, error } = await supabase
        .from('competition_events')
        .insert({
          school_id: userProfile.school_id,
          competition_id: competitionId,
          event: eventDetails.cp_events.name as any,
          team_name: teamName || school.school_name,
          score_sheet: formattedScoreSheet,
          total_points: totalPoints,
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

  const handleScoreChange = (id: string, value: any) => {
    setScores(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    if (!selectedEventId) {
      toast.error('Please select an event');
      return;
    }

    if (!judgeNumber) {
      toast.error('Please select a judge number');
      return;
    }

    if (processedFields.length === 0) {
      toast.error('Score sheet is empty');
      return;
    }

    createScoreSheetMutation.mutate(scores);
  };

  const totalScore = calculateTotalPoints(processedFields, scores);
  const maxPossibleScore = processedFields.reduce((sum, field) => {
    return sum + (field.type !== 'section_header' && field.type !== 'label' && !field.pauseField ? field.max_score : 0);
  }, 0);

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
          disabled={!selectedEventId || !judgeNumber || processedFields.length === 0 || createScoreSheetMutation.isPending}
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

          {/* Judge Number Selection */}
          {scoreTemplate && (
            <div className="space-y-2">
              <Label htmlFor="judgeNumber">
                Judge Number <span className="text-destructive">*</span>
              </Label>
              <Select value={judgeNumber} onValueChange={setJudgeNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="Select judge..." />
                </SelectTrigger>
                <SelectContent>
                  {judgeOptions.map((judge) => (
                    <SelectItem key={judge} value={judge}>
                      {judge}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Total judges in template: {Math.max(1, Number(maxJudges) || 1)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Sheet */}
      {templateLoading && selectedEventId && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Loading score sheet template...</p>
          </CardContent>
        </Card>
      )}
      
      {processedFields.length > 0 && (
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
            {processedFields.map((field) => {
              const currentScore = scores[field.id];
              
              // Handle penalty fields - only show for Judge 1
              const isPenalty = field.type === 'penalty' || 
                               field.name.toLowerCase().includes('penalty') || 
                               field.name.toLowerCase().includes('violation') || 
                               field.name.toLowerCase().includes('deduction') ||
                               field.name.toLowerCase().includes('incorrect commands') ||
                               field.name.toLowerCase().includes('uneven') ||
                               field.name.toLowerCase().includes('poor cadence') ||
                               field.name.toLowerCase().includes('missing cadets');

              if (isPenalty && judgeNumber !== 'Judge 1') {
                return null;
              }

              // Handle section headers
              if (field.type === 'section_header') {
                return (
                  <div key={field.id} className="border-b-2 border-primary pb-2 py-2">
                    <h3 className="text-lg font-bold text-primary">
                      {field.name}
                    </h3>
                  </div>
                );
              }

              // Handle pause fields (labels like "Example 19a", "Penalties")
              if (field.pauseField || field.type === 'bold_gray' || field.type === 'pause' || field.type === 'label') {
                return (
                  <div key={field.id} className="py-2">
                    <h4 className="font-semibold text-sm text-foreground border-b border-border pb-1">
                      {field.name}
                    </h4>
                  </div>
                );
              }

              return (
                <div key={field.id} className={`flex items-center justify-between p-3 rounded-lg ${
                  isPenalty ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'
                }`}>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${isPenalty ? 'text-destructive' : ''}`}>
                      {field.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max: {field.max_score}
                      {isPenalty && judgeNumber === 'Judge 1' && (
                        <span className="text-destructive"> • Penalty Field</span>
                      )}
                    </p>
                  </div>
                  <div className="w-20">
                    {field.type === 'penalty_checkbox' ? (
                      <input
                        type="checkbox"
                        checked={currentScore || false}
                        onChange={(e) => handleScoreChange(field.id, e.target.checked)}
                        className="w-5 h-5"
                      />
                    ) : field.type === 'text' || field.textType === 'notes' ? (
                      <Input
                        type="text"
                        value={currentScore || ''}
                        onChange={(e) => handleScoreChange(field.id, e.target.value)}
                        className="text-center text-sm h-8"
                        placeholder="Text"
                      />
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        max={field.max_score}
                        value={currentScore || 0}
                        onChange={(e) => handleScoreChange(field.id, parseInt(e.target.value) || 0)}
                        className={`text-center text-sm h-8 ${
                          isPenalty ? 'border-destructive focus:border-destructive' : ''
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {selectedEventId && !templateLoading && processedFields.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No score sheet template found for this event.
            </p>
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