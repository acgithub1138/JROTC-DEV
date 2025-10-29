import type { JsonField } from '@/components/competition-management/components/json-field-builder/types';

/**
 * Calculate penalty deduction for a single field
 * Returns negative number representing the penalty (e.g., -10, -5, -30)
 */
export const calculatePenaltyDeduction = (
  field: JsonField,
  value: any
): number | null => {
  if (!value || (typeof value !== 'number' && typeof value !== 'string' && typeof value !== 'boolean')) {
    return null;
  }

  const numValue = typeof value === 'number' ? value : Number(value);

  // Handle penalty field type
  if (field.type === 'penalty') {
    if (field.penaltyType === 'points') {
      // Calculate points-based penalty: violations × point value
      const violations = numValue || 0;
      const pointValue = field.pointValue || -10;
      return violations > 0 ? violations * pointValue : null;
    }

    if (field.penaltyType === 'minor_major') {
      // Apply fixed penalty based on selection
      if (value === 'minor') return -20;
      if (value === 'major') return -50;
      return null;
    }

    if (field.penaltyType === 'split') {
      // Calculate split penalty: 1st occurrence uses splitFirstValue, 2+ use splitSubsequentValue each
      const occurrences = numValue || 0;
      if (occurrences >= 1) {
        const firstValue = field.splitFirstValue || -5;
        const subsequentValue = field.splitSubsequentValue || -25;
        if (occurrences === 1) {
          return firstValue;
        } else {
          return firstValue + (occurrences - 1) * subsequentValue;
        }
      }
      return null;
    }

    if (field.penaltyType === 'checkbox_list' && Array.isArray(value)) {
      // Calculate penalty for checkbox list selections
      const penaltyValue = field.penaltyValue || -10;
      return value.length > 0 ? value.length * penaltyValue : null;
    }
  }

  // Handle penalty_checkbox field type
  if (field.type === 'penalty_checkbox') {
    // Calculate penalty checkbox: count × penalty value
    const count = numValue || 0;
    const penaltyValue = field.penaltyValue || -10;
    return count > 0 ? count * penaltyValue : null;
  }

  return null;
};

/**
 * Calculate the total score for all fields
 * Handles all field types including penalties
 */
export const calculateTotalScore = (
  fields: JsonField[],
  scores: Record<string, any>
): number => {
  let total = 0;

  fields.forEach(field => {
    const fieldValue = scores[field.id];

    // Skip if no value
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
      return;
    }

    const valueNum = typeof fieldValue === 'number' ? fieldValue : Number(fieldValue);

    // Handle different field types
    if (field.type === 'number' && !isNaN(valueNum)) {
      total += valueNum;
    } else if (field.type === 'dropdown' && !isNaN(valueNum)) {
      // Convert dropdown selection to numeric value for scoring
      total += valueNum;
    } else if (field.type === 'scoring_scale' && !isNaN(valueNum)) {
      // Add scoring scale values to total
      total += valueNum;
    } else if (field.type === 'penalty' || field.type === 'penalty_checkbox') {
      // Use the shared penalty calculation function
      const penalty = calculatePenaltyDeduction(field, fieldValue);
      if (penalty !== null) {
        total += penalty;
      }
    } else if (field.type === 'calculated' && field.calculationType === 'sum' && field.calculationFields) {
      // Handle calculated fields that sum other fields
      field.calculationFields.forEach((fieldId: string) => {
        const val = scores[fieldId];
        const valNum = typeof val === 'number' ? val : Number(val);
        if (val !== '' && val !== null && val !== undefined && !isNaN(valNum)) {
          total += valNum;
        }
      });
    }
  });

  return total; // Allow negative scores
};

/**
 * Display the penalty deduction in a readable format
 * Always returns negative number or null
 */
export const formatPenaltyDeduction = (
  field: JsonField,
  value: any
): number | null => {
  const penalty = calculatePenaltyDeduction(field, value);
  if (penalty === null) return null;
  
  // Ensure it's always negative for display
  return -Math.abs(penalty);
};
