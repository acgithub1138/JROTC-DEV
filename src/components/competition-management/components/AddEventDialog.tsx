import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { useCompetitionTemplates } from '../hooks/useCompetitionTemplates';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { EventScoreForm } from './EventScoreForm';
import { MultiSelectProfiles } from '../../inventory-management/components/MultiSelectProfiles';
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
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCadetIds, setSelectedCadetIds] = useState<string[]>([]);
  const [judgeNumber, setJudgeNumber] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [scores, setScores] = useState<Record<string, any>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCadetsOpen, setIsCadetsOpen] = useState(false);
  const {
    templates,
    isLoading: templatesLoading
  } = useCompetitionTemplates();
  const {
    users: cadets,
    isLoading: cadetsLoading
  } = useSchoolUsers(true);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const activeCadets = cadets.filter(user => user.role === 'cadet');

  // Get unique programs from templates
  const availablePrograms = [...new Set(templates.map(t => t.jrotc_program))].sort();

  // Get events filtered by selected program
  const availableEvents = selectedProgram ? [...new Set(templates.filter(t => t.jrotc_program === selectedProgram).map(t => t.event))].sort() : [];

  // Get templates filtered by selected program and event
  const filteredTemplates = selectedProgram && selectedEvent ? templates.filter(t => t.jrotc_program === selectedProgram && t.event === selectedEvent) : [];

  // Judge number options
  const judgeOptions = ['Judge 1', 'Judge 2', 'Judge 3', 'Judge 4', 'Judge 5', 'Judge 6', 'Judge 7', 'Judge 8', 'Judge 9', 'Judge 10'];

  // Handle program selection change
  const handleProgramChange = (program: string) => {
    setSelectedProgram(program);
    setSelectedEvent(''); // Reset event when program changes
    setSelectedTemplateId(''); // Reset template when program changes
    setScores({});
    setTotalPoints(0);
  };

  // Handle event selection change
  const handleEventChange = (event: string) => {
    setSelectedEvent(event);
    setSelectedTemplateId(''); // Reset template when event changes
    setScores({});
    setTotalPoints(0);
  };

  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setScores({});
    setTotalPoints(0);
  };
  const handleSubmit = async () => {
    if (!selectedTemplateId || selectedCadetIds.length === 0) {
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

      // Reset form
      setSelectedProgram('');
      setSelectedEvent('');
      setSelectedTemplateId('');
      setSelectedCadetIds([]);
      setJudgeNumber('');
      setTeamName('');
      setScores({});
      setTotalPoints(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleScoreChange = (newScores: Record<string, any>, newTotal: number) => {
    setScores(newScores);
    setTotalPoints(newTotal);
  };
  const isFormValid = selectedTemplateId && selectedCadetIds.length > 0;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Competition Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Program, Event, and Template Selection - Responsive Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Program Selection */}
            <div className="space-y-1">
              <Label>Branch
            </Label>
              <Select value={selectedProgram} onValueChange={handleProgramChange} disabled={templatesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a program..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePrograms.map(program => <SelectItem key={program} value={program}>
                      {program.charAt(0).toUpperCase() + program.slice(1).replace('_', ' ')}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Event Selection */}
            <div className="space-y-1">
              <Label>Event</Label>
              <Select value={selectedEvent} onValueChange={handleEventChange} disabled={templatesLoading || !selectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedProgram ? "Select an event..." : "Select a program first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableEvents.map(event => <SelectItem key={event} value={event}>
                      {event.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            <div className="space-y-1">
              <Label>Template Name</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange} disabled={templatesLoading || !selectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedEvent ? "Select a template..." : "Select an event first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map(template => <SelectItem key={template.id} value={template.id}>
                      {template.template_name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cadet Selection */}
          <div className="space-y-1">
            <Collapsible open={isCadetsOpen} onOpenChange={setIsCadetsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Cadets</span>
                    {selectedCadetIds.length > 0 && <span className="text-sm text-muted-foreground">
                        ({selectedCadetIds.length} selected)
                      </span>}
                  </div>
                  {isCadetsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-2">
                <MultiSelectProfiles value={selectedCadetIds} onChange={setSelectedCadetIds} />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Judge Number */}
          <div className="space-y-1">
            <Label>Judge Number (Optional)</Label>
            <Select value={judgeNumber} onValueChange={setJudgeNumber}>
              <SelectTrigger>
                <SelectValue placeholder="Select judge..." />
              </SelectTrigger>
              <SelectContent>
                {judgeOptions.map(judge => <SelectItem key={judge} value={judge}>
                    {judge}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Team Name */}
          <div className="space-y-1">
            <Label>Team Name (Optional)</Label>
            <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Enter team name..." />
          </div>

          {/* Score Form */}
          {selectedTemplate && <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Score Sheet: {selectedTemplate.template_name}
              </h3>
              <EventScoreForm templateScores={selectedTemplate.scores as Record<string, any>} onScoreChange={handleScoreChange} judgeNumber={judgeNumber} />
            </div>}
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
    </Dialog>;
};