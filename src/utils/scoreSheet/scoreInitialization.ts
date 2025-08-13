import type { ProcessedScoreField, ScoreValues } from './scoreSheetTypes';

export const getDefaultValueForField = (field: ProcessedScoreField): any => {
  // Section headers and labels don't have scores
  if (field.type === 'section_header' || field.type === 'label' || field.pauseField) {
    return undefined;
  }

  // Text fields
  if (field.type === 'text' || field.textType === 'notes') {
    return '';
  }

  // Dropdown and scoring scale fields
  if (field.type === 'dropdown' || field.type === 'scoring_scale') {
    return '';
  }

  // Penalty fields (always start at 0)
  if (field.type === 'penalty' || field.type === 'penalty_checkbox') {
    return 0;
  }

  // Number fields and default case
  return 0;
};

export const initializeScoresWithDefaults = (
  fields: ProcessedScoreField[], 
  initialScores?: ScoreValues
): ScoreValues => {
  const scores: ScoreValues = {};

  // Initialize all fields with default values
  fields.forEach(field => {
    const defaultValue = getDefaultValueForField(field);
    if (defaultValue !== undefined) {
      scores[field.id] = defaultValue;
    }
  });

  // Override with any provided initial scores
  if (initialScores) {
    Object.keys(initialScores).forEach(key => {
      if (initialScores[key] !== null && initialScores[key] !== undefined) {
        scores[key] = initialScores[key];
      }
    });
  }

  return scores;
};

export const createScoreSheetItems = (
  fields: ProcessedScoreField[], 
  scores: ScoreValues
): any[] => {
  return fields.map(field => ({
    id: field.id,
    criteria: field.name,
    max_score: field.max_score,
    score: scores[field.id] !== undefined ? scores[field.id] : getDefaultValueForField(field),
    type: field.type,
    pauseField: field.pauseField
  }));
};