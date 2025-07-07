import React from 'react';
import type { JsonField } from '../components/json-field-builder/types';
import { ScoreFieldRenderer } from './score-form/ScoreFieldRenderer';
import { TotalScoreCard } from './score-form/TotalScoreCard';
import { useScoreCalculation } from './score-form/hooks/useScoreCalculation';

interface EventScoreFormProps {
  templateScores: Record<string, any>;
  onScoreChange: (scores: Record<string, any>, totalPoints: number) => void;
  initialScores?: Record<string, any>;
  judgeNumber?: string;
}

export const EventScoreForm: React.FC<EventScoreFormProps> = ({
  templateScores,
  onScoreChange,
  initialScores = {},
  judgeNumber
}) => {
  // Parse template fields from the JSON structure - templates use 'criteria' not 'fields'
  const rawFields = templateScores?.criteria || [];

  // Convert template criteria to JsonField format and ensure each field has an ID
  const fields: JsonField[] = rawFields.map((field: any, index: number) => ({
    ...field,
    id: field.id || `field_${index}_${field.name?.replace(/\s+/g, '_').toLowerCase()}`,
    // Convert bold_gray type to pauseField property (with backward compatibility for 'pause')
    pauseField: field.type === 'bold_gray' || field.type === 'pause' || field.pauseField,
    // Map dropdown options from 'options' to 'values' for ScoreFieldRenderer compatibility
    values: field.options || field.values
  }));

  const { scores, totalPoints, handleFieldChange } = useScoreCalculation({
    fields,
    initialScores,
    onScoreChange
  });

  if (!templateScores || !fields || fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No scoring fields found in this template.</p>
        <p className="text-sm mt-2">Please check the template configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {fields.map(field => (
          <ScoreFieldRenderer
            key={field.id}
            field={field}
            value={scores[field.id]}
            onChange={handleFieldChange}
            judgeNumber={judgeNumber}
          />
        ))}
      </div>
      
      <TotalScoreCard totalPoints={totalPoints} />
    </div>
  );
};