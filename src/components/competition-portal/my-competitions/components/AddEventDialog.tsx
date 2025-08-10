import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddEventForm } from '@/components/competition-management/components/add-event/AddEventForm';
import { CadetSelector } from '@/components/competition-management/components/add-event/CadetSelector';
import { ScoreSheetSection } from '@/components/competition-management/components/add-event/ScoreSheetSection';
import { useAddEventLogic } from '@/components/competition-management/components/add-event/useAddEventLogic';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';

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
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
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

  // Initial state for comparison
  const initialData = {
    selectedProgram: '',
    selectedEvent: '',
    selectedTemplateId: '',
    selectedCadetIds: [],
    judgeNumber: '',
    teamName: '',
    scores: {}
  };

  // Current form data for comparison  
  const currentData = {
    selectedProgram: selectedProgram || '',
    selectedEvent: selectedEvent || '',
    selectedTemplateId: selectedTemplateId || '',
    selectedCadetIds,
    judgeNumber: judgeNumber || '',
    teamName: teamName || '',
    scores
  };

  const { hasUnsavedChanges } = useUnsavedChanges({
    initialData,
    currentData,
    enabled: open
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleDiscardChanges = () => {
    resetForm();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

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
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
    </>
  );
};