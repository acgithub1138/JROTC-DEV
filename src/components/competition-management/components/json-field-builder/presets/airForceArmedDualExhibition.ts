import { JsonField } from '../types';

export const airForceArmedDualExhibition: JsonField[] = [
  { id: '1', name: 'Performance Overview', type: 'section_header', penalty: false },
  { id: '2', name: 'REPORT IN & REPORT OUT', type: 'scoring_scale', pointValue: 15, penalty: false, scaleRanges: { poor: { min: 1, max: 3 }, average: { min: 4, max: 12 }, exceptional: { min: 13, max: 15 } } },
  { id: '3', name: 'Team/Cadet APPEARANCE', type: 'scoring_scale', pointValue: 15, penalty: false, scaleRanges: { poor: { min: 1, max: 3 }, average: { min: 4, max: 12 }, exceptional: { min: 13, max: 15 } } },
  { id: '4', name: 'Routine SHOWMANSHIP', type: 'scoring_scale', pointValue: 15, penalty: false, scaleRanges: { poor: { min: 1, max: 3 }, average: { min: 4, max: 12 }, exceptional: { min: 13, max: 15 } } },
  { id: '5', name: 'OVERALL IMPRESSION', type: 'scoring_scale', pointValue: 15, penalty: false, scaleRanges: { poor: { min: 1, max: 3 }, average: { min: 4, max: 12 }, exceptional: { min: 13, max: 15 } } },
  { id: '6', name: 'Team/Cadet BEARING', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 6 }, average: { min: 7, max: 24 }, exceptional: { min: 25, max: 30 } } },
  { id: '7', name: 'Routine MARCHING', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 6 }, average: { min: 7, max: 24 }, exceptional: { min: 25, max: 30 } } },
  { id: '8', name: 'Routine VARIETY', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 6 }, average: { min: 7, max: 24 }, exceptional: { min: 25, max: 30 } } },
  { id: '9', name: 'Routine PRECISION', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 6 }, average: { min: 7, max: 24 }, exceptional: { min: 25, max: 30 } } },
  { id: '10', name: 'Routine COMPOSITION & FLOW', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 6 }, average: { min: 7, max: 24 }, exceptional: { min: 25, max: 30 } } },
  { id: '11', name: 'Handling of the WEAPON', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 6 }, average: { min: 7, max: 24 }, exceptional: { min: 25, max: 30 } } },
  { id: '12', name: 'Routine DIFFICULTY (Floor)', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 6 }, average: { min: 7, max: 24 }, exceptional: { min: 25, max: 30 } } },
  { id: '13', name: 'Routine DIFFICULTY (Aerial)', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 6 }, average: { min: 7, max: 24 }, exceptional: { min: 25, max: 30 } } },
  { id: '14', name: 'MILITARY Flavor', type: 'scoring_scale', pointValue: 40, penalty: false, scaleRanges: { poor: { min: 1, max: 8 }, average: { min: 9, max: 32 }, exceptional: { min: 33, max: 40 } } },
  { id: '15', name: 'Penalties', type: 'section_header', penalty: false },
  { id: '16', name: 'Boundary Violations (10 pts each)', type: 'penalty_checkbox', penaltyValue: 10, penalty: true },
  { id: '17', name: 'Dropped Weapons - 1 Drop (5 pts)', type: 'penalty_checkbox', penaltyValue: 5, penalty: true },
  { id: '18', name: 'Dropped Weapons - 2+ Drops (25 pts each)', type: 'penalty_checkbox', penaltyValue: 25, penalty: true },
  { id: '19', name: 'Time Violations (1 pt per second)', type: 'penalty_checkbox', penaltyValue: 1, penalty: true }
];