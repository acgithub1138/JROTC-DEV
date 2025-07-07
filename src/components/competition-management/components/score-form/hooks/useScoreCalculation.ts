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
  const [scores, setScores] = useState<Record<string, any>>(initialScores);
  const [totalPoints, setTotalPoints] = useState(0);

  const calculateTotal = (currentScores: Record<string, any>) => {
    let total = 0;
    fields.forEach(field => {
      const fieldValue = currentScores[field.id];
      if (field.type === 'number' && fieldValue) {
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
        }
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
    const initialTotal = calculateTotal(initialScores);
    setTotalPoints(initialTotal);
    onScoreChange(initialScores, initialTotal);
  }, []);

  return {
    scores,
    totalPoints,
    handleFieldChange
  };
};