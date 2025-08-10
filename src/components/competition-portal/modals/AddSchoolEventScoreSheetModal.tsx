import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';

import { ScoreSheetSection } from '@/components/competition-management/components/add-event/ScoreSheetSection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddSchoolEventScoreSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  schoolRegistrationId: string; // cp_comp_schools.id
}


export const AddSchoolEventScoreSheetModal: React.FC<AddSchoolEventScoreSheetModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  schoolRegistrationId
}) => {
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

  // Compute judge options based on template's configured judge count
  const maxJudges = useMemo(() => {
    const tpl = selectedTemplate || {};
    return (
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
      if (!open || !schoolRegistrationId) return;
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
  }, [open, schoolRegistrationId]);

  // Load only registered events for this school in this competition
  useEffect(() => {
    const loadRegistrations = async () => {
      if (!open || !schoolInfo?.school_id || !competitionId) return;
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
            cp_events:event (
              id,
              name,
              score_sheet
            )
          )
        `)
        .eq('competition_id', competitionId)
        .eq('school_id', schoolInfo.school_id)
        .neq('status', 'cancelled');
      if (error) {
        console.error(error);
        toast.error('Failed to load registered events');
        return;
      }
      setRegistrations(data || []);
    };
    loadRegistrations();
  }, [open, schoolInfo?.school_id, competitionId]);

  // When event selection changes, fetch its assigned template via cp_events.score_sheet
  useEffect(() => {
    const loadTemplate = async () => {
      if (!selectedCompEventId) { setSelectedTemplate(null); return; }
      const reg = registrations.find(r => r.cp_comp_events?.id === selectedCompEventId);
      const templateId = reg?.cp_comp_events?.cp_events?.score_sheet as string | undefined;
      if (!templateId) { setSelectedTemplate(null); return; }
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
  const { hasUnsavedChanges } = useUnsavedChanges({ initialData, currentData, enabled: open });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleDiscardChanges = () => {
    // reset state
    setSelectedCompEventId('');
    setJudgeNumber('');
    setTeamName('');
    setScores({});
    setTotalPoints(0);
    setSelectedTemplate(null);
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => setShowUnsavedDialog(false);

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
        // keep competition_id null for portal usage; source_type defaults to 'internal' but fine
      } as any;

      const { error } = await supabase
        .from('competition_events')
        .insert(eventData);
      if (error) throw error;

      toast.success('Event score sheet created');
      handleDiscardChanges();
    } catch (e) {
      console.error('Error creating event:', e);
      toast.error('Failed to create event');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Event Score Sheet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Registered Event Selector */}
          <div className="space-y-1">
            <Label>Registered Event</Label>
            <Select value={selectedCompEventId} onValueChange={setSelectedCompEventId}>
              <SelectTrigger>
                <SelectValue placeholder={registrations.length ? 'Select an event...' : 'No registered events available'} />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {registrations.map((reg) => (
                  <SelectItem key={reg.id} value={reg.cp_comp_events?.id}>
                    {reg.cp_comp_events?.cp_events?.name || 'Unnamed Event'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <>
              <div className="space-y-1">
                <Label>Judge Number <span className="text-destructive">*</span></Label>
                <Select value={judgeNumber} onValueChange={setJudgeNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select judge..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {judgeOptions.map(j => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Total judges in template: {Math.max(1, Number(maxJudges) || 1)}</p>
              </div>

              <div className="space-y-1">
                <Label>Team Name (Optional)</Label>
                {teamName.length >= 2500 ? (
                  <Textarea value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Enter team name..." className="min-h-[120px] resize-y" />
                ) : (
                  <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Enter team name..." />
                )}
              </div>
            </>
          )}


          {/* Score Sheet */}
          <ScoreSheetSection 
            selectedTemplate={selectedTemplate}
            judgeNumber={judgeNumber}
            onScoreChange={handleScoreChange}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Event'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </Dialog>
  );
};
