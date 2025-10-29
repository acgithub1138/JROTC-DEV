import { useState, useEffect } from 'react';
import type { JsonField } from '../../json-field-builder/types';
import { calculateTotalScore } from '@/utils/scoreCalculations';

interface UseScoreCalculationProps {
  fields: JsonField[];
  initialScores?: Record<string, any>;
  onScoreChange: (scores: Record<string, any>, totalPoints: number) => void;
}

export const useScoreCalculation = ({
  fields,
  initialScores = {},
  onScoreChange
}: UseScoreCalculationProps) => {
  // Initialize scores with all template fields set to default values
  const initializeScoresWithDefaults = (fields: JsonField[], initialScores: Record<string, any>) => {
    const defaultScores: Record<string, any> = {};
    
    // Set default values for all fields based on their type
    fields.forEach(field => {
      if (field.type === 'penalty' || field.type === 'penalty_checkbox') {
        defaultScores[field.id] = 0;
      } else if (field.type === 'text' || field.textType === 'notes') {
        defaultScores[field.id] = '';
      } else if (field.type === 'dropdown' || field.type === 'scoring_scale') {
        defaultScores[field.id] = '';
      } else if (field.type === 'number') {
        defaultScores[field.id] = 0;
      } else {
        defaultScores[field.id] = '';
      }
    });
    
    // Override with any provided initial scores
    return { ...defaultScores, ...initialScores };
  };

  const [scores, setScores] = useState<Record<string, any>>(() => 
    initializeScoresWithDefaults(fields, initialScores)
  );
  const [totalPoints, setTotalPoints] = useState(0);

  const calculateTotal = (currentScores: Record<string, any>) => {
    return calculateTotalScore(fields, currentScores);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    const newScores = {
      ...scores,
      [fieldId]: value
    };
    setScores(newScores);
    const newTotal = calculateTotal(newScores);
    setTotalPoints(newTotal);
    onScoreChange(newScores, newTotal);
  };

  useEffect(() => {
    const initializedScores = initializeScoresWithDefaults(fields, initialScores);
    setScores(initializedScores);
    const initialTotal = calculateTotal(initializedScores);
    setTotalPoints(initialTotal);
    // Only call onScoreChange on mount to set initial state, not every time
  }, [fields.length]);

  return {
    scores,
    totalPoints,
    handleFieldChange
  };
};