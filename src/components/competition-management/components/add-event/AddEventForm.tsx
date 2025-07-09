import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddEventFormProps {
  selectedProgram: string;
  selectedEvent: string;
  selectedTemplateId: string;
  judgeNumber: string;
  teamName: string;
  availablePrograms: string[];
  availableEvents: string[];
  filteredTemplates: any[];
  templatesLoading: boolean;
  onProgramChange: (program: string) => void;
  onEventChange: (event: string) => void;
  onTemplateChange: (templateId: string) => void;
  onJudgeNumberChange: (judge: string) => void;
  onTeamNameChange: (name: string) => void;
}

const judgeOptions = ['Judge 1', 'Judge 2', 'Judge 3', 'Judge 4', 'Judge 5', 'Judge 6', 'Judge 7', 'Judge 8', 'Judge 9', 'Judge 10'];

export const AddEventForm: React.FC<AddEventFormProps> = ({
  selectedProgram,
  selectedEvent,
  selectedTemplateId,
  judgeNumber,
  teamName,
  availablePrograms,
  availableEvents,
  filteredTemplates,
  templatesLoading,
  onProgramChange,
  onEventChange,
  onTemplateChange,
  onJudgeNumberChange,
  onTeamNameChange
}) => {
  return (
    <div className="space-y-3">
      {/* Program, Event, and Template Selection - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Program Selection */}
        <div className="space-y-1">
          <Label>Branch</Label>
          <Select value={selectedProgram} onValueChange={onProgramChange} disabled={templatesLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select a program..." />
            </SelectTrigger>
            <SelectContent>
              {availablePrograms.map(program => (
                <SelectItem key={program} value={program}>
                  {program.charAt(0).toUpperCase() + program.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Event Selection */}
        <div className="space-y-1">
          <Label>Event</Label>
          <Select value={selectedEvent} onValueChange={onEventChange} disabled={templatesLoading || !selectedProgram}>
            <SelectTrigger>
              <SelectValue placeholder={selectedProgram ? "Select an event..." : "Select a program first"} />
            </SelectTrigger>
            <SelectContent>
              {availableEvents.map(event => (
                <SelectItem key={event} value={event}>
                  {event.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Selection */}
        <div className="space-y-1">
          <Label>Template Name</Label>
          <Select value={selectedTemplateId} onValueChange={onTemplateChange} disabled={templatesLoading || !selectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder={selectedEvent ? "Select a template..." : "Select an event first"} />
            </SelectTrigger>
            <SelectContent>
              {filteredTemplates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.template_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Judge Number */}
      <div className="space-y-1">
        <Label>Judge Number <span className="text-destructive">*</span></Label>
        <Select value={judgeNumber} onValueChange={onJudgeNumberChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select judge..." />
          </SelectTrigger>
          <SelectContent>
            {judgeOptions.map(judge => (
              <SelectItem key={judge} value={judge}>
                {judge}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Team Name */}
      <div className="space-y-1">
        <Label>Team Name (Optional)</Label>
        <Input 
          value={teamName} 
          onChange={e => onTeamNameChange(e.target.value)} 
          placeholder="Enter team name..." 
        />
      </div>
    </div>
  );
};