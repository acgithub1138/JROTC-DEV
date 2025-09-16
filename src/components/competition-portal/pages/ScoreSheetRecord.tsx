import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { ScoreSheetSection } from '@/components/competition-management/components/add-event/ScoreSheetSection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ScoreSheetRecord = () => {
  const navigate = useNavigate();
  const { '*': splat } = useParams();
  const [searchParams] = useSearchParams();

  // Extract competitionId and schoolRegistrationId from URL
  const competitionId = splat?.split('/')[2]; // competition-details/{competitionId}/score_sheet_record
  const mode = searchParams.get('mode') as 'create' | 'edit' | 'view' || 'create';
  const schoolRegistrationId = searchParams.get('school_id');

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Form fields
  const [selectedCompEventId, setSelectedCompEventId] = useState<string>('');
  const [judgeNumber, setJudgeNumber] = useState('');
  const [teamName, setTeamName] = useState('');
  const [scores, setScores] = useState<Record<string, any>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loaded context
  const [schoolInfo, setSchoolInfo] = useState<{ school_id: string; school_name: string } | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('ScoreSheetRecord - competitionId:', competitionId);
  console.log('ScoreSheetRecord - mode:', mode);
  console.log('ScoreSheetRecord - schoolRegistrationId:', schoolRegistrationId);

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  // Compute judge options based on template's configured judge count
  const maxJudges = useMemo(() => {
    const tpl = selectedTemplate || {};
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
      tpl?.scores?.maxJudges ||
      tpl?.scores?.judge_count ||
      1
    );
  }, [selectedTemplate]);

  const judgeOptions = useMemo(
    () => Array.from({ length: Math.max(1, Math.min(Number(maxJudges) || 1, 10)) }, (_, i) => `Judge ${i + 1}`),
    [maxJudges]
  );

  // Load school info (resolve cp_comp_schools -> school_id)
  useEffect(() => {
    const loadSchool = async () => {
      if (!schoolRegistrationId) return;
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select('school_id, school_name')
        .eq('id', schoolRegistrationId)
        .maybeSingle();
      if (error) {
        console.error(error);
        toast.error('Failed to load school');
        return;
      }
      if (data) setSchoolInfo(data as any);
    };
    loadSchool();
  }, [schoolRegistrationId]);

  // Load only registered events for this school in this competition
  useEffect(() => {
    const loadRegistrations = async () => {
      if (!schoolInfo?.school_id || !competitionId) {
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('cp_event_registrations')
        .select(`
          id,
          status,
          event_id,
          cp_comp_events:event_id (
            id,
            location,
            start_time,
            end_time,
            score_sheet,
            competition_event_types:event (
              id,
              name
            )
          )
        `)
        .eq('competition_id', competitionId)
        .eq('school_id', schoolInfo.school_id)
        .neq('status', 'cancelled');
      if (error) {
        console.error(error);
        toast.error('Failed to load registered events');
        setIsLoading(false);
        return;
      }
      setRegistrations(data || []);
      setIsLoading(false);
    };
    loadRegistrations();
  }, [schoolInfo?.school_id, competitionId]);

  // When event selection changes, fetch its assigned template via cp_comp_events.score_sheet
  useEffect(() => {
    const loadTemplate = async () => {
      if (!selectedCompEventId) { 
        setSelectedTemplate(null); 
        return; 
      }
      
      const reg = registrations.find(r => r.cp_comp_events?.id === selectedCompEventId);
      const templateId = reg?.cp_comp_events?.score_sheet;
      
      if (!templateId) { 
        setSelectedTemplate(null); 
        return; 
      }
      
      const { data, error } = await supabase
        .from('competition_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();
        
      if (error) {
        console.error(error);
        toast.error('Failed to load score sheet template');
        return;
      }
      
      setSelectedTemplate(data);
      // Reset scores when template changes
      setScores({});
      setTotalPoints(0);
    };
    loadTemplate();
  }, [selectedCompEventId, registrations]);

  const isFormValid = !!selectedTemplate && !!judgeNumber;

  // Unsaved changes handling
  const initialData = useMemo(() => ({
    selectedCompEventId: '',
    judgeNumber: '',
    teamName: '',
    scores: {}
  }), []);
  const currentData = { selectedCompEventId, judgeNumber, teamName, scores };
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({ 
    initialData, 
    currentData, 
    enabled: !isViewMode 
  });

  const handleBack = () => {
    if (hasUnsavedChanges && !isViewMode) {
      setShowUnsavedDialog(true);
    } else {
      navigate(`/app/competition-portal/competition-details/${competitionId}/schools`);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate(`/app/competition-portal/competition-details/${competitionId}/schools`);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  const handleScoreChange = (newScores: Record<string, any>, newTotal: number) => {
    setScores(newScores);
    setTotalPoints(newTotal);
  };

  const handleSubmit = async () => {
    if (!isFormValid || !selectedTemplate || !schoolInfo?.school_id) return;
    setIsSubmitting(true);
    try {
      const eventData = {
        team_name: teamName || null,
        event: selectedTemplate.event, // enum from template
        score_sheet: {
          template_id: selectedTemplate.id,
          template_name: selectedTemplate.template_name,
          judge_number: judgeNumber,
          scores: scores,
          calculated_at: new Date().toISOString()
        },
        total_points: totalPoints,
        school_id: schoolInfo.school_id,
        source_competition_id: competitionId,
        source_type: 'portal' as const,
        // keep competition_id null for portal usage
      } as any;

      const { error } = await supabase
        .from('competition_events')
        .insert(eventData);
      if (error) throw error;

      toast.success('Event score sheet created');
      resetChanges();
      navigate(`/app/competition-portal/competition-details/${competitionId}/schools`);
    } catch (e) {
      console.error('Error creating event:', e);
      toast.error('Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAndAddAnother = async () => {
    if (!isFormValid || !selectedTemplate || !schoolInfo?.school_id) return;
    setIsSubmitting(true);
    try {
      const eventData = {
        team_name: teamName || null,
        event: selectedTemplate.event, // enum from template
        score_sheet: {
          template_id: selectedTemplate.id,
          template_name: selectedTemplate.template_name,
          judge_number: judgeNumber,
          scores: scores,
          calculated_at: new Date().toISOString()
        },
        total_points: totalPoints,
        school_id: schoolInfo.school_id,
        source_competition_id: competitionId,
        source_type: 'portal' as const,
        // keep competition_id null for portal usage
      } as any;

      const { error } = await supabase
        .from('competition_events')
        .insert(eventData);
      if (error) throw error;

      toast.success('Event score sheet created');
      
      // Reset form for next entry
      setSelectedCompEventId('');
      setJudgeNumber('');
      setTeamName('');
      setScores({});
      setTotalPoints(0);
      setSelectedTemplate(null);
      resetChanges();
    } catch (e) {
      console.error('Error creating event:', e);
      toast.error('Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!competitionId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Competition</h1>
          <p className="text-muted-foreground">Competition ID is missing</p>
        </div>
      </div>
    );
  }

  if (!schoolRegistrationId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid School</h1>
          <p className="text-muted-foreground">School registration ID is missing</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Loading school details...</h2>
          </div>
        </div>
      </div>
    );
  }

  const pageTitle = isCreateMode ? 'Add Event Score Sheet' : isEditMode ? 'Edit Event Score Sheet' : 'View Event Score Sheet';

  return (
    <div className="p-6 space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to Schools
          </Button>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
        </div>
        {!isViewMode && (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmitAndAddAnother}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save & Add Another'}
            </Button>
            <Button 
              type="submit" 
              form="score-sheet-form" 
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
          {schoolInfo && (
            <p className="text-sm text-muted-foreground">
              School: {schoolInfo.school_name}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div id="score-sheet-form" className="space-y-6">
            {/* Row 1: Registered Event */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center">
              <Label className="text-right">Registered Event *</Label>
              <Select 
                value={selectedCompEventId} 
                onValueChange={setSelectedCompEventId}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder={registrations.length ? 'Select an event...' : 'No registered events available'} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-[200px] overflow-y-auto">
                  {registrations.map((reg) => (
                    <SelectItem key={reg.id} value={reg.cp_comp_events?.id}>
                      {reg.cp_comp_events?.competition_event_types?.name || 'Unnamed Event'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <>
                {/* Row 2: Judge Number */}
                <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-center">
                  <Label className="text-right">Judge Number *</Label>
                  <div className="space-y-1">
                    <Select 
                      value={judgeNumber} 
                      onValueChange={setJudgeNumber}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select judge..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50 max-h-[200px] overflow-y-auto">
                        {judgeOptions.map(j => (
                          <SelectItem key={j} value={j}>{j}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Total judges in template: {Math.max(1, Number(maxJudges) || 1)}</p>
                  </div>
                </div>

                {/* Row 3: Team Name */}
                <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4 items-start">
                  <Label className="text-right pt-2">Team Name</Label>
                  <div>
                    {teamName.length >= 2500 ? (
                      <Textarea 
                        value={teamName} 
                        onChange={e => setTeamName(e.target.value)} 
                        placeholder="Enter team name..." 
                        className="min-h-[120px] resize-y"
                        disabled={isViewMode}
                      />
                    ) : (
                      <Input 
                        value={teamName} 
                        onChange={e => setTeamName(e.target.value)} 
                        placeholder="Enter team name..."
                        disabled={isViewMode}
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Score Sheet Section */}
            {selectedTemplate && judgeNumber && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Score Sheet</Label>
                <ScoreSheetSection 
                  selectedTemplate={selectedTemplate}
                  judgeNumber={judgeNumber}
                  onScoreChange={handleScoreChange}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </div>
  );
};
