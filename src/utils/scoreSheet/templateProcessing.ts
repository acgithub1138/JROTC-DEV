import type { ScoreField, ProcessedScoreField, Template } from './scoreSheetTypes';

export const extractFieldsFromTemplate = (template: Template): ProcessedScoreField[] => {
  if (!template) return [];

  let rawFields: ScoreField[] = [];

  // Handle different template structures
  if (template.scores) {
    if (Array.isArray(template.scores)) {
      rawFields = template.scores;
    } else if (typeof template.scores === 'string') {
      // Handle JSON string case
      try {
        const parsed = JSON.parse(template.scores);
        if (Array.isArray(parsed)) {
          rawFields = parsed;
        } else if (parsed.criteria && Array.isArray(parsed.criteria)) {
          rawFields = parsed.criteria;
        }
      } catch (e) {
        console.error('Failed to parse template.scores JSON:', e);
      }
    } else if (typeof template.scores === 'object') {
      // Check for nested criteria structure (template.scores.criteria)
      if (template.scores.criteria && Array.isArray(template.scores.criteria)) {
        rawFields = template.scores.criteria;
      } else {
        // Convert object to array format
        rawFields = Object.entries(template.scores).map(([key, value]: [string, any]) => ({
          id: key,
          name: value?.name || key,
          type: value?.type || 'number',
          max_score: value?.max_score || value?.maxScore || value?.points || 10,
          ...value
        }));
      }
    }
  } else if (template.criteria && Array.isArray(template.criteria)) {
    rawFields = template.criteria;
  }

  // Process and normalize fields
  return rawFields.map((field, index) => {
    const fieldId = field.id || `field_${index}_${(field.name || field.criteria || field.title || '')?.replace(/\s+/g, '_').toLowerCase()}`;
    
    return {
      id: fieldId,
      name: field.name || field.criteria || field.title || field.toString(),
      type: field.type || 'number',
      max_score: field.max_score || field.maxScore || field.points || 10,
      textType: field.textType,
      pauseField: field.type === 'bold_gray' || field.type === 'pause' || field.pauseField,
      penaltyType: field.penaltyType,
      options: field.options
    };
  });
};

export const getFieldNames = (fields: ProcessedScoreField[]): string[] => {
  return fields
    .map(field => field.id)
    .sort((a, b) => {
      const aNum = parseInt(a.match(/field_(\d+)/)?.[1] || '999');
      const bNum = parseInt(b.match(/field_(\d+)/)?.[1] || '999');
      return aNum - bNum;
    });
};

export const getCleanFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/^field_\d+_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};