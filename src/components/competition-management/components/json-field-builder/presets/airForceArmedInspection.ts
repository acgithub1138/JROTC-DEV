import { JsonField } from '../types';

export const airForceArmedInspection: JsonField[] = [
  { id: '1', name: 'Unit & Commander Overall', type: 'section_header', penalty: false },
  { id: '2', name: 'Overall Appearance and Bearing', type: 'scoring_scale', pointValue: 10, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
  { id: '3', name: 'Knowledge of Drill and Ceremony', type: 'scoring_scale', pointValue: 10, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
  { id: '4', name: 'Knowledge of AFJROTC', type: 'scoring_scale', pointValue: 10, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
  { id: '5', name: 'Leadership Response', type: 'scoring_scale', pointValue: 10, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
  { id: '6', name: 'Individual Inspections', type: 'section_header', penalty: false },
  { id: '7', name: 'Overall Appearance and Bearing', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
  { id: '8', name: 'Knowledge of Drill and Ceremony', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
  { id: '9', name: 'Knowledge of AFJROTC', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
  { id: '10', name: 'Leadership Response', type: 'scoring_scale', pointValue: 30, penalty: false, scaleRanges: { poor: { min: 1, max: 2 }, average: { min: 3, max: 8 }, exceptional: { min: 9, max: 10 } } },
  { id: '11', name: 'Gig Line', type: 'penalty_checkbox', penaltyValue: 1, penalty: true },
  { id: '12', name: 'Hair/Cosmetic Grooming', type: 'penalty_checkbox', penaltyValue: 1, penalty: true },
  { id: '13', name: 'Shoes Unshined', type: 'penalty_checkbox', penaltyValue: 1, penalty: true },
  { id: '14', name: 'Pants Unfit/Improper', type: 'penalty_checkbox', penaltyValue: 1, penalty: true },
  { id: '15', name: 'Shirt Unfit/Improper', type: 'penalty_checkbox', penaltyValue: 1, penalty: true }
];