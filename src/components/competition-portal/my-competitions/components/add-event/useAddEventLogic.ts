import { useState } from 'react';

export const useAddEventLogic = () => {
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedCadetIds, setSelectedCadetIds] = useState<string[]>([]);
  const [judgeNumber, setJudgeNumber] = useState('');
  const [teamName, setTeamName] = useState('');
  const [scores, setScores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCadetsOpen, setIsCadetsOpen] = useState(false);

  const resetForm = () => {
    setSelectedProgram('');
    setSelectedEvent('');
    setSelectedTemplateId('');
    setSelectedCadetIds([]);
    setJudgeNumber('');
    setTeamName('');
    setScores({});
  };

  return {
    selectedProgram,
    selectedEvent,
    selectedTemplateId,
    selectedCadetIds,
    judgeNumber,
    teamName,
    scores,
    totalPoints: 0,
    isSubmitting,
    isCadetsOpen,
    setIsCadetsOpen,
    setIsSubmitting,
    selectedTemplate: null,
    availablePrograms: [],
    availableEvents: [],
    filteredTemplates: [],
    isFormValid: false,
    templatesLoading: false,
    handleProgramChange: setSelectedProgram,
    handleEventChange: setSelectedEvent,
    handleTemplateChange: setSelectedTemplateId,
    handleScoreChange: () => {},
    setSelectedCadetIds,
    setJudgeNumber,
    setTeamName,
    resetForm
  };
};