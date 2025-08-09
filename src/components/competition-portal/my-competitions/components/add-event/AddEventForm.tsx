import React from 'react';

interface AddEventFormProps {
  selectedProgram: string;
  selectedEvent: string;
  selectedTemplateId: string;
  judgeNumber: string;
  teamName: string;
  availablePrograms: any[];
  availableEvents: any[];
  filteredTemplates: any[];
  templatesLoading: boolean;
  onProgramChange: (program: string) => void;
  onEventChange: (event: string) => void;
  onTemplateChange: (templateId: string) => void;
  onJudgeNumberChange: (judgeNumber: string) => void;
  onTeamNameChange: (teamName: string) => void;
}

export const AddEventForm: React.FC<AddEventFormProps> = (props) => {
  return <div>Add Event Form - Implementation needed</div>;
};