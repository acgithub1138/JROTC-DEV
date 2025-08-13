import { useState, useEffect, useCallback } from 'react';
import type { JsonField } from '../../json-field-builder/types';
import { 
  initializeScoresWithDefaults, 
  calculateTotalPoints
} from '@/utils/scoreSheet';
import type { ProcessedScoreField } from '@/utils/scoreSheet';

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
  // Convert JsonField to ProcessedScoreField format
  const convertToProcessedFields = (jsonFields: JsonField[]): ProcessedScoreField[] => {
    return jsonFields.map(field => ({
      id: field.id,
      name: field.name || '',
      type: field.type,
      max_score: 10, // Default max score
      textType: (field as any).textType,
      pauseField: field.type === 'section_header' || field.type === 'label',
      penaltyType: (field as any).penaltyType,
      options: (field as any).options
    }));
  };

  const processedFields = convertToProcessedFields(fields);

  const [scores, setScores] = useState<Record<string, any>>(() => 
    initializeScoresWithDefaults(processedFields, initialScores)
  );
  const [totalPoints, setTotalPoints] = useState(0);

  // Calculate total points using centralized logic
  const calculateTotal = useCallback((currentScores: Record<string, any>) => {
    return calculateTotalPoints(processedFields, currentScores);
  }, [processedFields]);

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
    const initializedScores = initializeScoresWithDefaults(processedFields, initialScores);
    setScores(initializedScores);
    const initialTotal = calculateTotal(initializedScores);
    setTotalPoints(initialTotal);
    onScoreChange(initializedScores, initialTotal);
  }, [fields.length, calculateTotal]);

  return {
    scores,
    totalPoints,
    handleFieldChange
  };
};