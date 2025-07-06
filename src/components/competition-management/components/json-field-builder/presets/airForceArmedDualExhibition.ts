import { JsonField } from '../types';

export const airForceArmedDualExhibition: JsonField[] = [
  { id: '1', name: 'Performance Overview', type: 'section_header', penalty: false },
  { id: '2', name: 'REPORT IN & REPORT OUT', type: 'number', maxValue: 15, pointValue: 15, penalty: false },
  { id: '3', name: 'Team/Cadet APPEARANCE', type: 'number', maxValue: 15, pointValue: 15, penalty: false },
  { id: '4', name: 'Routine SHOWMANSHIP', type: 'number', maxValue: 15, pointValue: 15, penalty: false },
  { id: '5', name: 'OVERALL IMPRESSION', type: 'number', maxValue: 15, pointValue: 15, penalty: false },
  { id: '6', name: 'Team/Cadet BEARING', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '7', name: 'Routine MARCHING', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '8', name: 'Routine VARIETY', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '9', name: 'Routine PRECISION', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '10', name: 'Routine COMPOSITION & FLOW', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '11', name: 'Handling of the WEAPON', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '12', name: 'Routine DIFFICULTY (Floor)', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '13', name: 'Routine DIFFICULTY (Aerial)', type: 'number', maxValue: 30, pointValue: 30, penalty: false },
  { id: '14', name: 'MILITARY Flavor', type: 'number', maxValue: 40, pointValue: 40, penalty: false },
  { id: '15', name: 'Penalties', type: 'section_header', penalty: false },
  { id: '16', name: 'Boundary Violations', type: 'text', penalty: false },
  { id: '17', name: 'Dropped Weapons - 1 Drop', type: 'text', penalty: false },
  { id: '18', name: 'Dropped Weapons - 2+ Drops', type: 'text', penalty: false },
  { id: '19', name: 'Time Violations', type: 'text', penalty: false }
];