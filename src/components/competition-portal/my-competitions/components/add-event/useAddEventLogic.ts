import { useState, useMemo } from 'react';
import { useCompetitionTemplates } from '@/components/competition-management/hooks/useCompetitionTemplates';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

export const useAddEventLogic = () => {
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

  const { templates, isLoading: templatesLoading } = useCompetitionTemplates();
  const { users: cadets, isLoading: cadetsLoading } = useSchoolUsers(true);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const activeCadets = cadets.filter(user => user.role === 'cadet');

  // Get unique programs from templates
  const availablePrograms = useMemo(() => 
    [...new Set(templates.map(t => t.jrotc_program))].sort(), 
    [templates]
  );

  // Get events filtered by selected program
  const availableEvents = useMemo(() => 
    selectedProgram 
      ? [...new Set(templates
          .filter(t => t.jrotc_program === selectedProgram)
          .map(t => (t as any).competition_event_types?.name)
          .filter(Boolean)
        )].sort() 
      : [], 
    [templates, selectedProgram]
  );

  // Get templates filtered by selected program and event
  const filteredTemplates = useMemo(() => 
    selectedProgram && selectedEvent 
      ? templates.filter(t => 
          t.jrotc_program === selectedProgram && 
          (t as any).competition_event_types?.name === selectedEvent
        ) 
      : [], 
    [templates, selectedProgram, selectedEvent]
  );

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

  const handleScoreChange = (newScores: Record<string, any>, newTotal: number) => {
    setScores(newScores);
    setTotalPoints(newTotal);
  };

  const isFormValid = selectedTemplateId && judgeNumber && (judgeNumber !== 'Judge 1' || selectedCadetIds.length > 0);

  const resetForm = () => {
    setSelectedProgram('');
    setSelectedEvent('');
    setSelectedTemplateId('');
    setSelectedCadetIds([]);
    setJudgeNumber('');
    setTeamName('');
    setScores({});
    setTotalPoints(0);
  };

  return {
    // State
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
    
    // Computed values
    selectedTemplate,
    activeCadets,
    availablePrograms,
    availableEvents,
    filteredTemplates,
    isFormValid,
    templatesLoading,
    cadetsLoading,

    // Handlers
    handleProgramChange,
    handleEventChange,
    handleTemplateChange,
    handleScoreChange,
    setSelectedCadetIds,
    setJudgeNumber,
    setTeamName,
    resetForm
  };
};