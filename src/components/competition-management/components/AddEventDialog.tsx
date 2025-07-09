import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddEventForm } from './add-event/AddEventForm';
import { CadetSelector } from './add-event/CadetSelector';
import { ScoreSheetSection } from './add-event/ScoreSheetSection';
import { useAddEventLogic } from './add-event/useAddEventLogic';
interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onEventCreated: (eventData: any) => void;
}
export const AddEventDialog: React.FC<AddEventDialogProps> = ({
  open,
  onOpenChange,
  competitionId,
  onEventCreated
}) => {
  const {
    selectedProgram,
    selectedEvent,
    selectedTemplateId,
    selectedCadetIds,
    judgeNumber,
    teamName,
    scores,
    totalPoints,
    isSubmitting,
    isCadetsOpen,
    setIsCadetsOpen,
    setIsSubmitting,
    selectedTemplate,
    availablePrograms,
    availableEvents,
    filteredTemplates,
    isFormValid,
    templatesLoading,
    handleProgramChange,
    handleEventChange,
    handleTemplateChange,
    handleScoreChange,
    setSelectedCadetIds,
    setJudgeNumber,
    setTeamName,
    resetForm
  } = useAddEventLogic();
  const handleSubmit = async () => {
    if (!isFormValid) {
      return;
    }
    setIsSubmitting(true);
    try {
      // Create ONE event for all selected cadets
      const eventData = {
        cadet_ids: selectedCadetIds,
        team_name: teamName || null,
        event: selectedTemplate?.event,
        score_sheet: {
          template_id: selectedTemplateId,
          template_name: selectedTemplate?.template_name,
          judge_number: judgeNumber || null,
          scores: scores,
          calculated_at: new Date().toISOString()
        },
        total_points: totalPoints
      };
      await onEventCreated(eventData);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Competition Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <AddEventForm
            selectedProgram={selectedProgram}
            selectedEvent={selectedEvent}
            selectedTemplateId={selectedTemplateId}
            judgeNumber={judgeNumber}
            teamName={teamName}
            availablePrograms={availablePrograms}
            availableEvents={availableEvents}
            filteredTemplates={filteredTemplates}
            templatesLoading={templatesLoading}
            onProgramChange={handleProgramChange}
            onEventChange={handleEventChange}
            onTemplateChange={handleTemplateChange}
            onJudgeNumberChange={setJudgeNumber}
            onTeamNameChange={setTeamName}
          />

          <CadetSelector
            selectedCadetIds={selectedCadetIds}
            judgeNumber={judgeNumber}
            isCadetsOpen={isCadetsOpen}
            onSelectedCadetsChange={setSelectedCadetIds}
            onToggleOpen={setIsCadetsOpen}
          />

          <ScoreSheetSection
            selectedTemplate={selectedTemplate}
            judgeNumber={judgeNumber}
            onScoreChange={handleScoreChange}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};