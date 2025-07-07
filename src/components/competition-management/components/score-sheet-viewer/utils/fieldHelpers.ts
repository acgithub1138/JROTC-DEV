import type { CompetitionEvent } from '../types';

export const getFieldNames = (events: CompetitionEvent[]): string[] => {
  if (events.length === 0) return [];
  
  const allFields = new Set<string>();
  events.forEach(event => {
    if (event.score_sheet?.scores && typeof event.score_sheet.scores === 'object') {
      Object.keys(event.score_sheet.scores).forEach(key => allFields.add(key));
    }
  });
  
  // Sort field names logically (by field number if present)
  return Array.from(allFields).sort((a, b) => {
    const aNum = parseInt(a.match(/field_(\d+)/)?.[1] || '999');
    const bNum = parseInt(b.match(/field_(\d+)/)?.[1] || '999');
    return aNum - bNum;
  });
};

export const getCleanFieldName = (fieldName: string): string => {
  // Remove field_ prefix and convert underscores to spaces
  return fieldName
    .replace(/^field_\d+_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export const calculateFieldAverage = (events: CompetitionEvent[], fieldName: string): string => {
  const fieldValues = events
    .map(event => {
      const value = event.score_sheet?.scores?.[fieldName];
      return value !== null && value !== undefined && value !== '' ? Number(value) : null;
    })
    .filter(v => v !== null && !isNaN(v));
  
  return fieldValues.length > 0 
    ? (fieldValues.reduce((sum, val) => sum + val, 0) / fieldValues.length).toFixed(1)
    : '-';
};

export const calculateTotalAverage = (events: CompetitionEvent[]): string => {
  return events.length > 0 
    ? (events.reduce((sum, event) => sum + (event.total_points || 0), 0) / events.length).toFixed(1)
    : '-';
};