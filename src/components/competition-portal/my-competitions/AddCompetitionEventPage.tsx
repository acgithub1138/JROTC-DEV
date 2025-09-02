import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { AddEventForm } from './components/add-event/AddEventForm';
import { CadetSelector } from './components/add-event/CadetSelector';
import { ScoreSheetSection } from './components/add-event/ScoreSheetSection';
import { useAddEventLogic } from './components/add-event/useAddEventLogic';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useCompetitionEvents } from './hooks/useCompetitionEvents';
import { useCompetitions } from './hooks/useCompetitions';
import { toast } from 'sonner';

// Custom type for event data that omits auto-added fields
type CreateEventData = {
  cadet_ids?: string[];
  team_name?: string | null;
  event: string;
  score_sheet?: any;
  total_points?: number | null;
};

export const AddCompetitionEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { '*': splat } = useParams();
  const [searchParams] = useSearchParams();
  
  // Extract competitionId from URL parameters
  const competitionId = searchParams.get('competitionId') || '';
  const returnPath = searchParams.get('returnPath') || '/app/competition-portal/my-competitions';
  
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get competition data
  const { competitions, isLoading: compsLoading } = useCompetitions();
  const competition = competitions.find(comp => comp.id === competitionId);
  const { createEvent } = useCompetitionEvents(competitionId);

  const {
    selectedProgram,
    selectedEvent,
    selectedTemplateId,
    selectedCadetIds,
    judgeNumber,
    teamName,
    scores,
    totalPoints,
    isCadetsOpen,
    setIsCadetsOpen,
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
    enabled: true
  });

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(returnPath);
    }
  };

  const handleDiscardChanges = () => {
    resetForm();
    setShowUnsavedDialog(false);
    navigate(returnPath);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create ONE event for all selected cadets
      const eventData: CreateEventData = {
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
      
      await createEvent(eventData as any);
      toast.success('Competition event added successfully');
      navigate(returnPath);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to add competition event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (compsLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-muted-foreground">Loading competition...</div>
      </div>
    );
  }

  // Competition not found
  if (!competition) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate(returnPath)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            Competition not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with action buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Add Competition Event</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="add-event-form"
              disabled={!isFormValid || isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Adding...' : 'Add Event'}
            </Button>
          </div>
        </div>

        {/* Competition info */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <h2 className="font-semibold text-lg">{competition.name}</h2>
          <p className="text-muted-foreground">
            {new Date(competition.competition_date).toLocaleDateString()} • {competition.location}
          </p>
        </div>

        {/* Form card */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="add-event-form" onSubmit={handleSubmit} className="space-y-6">
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
                showDetails={Boolean(selectedTemplate)}
                maxJudges={(selectedTemplate as any)?.judges}
              />

              {selectedTemplate && (
                <CadetSelector 
                  selectedCadetIds={selectedCadetIds} 
                  judgeNumber={judgeNumber} 
                  isCadetsOpen={isCadetsOpen} 
                  onSelectedCadetsChange={setSelectedCadetIds} 
                  onToggleOpen={setIsCadetsOpen} 
                />
              )}

              <ScoreSheetSection 
                selectedTemplate={selectedTemplate} 
                judgeNumber={judgeNumber} 
                onScoreChange={handleScoreChange} 
              />
            </form>
          </CardContent>
        </Card>

        <UnsavedChangesDialog
          open={showUnsavedDialog}
          onOpenChange={setShowUnsavedDialog}
          onDiscard={handleDiscardChanges}
          onCancel={handleContinueEditing}
        />
      </div>
    </div>
  );
};