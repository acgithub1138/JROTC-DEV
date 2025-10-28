import { useState, useEffect } from 'react';
import type { JsonField } from '../../json-field-builder/types';

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
    let total = 0;
    fields.forEach(field => {
      const fieldValue = currentScores[field.id];
      if (field.type === 'number' && fieldValue) {
        total += Number(fieldValue) || 0;
      } else if (field.type === 'dropdown' && fieldValue) {
        // Convert dropdown selection to numeric value for scoring
        total += Number(fieldValue) || 0;
      } else if (field.type === 'scoring_scale' && fieldValue) {
        // Add scoring scale values to total
        total += Number(fieldValue) || 0;
      } else if (field.type === 'penalty' && fieldValue) {
        if (field.penaltyType === 'points') {
          // Calculate points-based penalty: violations × point value
          const violations = Number(fieldValue) || 0;
          const pointValue = field.pointValue || -10;
          total += violations * pointValue;
        } else if (field.penaltyType === 'minor_major') {
          // Apply fixed penalty based on selection
          if (fieldValue === 'minor') {
            total += -20;
          } else if (fieldValue === 'major') {
            total += -50;
          }
        } else if (field.penaltyType === 'split') {
          // Calculate split penalty: 1st occurrence uses splitFirstValue, 2+ use splitSubsequentValue each
          const occurrences = Number(fieldValue) || 0;
          if (occurrences >= 1) {
            const firstValue = field.splitFirstValue || -5;
            const subsequentValue = field.splitSubsequentValue || -25;
            if (occurrences === 1) {
              total += firstValue;
            } else {
              total += firstValue + (occurrences - 1) * subsequentValue;
            }
          }
        } else if (field.penaltyType === 'checkbox_list' && Array.isArray(fieldValue)) {
          // Calculate penalty for checkbox list selections
          const penaltyValue = field.penaltyValue || -10;
          total += fieldValue.length * penaltyValue;
        }
      } else if (field.type === 'penalty_checkbox' && fieldValue) {
        // Calculate penalty checkbox: count × penalty value
        const count = Number(fieldValue) || 0;
        const penaltyValue = field.penaltyValue || -10;
        total += count * penaltyValue;
      }
    });
    return total; // Allow negative scores
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