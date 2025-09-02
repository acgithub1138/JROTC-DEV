import React from 'react';
import { EventScoreForm } from '@/components/competition-management/components/EventScoreForm';

interface ScoreSheetSectionProps {
  selectedTemplate: any;
  judgeNumber: string;
  onScoreChange: (scores: Record<string, any>, totalPoints: number) => void;
}

export const ScoreSheetSection: React.FC<ScoreSheetSectionProps> = ({
  selectedTemplate,
  judgeNumber,
  onScoreChange
}) => {
  if (!selectedTemplate) return null;

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">
        Score Sheet: {selectedTemplate.template_name}
      </h3>
      <EventScoreForm 
        templateScores={selectedTemplate.scores as Record<string, any>} 
        onScoreChange={onScoreChange} 
        judgeNumber={judgeNumber} 
      />
    </div>
  );
};