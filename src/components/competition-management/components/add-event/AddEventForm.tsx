import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  showDetails?: boolean;
  maxJudges?: number;
}

// judgeOptions computed per template

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
  onTeamNameChange,
  showDetails = true,
  maxJudges
}) => {
  const judgeOptions = Array.from({ length: Math.max(1, Math.min(maxJudges ?? 10, 10)) }, (_, i) => `Judge ${i + 1}`);
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
              {availablePrograms.map(program => {
                // Proper capitalization for branch names
                const formatBranchName = (branch: string) => {
                  const branchMap: Record<string, string> = {
                    'air_force': 'Air Force',
                    'marine_corps': 'Marine Corps',
                    'army': 'Army',
                    'navy': 'Navy',
                    'space_force': 'Space Force',
                    'coast_guard': 'Coast Guard'
                  };
                  return branchMap[branch] || branch.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ');
                };
                
                return (
                  <SelectItem key={program} value={program}>
                    {formatBranchName(program)}
                  </SelectItem>
                );
              })}
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
      {showDetails && (
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
      )}

      {/* Team Name */}
      {showDetails && (
        <div className="space-y-1">
          <Label>Team Name (Optional)</Label>
          {teamName.length >= 2500 ? (
            <Textarea 
              value={teamName} 
              onChange={e => onTeamNameChange(e.target.value)} 
              placeholder="Enter team name..." 
              className="min-h-[120px] resize-y"
            />
          ) : (
            <Input 
              value={teamName} 
              onChange={e => onTeamNameChange(e.target.value)} 
              placeholder="Enter team name..." 
            />
          )}
        </div>
      )}
    </div>
  );
};