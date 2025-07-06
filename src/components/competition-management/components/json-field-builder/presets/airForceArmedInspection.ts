import { JsonField } from '../types';

export const airForceArmedInspection: JsonField[] = [
  { id: '1', name: 'Unit & Commander Overall', type: 'section_header', penalty: false },
  { id: '2', name: 'Overall Appearance and Bearing', type: 'number', maxValue: 10, pointValue: 10, penalty: false },
  { id: '3', name: 'Knowledge of Drill and Ceremony', type: 'number', maxValue: 10, pointValue: 10, penalty: false },
  { id: '4', name: 'Knowledge of AFJROTC', type: 'number', maxValue: 10, pointValue: 10, penalty: false },
  { id: '5', name: 'Leadership Response', type: 'number', maxValue: 10, pointValue: 10, penalty: false },
  { id: '6', name: 'Individual Inspections', type: 'section_header', penalty: false },
  { id: '7', name: 'Overall Appearance and Bearing', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '8', name: 'Knowledge of Drill and Ceremony', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '9', name: 'Knowledge of AFJROTC', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '10', name: 'Leadership Response', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '11', name: 'Gig Line', type: 'text', penalty: false },
  { id: '12', name: 'Hair/Cosmetic Grooming', type: 'text', penalty: false },
  { id: '13', name: 'Shoes Unshined', type: 'text', penalty: false },
  { id: '14', name: 'Pants Unfit/Improper', type: 'text', penalty: false },
  { id: '15', name: 'Shirt Unfit/Improper', type: 'text', penalty: false }
];