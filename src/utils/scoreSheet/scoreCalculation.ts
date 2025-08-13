import type { ProcessedScoreField, ScoreValues } from './scoreSheetTypes';

export const calculateTotalPoints = (fields: ProcessedScoreField[], scores: ScoreValues): number => {
  let total = 0;

  fields.forEach(field => {
    const value = scores[field.id];
    
    // Skip non-scoring fields
    if (field.type === 'section_header' || field.type === 'label' || field.pauseField) {
      return;
    }

    // Handle different field types
    if (field.type === 'penalty') {
      const penaltyValue = Number(value) || 0;
      
      if (field.penaltyType === 'points') {
        total -= penaltyValue;
      } else if (field.penaltyType === 'split') {
        total -= penaltyValue / 2;
      } else if (field.penaltyType === 'minor_major') {
        // Assuming penalty value represents number of penalties
        // and we need to calculate based on minor/major split
        total -= penaltyValue;
      } else if (field.penaltyType === 'checkbox') {
        total -= penaltyValue ? (field.max_score || 1) : 0;
      } else {
        total -= penaltyValue;
      }
    } else if (field.type === 'penalty_checkbox') {
      total -= value ? (field.max_score || 1) : 0;
    } else if (field.type === 'number' || field.type === 'dropdown' || field.type === 'scoring_scale') {
      total += Number(value) || 0;
    }
  });

  return Math.max(0, total); // Ensure total doesn't go below 0
};

export const calculateFieldAverage = (values: (number | string)[]): string => {
  const numericValues = values
    .map(v => Number(v))
    .filter(v => !isNaN(v) && v !== null && v !== undefined);
  
  return numericValues.length > 0 
    ? (numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length).toFixed(1)
    : '-';
};

export const formatScoreSheetForDatabase = (
  templateId: string | undefined,
  templateName: string | undefined,
  judgeNumber: string | number | undefined,
  scores: ScoreValues
): any => {
  return {
    template_id: templateId,
    template_name: templateName,
    judge_number: judgeNumber,
    scores: scores,
    calculated_at: new Date().toISOString()
  };
};